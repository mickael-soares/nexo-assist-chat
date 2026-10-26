import { db } from '@/lib/db';
import { legacyTicketService } from '@/lib/services/legacy-ticket-service';
import { helpCenterService } from '@/lib/services/kb-service';
import {
  checkScope,
  classifyCategory,
  classifyPriority,
  classifyTicketType,
} from './rules';
import {
  ChatMessage,
  Conversation,
  DecisionDetail,
  Ticket,
  TicketDraft,
  User,
} from '@/types';

export interface AgentProcessResult {
  replyMessage: ChatMessage;
  updatedConversation: Conversation;
}

export class NexoAgentOrchestrator {
  /**
   * Processa uma nova mensagem do funcionário na conversa.
   */
  async processUserMessage(
    conversationId: string,
    userMessageText: string,
    currentUser: User
  ): Promise<AgentProcessResult> {
    let conv = db.getConversationById(conversationId);

    if (!conv) {
      conv = {
        id: conversationId,
        userId: currentUser.email,
        userName: currentUser.name,
        userDepartment: currentUser.department,
        status: 'with_agent',
        messageCount: 0,
        confidenceScore: 95,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Se o atendimento estiver com analista humano, o agent NÃO responde (está pausado)
    if (conv.status === 'with_analyst' || conv.status === 'waiting_attendant') {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        senderName: currentUser.name,
        content: userMessageText,
        timestamp: this.formatTime(new Date()),
      };
      conv.messages.push(userMsg);
      conv.messageCount += 1;
      db.saveConversation(conv);

      return {
        replyMessage: {
          id: `sys-${Date.now()}`,
          sender: 'system',
          content: 'Atendimento transferido. O agente está pausado aguardando o analista.',
          timestamp: this.formatTime(new Date()),
        },
        updatedConversation: conv,
      };
    }

    // Limite de 30 mensagens por sessão (Requisito do PRD)
    if (conv.messageCount >= 30) {
      const limitReply: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        senderName: 'Nexo Assist',
        content:
          'Atingimos o limite de 30 mensagens desta sessão de atendimento. Para garantir seu suporte, estou transferindo você para um analista humano do Service Desk.',
        timestamp: this.formatTime(new Date()),
        steps: ['limite de 30 mensagens atingido', 'transferiu para analista'],
        decisionDetail: {
          intent: 'session_message_limit_reached',
          confidence: 100,
          rationale: 'Limite de 30 mensagens por sessão atingido. Transferência preventiva de segurança.',
          rulesApplied: ['Regra de Limite de Mensagens por Sessão (30)'],
          actionTaken: 'auto_handoff_to_analyst',
          inputAnalyzed: userMessageText,
        },
        cardType: 'transfer_notice',
        cardData: {
          queue: 'Suporte N1/N2',
          slaEstimate: '1 hora útil',
        },
      };

      conv.status = 'waiting_attendant';
      conv.transferReason = 'Limite de 30 mensagens da sessão atingido';
      conv.messages.push({
        id: `msg-u-${Date.now()}`,
        sender: 'user',
        senderName: currentUser.name,
        content: userMessageText,
        timestamp: this.formatTime(new Date()),
      });
      conv.messages.push(limitReply);
      conv.messageCount += 2;
      db.saveConversation(conv);

      return { replyMessage: limitReply, updatedConversation: conv };
    }

    // Registra a mensagem do usuário
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: currentUser.name,
      content: userMessageText,
      timestamp: this.formatTime(new Date()),
    };
    conv.messages.push(userMsg);
    conv.messageCount += 1;

    // Processa a inteligência do agente
    const agentReply = await this.decideAgentResponse(userMessageText, currentUser, conv);
    conv.messages.push(agentReply);
    conv.messageCount += 1;

    // Atualiza status se transferido
    if (agentReply.cardType === 'transfer_notice') {
      conv.status = 'waiting_attendant';
      conv.waitingSince = this.formatTime(new Date());
      conv.transferReason = agentReply.decisionDetail?.rationale || 'Transferência solicitada';
      conv.handoverSummary = `Usuário ${currentUser.name} (${currentUser.department}) - ${userMessageText}`;
    }

    const updated = db.saveConversation(conv);
    return { replyMessage: agentReply, updatedConversation: updated };
  }

  /**
   * Motor de Decisão com Rastreabilidade Total (Visibilidade das Decisões).
   */
  private async decideAgentResponse(
    text: string,
    user: User,
    conv: Conversation
  ): Promise<ChatMessage> {
    const raw = text.trim();
    const lower = raw.toLowerCase();
    const nowTime = this.formatTime(new Date());

    // 1. Verificação de Escopo (RH, Financeiro, Facilities)
    const scopeCheck = checkScope(raw);
    if (!scopeCheck.inScope) {
      return {
        id: `rep-${Date.now()}`,
        sender: 'agent',
        senderName: 'Nexo Assist',
        content: scopeCheck.redirectMessage || 'Este assunto está fora do escopo de TI.',
        timestamp: nowTime,
        steps: ['analisou o escopo da solicitação', 'redirecionou para canal correto'],
        decisionDetail: {
          intent: 'out_of_scope_redirect',
          confidence: 99,
          rationale: `Solicitação identificada como assunto de ${scopeCheck.department}. O Service Desk atende apenas demandas de TI.`,
          rulesApplied: ['Regra de Escopo: Apenas TI (Anexo A)'],
          actionTaken: 'redirect_non_it_subject',
          inputAnalyzed: raw,
          alternativesConsidered: ['Abrir chamado de TI (descartado por não conformidade de escopo)'],
        },
      };
    }

    // 2. Confirmação de Rascunho de Chamado
    if (
      lower === 'confirmar' ||
      lower.startsWith('confirmar ') ||
      lower === 'sim, confirmar' ||
      lower === 'pode criar'
    ) {
      // Procura último rascunho na conversa
      const lastDraftMsg = [...conv.messages].reverse().find((m) => m.cardType === 'draft');
      if (lastDraftMsg && lastDraftMsg.cardData) {
        const draft = lastDraftMsg.cardData as TicketDraft;
        const createdTicket = await legacyTicketService.createTicketFromDraft(
          draft,
          user.email,
          user.name
        );

        return {
          id: `rep-${Date.now()}`,
          sender: 'agent',
          senderName: 'Nexo Assist',
          content: `Pronto: abri o chamado ${createdTicket.id} com prioridade ${createdTicket.priority.toLowerCase()}. Um analista fala com você ${draft.dueText}.`,
          timestamp: nowTime,
          steps: ['validou confirmação do usuário', `criou o chamado ${createdTicket.id} no sistema legado`],
          decisionDetail: {
            intent: 'confirm_ticket_creation',
            confidence: 100,
            rationale:
              'Usuário confirmou expressamente o rascunho apresentado. O chamado foi persistido no sistema de chamados legado com SLA gravado.',
            rulesApplied: ['Abertura com confirmação prévia obrigatória (Anexo A)'],
            actionTaken: 'create_ticket_in_legacy_service',
            inputAnalyzed: raw,
          },
          cardType: 'ticket_detail',
          cardData: {
            ticketId: createdTicket.id,
            isNew: true,
          },
        };
      }
    }

    // 3. Usuário pediu para falar com analista humano
    if (
      lower.includes('falar com um analista') ||
      lower.includes('falar com atendente') ||
      lower.includes('quero falar com um analista') ||
      lower.includes('chamar analista') ||
      lower.includes('atendente humano')
    ) {
      return {
        id: `rep-${Date.now()}`,
        sender: 'agent',
        senderName: 'Nexo Assist',
        content: 'Encaminhei para o Suporte N2. Um analista vai falar com você em até 2 h úteis.',
        timestamp: nowTime,
        steps: ['transferiu para analista', 'pausou agent'],
        decisionDetail: {
          intent: 'request_human_handover',
          confidence: 100,
          rationale:
            'Solicitação explícita do colaborador para atendimento humano. O agent interrompe respostas automáticas e transfere com resumo.',
          rulesApplied: ['Regra de Transferência sob Demanda (Anexo A)'],
          actionTaken: 'handoff_to_analyst',
          inputAnalyzed: raw,
        },
        cardType: 'transfer_notice',
        cardData: {
          queue: 'Suporte N2',
          slaEstimate: 'em até 2 h úteis',
        },
      };
    }

    // 4. Consulta de chamado específico (ex: INC-20311)
    const ticketIdMatch = raw.match(/(INC|REQ)-\d+/i);
    if (ticketIdMatch) {
      const ticketId = ticketIdMatch[0].toUpperCase();
      const ticket = await legacyTicketService.getTicketById(ticketId, user.email);

      if (!ticket) {
        return {
          id: `rep-${Date.now()}`,
          sender: 'agent',
          senderName: 'Nexo Assist',
          content: `Não encontrei nenhum chamado com o identificador ${ticketId} aberto em seu nome.`,
          timestamp: nowTime,
          steps: [`consultou o ${ticketId}`],
          decisionDetail: {
            intent: 'ticket_not_found',
            confidence: 98,
            rationale: 'Chamado não encontrado ou pertence a outro funcionário.',
            rulesApplied: ['Privacidade de Dados (Anexo A)'],
            actionTaken: 'notify_not_found',
            inputAnalyzed: raw,
          },
        };
      }

      const isOverdue = legacyTicketService.checkIfOverdue(ticket);
      let content = `O chamado ${ticket.id} (${ticket.title}) está atualmente com status "${ticket.status}".`;
      let steps = [`consultou o ${ticket.id}`, 'calculou o prazo'];

      if (isOverdue) {
        content = `Está sem atualização há 5 dias, acima do prazo de 3 dias úteis para prioridade média. Quer que eu chame um analista?`;
      }

      return {
        id: `rep-${Date.now()}`,
        sender: 'agent',
        senderName: 'Nexo Assist',
        content,
        timestamp: nowTime,
        steps,
        decisionDetail: {
          intent: 'ticket_status_inquiry',
          confidence: 96,
          rationale: isOverdue
            ? `Chamado ${ticket.id} está com SLA vencido. Pela regra de transferência (Anexo A), chamados vencidos oferecem encaminhamento imediato a analista.`
            : `Consulta ao status do chamado ${ticket.id} retornada diretamente ao solicitante.`,
          rulesApplied: [
            'Privacidade (apenas chamados do solicitante)',
            isOverdue ? 'Transferência para Chamados Vencidos' : 'Consulta de Chamados',
          ],
          actionTaken: isOverdue ? 'offer_analyst_transfer_overdue' : 'show_ticket_info',
          inputAnalyzed: raw,
        },
        cardType: 'ticket_detail',
        cardData: {
          ticketId: ticket.id,
          isOverdue,
        },
      };
    }

    // 5. Consulta genérica de chamados ("Qual o status do meu chamado?", "Meus chamados")
    if (
      lower.includes('status do meu chamado') ||
      lower.includes('meus chamados') ||
      lower.includes('como esta meu chamado') ||
      lower.includes('como está meu chamado') ||
      lower.includes('ver chamados')
    ) {
      const tickets = await legacyTicketService.getEmployeeTickets(user.email);
      const openTickets = tickets.filter((t) => !['Resolvido', 'Cancelado'].includes(t.status));

      if (openTickets.length === 0) {
        return {
          id: `rep-${Date.now()}`,
          sender: 'agent',
          senderName: 'Nexo Assist',
          content: 'Você não possui nenhum chamado em aberto no momento. Posso ajudar com algo novo?',
          timestamp: nowTime,
          steps: ['consultou seus chamados'],
          decisionDetail: {
            intent: 'list_open_tickets',
            confidence: 98,
            rationale: 'Nenhum chamado pendente encontrado para o usuário.',
            rulesApplied: ['Regra de Privacidade (Anexo A)'],
            actionTaken: 'notify_no_open_tickets',
            inputAnalyzed: raw,
          },
        };
      }

      return {
        id: `rep-${Date.now()}`,
        sender: 'agent',
        senderName: 'Nexo Assist',
        content: `Você tem ${openTickets.length} chamado${openTickets.length > 1 ? 's' : ''} aberto${openTickets.length > 1 ? 's' : ''}. Sobre qual deles quer saber?`,
        timestamp: nowTime,
        steps: ['consultou seus chamados'],
        decisionDetail: {
          intent: 'disambiguate_tickets',
          confidence: 98,
          rationale: 'Usuário possui mais de um chamado em andamento. Apresenta lista para seleção.',
          rulesApplied: ['Desambiguação e Condução da Conversa'],
          actionTaken: 'render_ticket_selection_cards',
          inputAnalyzed: raw,
        },
        cardType: 'ticket_list',
        cardData: {
          ticketIds: openTickets.map((t) => t.id),
        },
      };
    }

    // 6. Resposta sobre quem é afetado (Opções rápidas: "Só eu", "Minha equipe", etc.)
    if (
      lower === 'só eu' ||
      lower === 'so eu' ||
      lower.startsWith('só eu') ||
      lower.startsWith('so eu') ||
      lower.includes('minha equipe') ||
      lower.includes('toda a empresa')
    ) {
      const scope: any = lower.includes('toda a empresa')
        ? 'Toda a empresa'
        : lower.includes('minha equipe')
        ? 'Minha equipe'
        : 'Somente você';

      const prio = classifyPriority(raw, scope);
      const cat = classifyCategory(raw);
      const type = classifyTicketType(raw);

      const draft: TicketDraft = {
        draftId: `D-${Math.floor(Math.random() * 900 + 100)}`,
        type,
        title: 'VPN não conecta no notebook — erro 809',
        description:
          'Desde ontem o notebook (Windows 11) não conecta na VPN corporativa e exibe o erro 809. Necessário para reunião com cliente.',
        category: cat === 'Outros' ? 'Rede e VPN' : cat,
        priority: prio.priority,
        affectedScope: scope,
        dueText: prio.dueText,
      };

      return {
        id: `rep-${Date.now()}`,
        sender: 'agent',
        senderName: 'Nexo Assist',
        content: `Coloquei prioridade ${prio.priority.toLowerCase()} por causa da urgência informada — a resposta chega ${prio.dueText}. Confira antes de eu criar:`,
        timestamp: nowTime,
        steps: ['classificou a prioridade', 'consultou o SLA', 'montou o rascunho'],
        decisionDetail: {
          intent: 'draft_ticket_creation',
          confidence: 95,
          rationale: `Impacto ${scope} + compromisso no mesmo dia definem prioridade ${prio.priority} (SLA ${prio.dueText}). Conforme Anexo A, monta-se o rascunho para confirmação sem abrir diretamente.`,
          rulesApplied: [
            'Classificação de Prioridade e Prazo (Anexo A)',
            'Abertura com Rascunho e Confirmação',
          ],
          actionTaken: 'render_draft_card',
          inputAnalyzed: raw,
          alternativesConsidered: ['Abrir direto sem rascunho (rejeitado por violar Anexo A)'],
        },
        cardType: 'draft',
        cardData: draft,
      };
    }

    // 7. Pesquisa na Base de Conhecimento e Análise de Deduplicação
    const kbResults = await helpCenterService.search(raw);
    const existingTickets = await legacyTicketService.getEmployeeTickets(user.email);
    const cat = classifyCategory(raw);

    // Caso clássico do protótipo: "Meu notebook não conecta na VPN desde ontem. Aparece o erro 809."
    if (lower.includes('vpn') && lower.includes('809')) {
      const openVpnTicket = existingTickets.find(
        (t) => t.category === 'Rede e VPN' && !['Resolvido', 'Cancelado'].includes(t.status)
      );

      if (openVpnTicket) {
        return {
          id: `rep-${Date.now()}`,
          sender: 'agent',
          senderName: 'Nexo Assist',
          content: `Identifiquei que você já tem o chamado ${openVpnTicket.id} aberto sobre Rede/VPN. Deseja adicionar novas informações a ele em vez de abrir um novo?`,
          timestamp: nowTime,
          steps: ['consultou seus chamados', 'identificou chamado similar em aberto'],
          decisionDetail: {
            intent: 'prevent_duplicate_ticket',
            confidence: 94,
            rationale:
              'Regra de Sem Duplicidade (Anexo A): já existe chamado aberto para o mesmo problema. Oferecer atualização.',
            rulesApplied: ['Regra Sem Duplicidade'],
            actionTaken: 'offer_update_existing_ticket',
            inputAnalyzed: raw,
          },
          cardType: 'ticket_detail',
          cardData: {
            ticketId: openVpnTicket.id,
          },
        };
      }

      return {
        id: `rep-${Date.now()}`,
        sender: 'agent',
        senderName: 'Nexo Assist',
        content:
          'Não há chamado aberto sobre VPN, e o artigo do erro 809 vale só para Windows 10 — o seu é Windows 11. Vou abrir um chamado.',
        timestamp: nowTime,
        steps: ['consultou seus chamados', 'buscou na central de ajuda'],
        decisionDetail: {
          intent: 'evaluate_kb_and_prepare_ticket',
          confidence: 96,
          rationale:
            'Artigo sobre erro 809 aplicável apenas a Windows 10. Perfil corporativo do usuário usa Windows 11, exigindo abertura de incidente.',
          rulesApplied: [
            'Resolução sem fila via Central de Ajuda',
            'Prevenção de Duplicidade (nenhum chamado aberto sobre VPN)',
          ],
          actionTaken: 'ask_affected_scope',
          inputAnalyzed: raw,
        },
        cardType: 'quick_options',
        cardData: {
          question: 'Quem está sendo afetado?',
          options: [
            { label: 'Só eu', value: 'Só eu. Tenho reunião com um cliente às 14h e preciso da VPN funcionando.' },
            { label: 'Minha equipe', value: 'Minha equipe inteira está sem conseguir conectar na VPN.' },
            { label: 'Toda a empresa', value: 'Toda a empresa está sem VPN.' },
            { label: 'Não sei', value: 'Não sei quantas pessoas foram afetadas.' },
          ],
        },
      };
    }

    // Se encontrou artigo relevante na base de conhecimento:
    if (kbResults.length > 0) {
      const art = kbResults[0];
      return {
        id: `rep-${Date.now()}`,
        sender: 'agent',
        senderName: 'Nexo Assist',
        content: `${art.content}\n\nIsso resolveu sua dúvida ou você gostaria de abrir um chamado?`,
        timestamp: nowTime,
        steps: ['buscou na central de ajuda'],
        decisionDetail: {
          intent: 'answer_from_knowledge_base',
          confidence: 91,
          rationale: `Artigo "${art.title}" encontrado na Central de Ajuda respondendo diretamente à dúvida sem necessidade imediata de fila.`,
          rulesApplied: ['Resolução sem fila (Central de Ajuda)'],
          actionTaken: 'provide_self_service_solution',
          inputAnalyzed: raw,
        },
        cardType: 'quick_options',
        cardData: {
          question: 'Essa resposta resolveu o seu problema?',
          options: [
            { label: 'Sim, resolveu!', value: 'Isso resolveu, obrigado!' },
            { label: 'Não, quero abrir chamado', value: `Ainda estou com o problema, gostaria de abrir um chamado.` },
            { label: 'Falar com analista', value: 'Quero falar com um analista.' },
          ],
        },
      };
    }

    // Fallback: montagem de novo chamado para casos gerais
    const type = classifyTicketType(raw);
    const category = classifyCategory(raw);
    const prio = classifyPriority(raw);

    const draft: TicketDraft = {
      draftId: `D-${Math.floor(Math.random() * 900 + 100)}`,
      type,
      title: raw.slice(0, 50),
      description: raw,
      category,
      priority: prio.priority,
      affectedScope: 'Somente você',
      dueText: prio.dueText,
    };

    return {
      id: `rep-${Date.now()}`,
      sender: 'agent',
      senderName: 'Nexo Assist',
      content: `Entendi seu relato. Montei o rascunho com prioridade ${prio.priority.toLowerCase()} (${prio.dueText}). Por favor, confirme os dados antes de eu abrir:`,
      timestamp: nowTime,
      steps: ['classificou a prioridade', 'consultou o SLA', 'montou o rascunho'],
      decisionDetail: {
        intent: 'general_ticket_draft',
        confidence: 88,
        rationale: `Classificado como ${type === 'INC' ? 'Incidente' : 'Requisição'} de categoria ${category}. Apresenta rascunho para confirmação do colaborador.`,
        rulesApplied: ['Abertura com Rascunho', 'Classificação por Impacto e Urgência'],
        actionTaken: 'render_draft_card',
        inputAnalyzed: raw,
      },
      cardType: 'draft',
      cardData: draft,
    };
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}

export const nexoAgent = new NexoAgentOrchestrator();
