export type TicketType = 'INC' | 'REQ';

export type TicketCategory =
  | 'Acesso'
  | 'Rede e VPN'
  | 'Hardware'
  | 'Software'
  | 'E-mail'
  | 'Outros';

export type PriorityLevel = 'Crítica' | 'Alta' | 'Média' | 'Baixa';

export type TicketStatus =
  | 'Aberto'
  | 'Em andamento'
  | 'Aguardando analista'
  | 'Em atendimento'
  | 'Aprovado'
  | 'Resolvido'
  | 'Cancelado';

export type AffectedScope = 'Somente você' | 'Minha equipe' | 'Toda a empresa' | 'Não sei';

export interface Ticket {
  id: string; // e.g. INC-20311
  type: TicketType;
  title: string;
  description: string;
  category: TicketCategory;
  priority: PriorityLevel;
  status: TicketStatus;
  affectedScope: AffectedScope;
  openedBy: string; // e-mail do funcionário
  openedByName?: string;
  openedAt: string; // ISO
  updatedAt: string; // ISO
  dueAt: string; // ISO
  isOverdue: boolean;
  assignedTo?: string; // e-mail do analista
  assignedToName?: string;
  history: Array<{
    timestamp: string;
    author: string;
    authorRole: 'agent' | 'user' | 'analyst' | 'system';
    note: string;
  }>;
}

export interface TicketDraft {
  draftId: string;
  type: TicketType;
  title: string;
  description: string;
  category: TicketCategory;
  priority: PriorityLevel;
  affectedScope: AffectedScope;
  dueText: string;
  existingTicketIdToUpdate?: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: TicketCategory;
  tags: string[];
  content: string;
  relevanceKeywords: string[];
}

export type ConversationStatus =
  | 'with_agent'
  | 'waiting_attendant'
  | 'with_analyst'
  | 'resolved';

export interface DecisionDetail {
  intent: string;
  confidence: number; // 0 a 100%
  rationale: string;
  rulesApplied: string[];
  actionTaken: string;
  inputAnalyzed: string;
  alternativesConsidered?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'analyst' | 'system';
  senderName?: string;
  senderRole?: string;
  content: string;
  timestamp: string;
  steps?: string[]; // ex: ["consultou seus chamados", "buscou na central de ajuda"]
  decisionDetail?: DecisionDetail;
  cardType?: 'draft' | 'ticket_list' | 'ticket_detail' | 'quick_options' | 'transfer_notice';
  cardData?: any;
}

export interface Conversation {
  id: string;
  userId: string; // e-mail do funcionário
  userName: string;
  userDepartment: string;
  status: ConversationStatus;
  analystId?: string;
  analystName?: string;
  activeTicketId?: string;
  messageCount: number; // max 30
  confidenceScore: number;
  waitingSince?: string;
  transferReason?: string;
  handoverSummary?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  initials: string;
  role: 'employee' | 'analyst';
  isOnline: boolean;
}
