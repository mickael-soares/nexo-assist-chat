import { db } from '@/lib/db';
import { Ticket, TicketDraft, TicketType, TicketCategory, PriorityLevel, AffectedScope } from '@/types';

export class LegacyTicketingError extends Error {
  constructor(message: string, public statusCode: number = 503) {
    super(message);
    this.name = 'LegacyTicketingError';
  }
}

/**
 * Serviço simulado de chamados legado da Nexo.
 * Isolado do agent, com validação de escopo, cálculo de SLA e simulação de indisponibilidade intermitente.
 */
export class LegacyTicketService {
  private simulateFlakiness: boolean;

  constructor(simulateFlakiness = false) {
    // Pode ser ativado via env ou parâmetro para demonstrar resiliência
    this.simulateFlakiness = simulateFlakiness || process.env.SIMULATE_LEGACY_FLAKINESS === 'true';
  }

  private async checkLegacyHealth() {
    // Simula pequena latência de sistema legado (50ms - 150ms)
    await new Promise((r) => setTimeout(r, 80));

    if (this.simulateFlakiness && Math.random() < 0.05) {
      throw new LegacyTicketingError(
        'Sistema de chamados legado temporariamente indisponível (HTTP 503 Gateway Timeout).',
        503
      );
    }
  }

  /**
   * Consulta os chamados de um funcionário específico (Privacidade: isolamento garantido).
   */
  async getEmployeeTickets(userEmail: string): Promise<Ticket[]> {
    await this.checkLegacyHealth();
    if (!userEmail) throw new Error('E-mail do colaborador é obrigatório.');
    return db.getTickets(userEmail);
  }

  /**
   * Consulta detalhada de um chamado por ID, garantindo que pertença ao solicitante ou seja acessado por analista.
   */
  async getTicketById(ticketId: string, requesterEmail: string, isAnalyst = false): Promise<Ticket | null> {
    await this.checkLegacyHealth();
    const ticket = db.getTicketById(ticketId);
    if (!ticket) return null;

    if (!isAnalyst && ticket.openedBy.toLowerCase() !== requesterEmail.toLowerCase()) {
      throw new Error('Acesso negado: informações de chamado só podem ser passadas a quem o abriu.');
    }

    return ticket;
  }

  /**
   * Cria um novo chamado no sistema legado após confirmação do rascunho.
   */
  async createTicketFromDraft(
    draft: TicketDraft,
    userEmail: string,
    userName: string
  ): Promise<Ticket> {
    await this.checkLegacyHealth();

    const now = new Date();
    const dueAt = this.calculateDueDate(draft.priority);

    const newTicket = db.createTicket({
      type: draft.type,
      title: draft.title,
      description: draft.description,
      category: draft.category,
      priority: draft.priority,
      status: 'Aberto',
      affectedScope: draft.affectedScope,
      openedBy: userEmail,
      openedByName: userName,
      openedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      dueAt: dueAt.toISOString(),
      isOverdue: false,
      history: [
        {
          timestamp: now.toISOString(),
          author: userName,
          authorRole: 'user',
          note: `Chamado aberto via Nexo Assist com prioridade ${draft.priority}.`,
        },
      ],
    });

    return newTicket;
  }

  /**
   * Atualiza um chamado existente (sem duplicidade).
   */
  async addNoteOrUpdate(
    ticketId: string,
    note: string,
    author: string,
    authorRole: 'user' | 'agent' | 'analyst' = 'user'
  ): Promise<Ticket> {
    await this.checkLegacyHealth();
    const existing = db.getTicketById(ticketId);
    if (!existing) throw new Error(`Chamado ${ticketId} não encontrado.`);

    const now = new Date().toISOString();
    const updatedHistory = [
      ...existing.history,
      {
        timestamp: now,
        author,
        authorRole,
        note,
      },
    ];

    const updated = db.updateTicket(ticketId, {
      history: updatedHistory,
      updatedAt: now,
    });

    if (!updated) throw new Error('Falha ao atualizar chamado no sistema legado.');
    return updated;
  }

  /**
   * Reabertura de chamado resolvido há até 7 dias (Regra do Anexo A).
   */
  async reopenTicket(ticketId: string, reason: string, userEmail: string): Promise<Ticket> {
    await this.checkLegacyHealth();
    const ticket = db.getTicketById(ticketId);
    if (!ticket) throw new Error(`Chamado ${ticketId} não encontrado.`);

    if (ticket.status !== 'Resolvido') {
      throw new Error(`Chamado ${ticketId} não está com status 'Resolvido'.`);
    }

    const updatedDate = new Date(ticket.updatedAt);
    const diffDays = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      throw new Error(
        `Chamado ${ticketId} resolvido há mais de 7 dias não pode ser reaberto. Um novo chamado deve ser aberto.`
      );
    }

    const now = new Date().toISOString();
    const dueAt = this.calculateDueDate(ticket.priority).toISOString();

    const reopened = db.updateTicket(ticketId, {
      status: 'Aberto',
      dueAt,
      updatedAt: now,
      history: [
        ...ticket.history,
        {
          timestamp: now,
          author: userEmail,
          authorRole: 'user',
          note: `Chamado reaberto pelo usuário: ${reason}`,
        },
      ],
    });

    if (!reopened) throw new Error('Falha ao reabrir chamado.');
    return reopened;
  }

  /**
   * Calcula o prazo (SLA) de acordo com a tabela do Anexo A:
   * - Crítica: 1 hora (plantão 24h)
   * - Alta: 4 horas úteis
   * - Média: 3 dias úteis
   * - Baixa: 5 dias úteis
   */
  calculateDueDate(priority: PriorityLevel): Date {
    const d = new Date();
    switch (priority) {
      case 'Crítica':
        d.setHours(d.getHours() + 1);
        return d;
      case 'Alta':
        d.setHours(d.getHours() + 4);
        return d;
      case 'Média':
        d.setDate(d.getDate() + 3);
        return d;
      case 'Baixa':
      default:
        d.setDate(d.getDate() + 5);
        return d;
    }
  }

  /**
   * Verifica se o chamado ultrapassou o SLA (está vencido).
   */
  checkIfOverdue(ticket: Ticket): boolean {
    if (['Resolvido', 'Cancelado'].includes(ticket.status)) return false;
    return new Date(ticket.dueAt).getTime() < Date.now();
  }
}

export const legacyTicketService = new LegacyTicketService();
