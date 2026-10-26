import { PriorityLevel, TicketCategory, TicketType, AffectedScope } from '@/types';

export interface ScopeCheckResult {
  inScope: boolean;
  department?: 'RH' | 'Financeiro' | 'Facilities';
  redirectMessage?: string;
}

/**
 * Validação de escopo: Apenas assuntos de TI são atendidos.
 * Outros assuntos (RH, financeiro, facilities) são redirecionados educadamente.
 */
export function checkScope(message: string): ScopeCheckResult {
  const text = message.toLowerCase();

  // RH
  if (
    text.includes('holerite') ||
    text.includes('folha de pagamento') ||
    text.includes('ferias') ||
    text.includes('férias') ||
    text.includes('beneficio') ||
    text.includes('benefício') ||
    text.includes('plano de saude') ||
    text.includes('vale refeicao') ||
    text.includes('atestado')
  ) {
    return {
      inScope: false,
      department: 'RH',
      redirectMessage:
        'Assuntos de Recursos Humanos (férias, benefícios, folha de pagamento) são tratados pelo portal de RH no link rh.nexo.local ou pelo ramal 3100. O Nexo Assist atende exclusivamente demandas de TI.',
    };
  }

  // Financeiro
  if (
    text.includes('reembolso') ||
    text.includes('nota fiscal') ||
    text.includes('prestacao de contas') ||
    text.includes('prestao de contas') ||
    text.includes('pagamento de fornecedor') ||
    text.includes('adiantamento')
  ) {
    return {
      inScope: false,
      department: 'Financeiro',
      redirectMessage:
        'Solicitações financeiras (reembolso de despesas, notas fiscais, adiantamentos) devem ser encaminhadas ao portal do Financeiro em financeiro.nexo.local. O Nexo Assist atende exclusivamente demandas de TI.',
    };
  }

  // Facilities
  if (
    text.includes('ar condicionado') ||
    text.includes('lampada') ||
    text.includes('lâmpada') ||
    text.includes('vazamento') ||
    text.includes('cadeira quebrada') ||
    text.includes('chave do escritorio') ||
    text.includes('manutencao predial')
  ) {
    return {
      inScope: false,
      department: 'Facilities',
      redirectMessage:
        'Questões de infraestrutura predial e facilities (ar-condicionado, limpeza, manutenção física) são atendidas pelo ramal 2200 ou pelo e-mail facilities@nexo.com.br.',
    };
  }

  return { inScope: true };
}

/**
 * Classificação de Tipo de Chamado:
 * - INC (Incidente): quando algo parou ou não funciona
 * - REQ (Requisição): quando é um pedido de acesso, equipamento ou software
 */
export function classifyTicketType(text: string): TicketType {
  const lower = text.toLowerCase();
  const reqKeywords = [
    'pedido',
    'solicito',
    'solicitar',
    'quero',
    'requisicao',
    'requisio',
    'segundo monitor',
    'novo monitor',
    'novo notebook',
    'novo acesso',
    'preciso de licenca',
    'preciso de licena',
    'solicitar teclado',
    'comprar',
  ];

  if (reqKeywords.some((k) => lower.includes(k))) {
    return 'REQ';
  }

  return 'INC';
}

/**
 * Classificação de Categoria de TI:
 * Acesso | Rede e VPN | Hardware | Software | E-mail | Outros
 */
export function classifyCategory(text: string): TicketCategory {
  const lower = text.toLowerCase();

  if (lower.includes('vpn') || lower.includes('rede') || lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('internet') || lower.includes('809')) {
    return 'Rede e VPN';
  }
  if (lower.includes('senha') || lower.includes('sap') || lower.includes('acesso') || lower.includes('login') || lower.includes('bloqueada') || lower.includes('sharepoint') || lower.includes('pasta')) {
    return 'Acesso';
  }
  if (lower.includes('monitor') || lower.includes('notebook') || lower.includes('mouse') || lower.includes('teclado') || lower.includes('computador') || lower.includes('lento') || lower.includes('bateria')) {
    return 'Hardware';
  }
  if (lower.includes('outlook') || lower.includes('email') || lower.includes('e-mail') || lower.includes('mensagem')) {
    return 'E-mail';
  }
  if (lower.includes('windows') || lower.includes('excel') || lower.includes('teams') || lower.includes('projuris') || lower.includes('instalacao') || lower.includes('software') || lower.includes('app')) {
    return 'Software';
  }

  return 'Outros';
}

/**
 * Classificação de Prioridade e Prazo combinando Impacto e Urgência:
 * - Crítica (1h): Algo parado para uma equipe ou para a empresa
 * - Alta (4h úteis): Impede uma pessoa de trabalhar, ou há compromisso no mesmo dia
 * - Média (3 dias úteis): Atrapalha, mas há alternativa
 * - Baixa (5 dias úteis): Pedidos e melhorias sem urgência
 */
export function classifyPriority(text: string, scope?: AffectedScope): {
  priority: PriorityLevel;
  dueText: string;
  rationale: string;
} {
  const lower = text.toLowerCase();

  // Crítica: equipe inteira ou empresa parada
  if (
    scope === 'Toda a empresa' ||
    scope === 'Minha equipe' ||
    lower.includes('equipe inteira') ||
    lower.includes('toda a equipe') ||
    lower.includes('empresa inteira') ||
    lower.includes('sistema central fora') ||
    lower.includes('servidor caiu')
  ) {
    return {
      priority: 'Crítica',
      dueText: 'em até 1 hora (plantão 24h)',
      rationale: 'Impacto severo afetando equipe ou a empresa inteira.',
    };
  }

  // Alta: impede de trabalhar ou reunião/compromisso no mesmo dia
  if (
    lower.includes('reuniao') ||
    lower.includes('reunião') ||
    lower.includes('as 14h') ||
    lower.includes('às 14h') ||
    lower.includes('às ') ||
    lower.includes('hoje') ||
    lower.includes('ainda hoje') ||
    lower.includes('nao consigo trabalhar') ||
    lower.includes('não consigo trabalhar') ||
    lower.includes('impede de trabalhar') ||
    lower.includes('urgente') ||
    lower.includes('cliente')
  ) {
    return {
      priority: 'Alta',
      dueText: 'em até 4 h úteis',
      rationale: 'Impede o funcionário de trabalhar ou há compromisso/reunião no mesmo dia.',
    };
  }

  // Baixa: melhoria ou pedido sem urgência
  if (
    lower.includes('quando der') ||
    lower.includes('sem pressa') ||
    lower.includes('segundo monitor') ||
    lower.includes('melhoria') ||
    lower.includes('sugestao')
  ) {
    return {
      priority: 'Baixa',
      dueText: 'em até 5 dias úteis',
      rationale: 'Requisição ou melhoria sem impacto no trabalho imediato.',
    };
  }

  // Média: padrão quando atrapalha mas há contorno
  return {
    priority: 'Média',
    dueText: 'em até 3 dias úteis',
    rationale: 'Problema causa impacto operacional moderado, havendo contorno temporário.',
  };
}
