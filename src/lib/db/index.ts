import fs from 'fs';
import path from 'path';
import { User, Ticket, KnowledgeArticle, Conversation } from '@/types';
import { SEED_USERS, SEED_ARTICLES, SEED_TICKETS, SEED_CONVERSATIONS } from './seed';

interface DatabaseSchema {
  users: User[];
  articles: KnowledgeArticle[];
  tickets: Ticket[];
  conversations: Conversation[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[DB] Erro ao ler base existente, reinicializando seed:', err);
    }

    const initial: DatabaseSchema = {
      users: SEED_USERS,
      articles: SEED_ARTICLES,
      tickets: SEED_TICKETS,
      conversations: SEED_CONVERSATIONS,
    };
    this.persist(initial);
    return initial;
  }

  private persist(state: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpPath = `${DB_FILE}.tmp-${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('[DB] Erro ao salvar banco persistido:', err);
    }
  }

  // --- Users ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(
      (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
    );
  }

  // --- Articles (Help Center) ---
  getArticles(): KnowledgeArticle[] {
    return this.data.articles;
  }

  searchArticles(query: string): KnowledgeArticle[] {
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const words = q.split(/\s+/).filter((w) => w.length > 2);

    return this.data.articles.filter((art) => {
      const text = `${art.title} ${art.content} ${art.tags.join(' ')} ${art.relevanceKeywords.join(' ')}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      return words.some((w) => text.includes(w));
    });
  }

  // --- Tickets ---
  getTickets(userEmail?: string): Ticket[] {
    if (userEmail) {
      const cleanEmail = userEmail.toLowerCase().trim();
      return this.data.tickets.filter(
        (t) => t.openedBy.toLowerCase().trim() === cleanEmail
      );
    }
    return this.data.tickets;
  }

  getTicketById(id: string): Ticket | undefined {
    return this.data.tickets.find((t) => t.id === id);
  }

  createTicket(ticket: Omit<Ticket, 'id'> & { id?: string }): Ticket {
    const nextNumber =
      this.data.tickets.reduce((max, t) => {
        const num = parseInt(t.id.replace(/[^\d]/g, ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 20500) + 1;

    const newTicket: Ticket = {
      ...ticket,
      id: ticket.id || `${ticket.type}-${nextNumber}`,
    };

    this.data.tickets.unshift(newTicket);
    this.persist(this.data);
    return newTicket;
  }

  updateTicket(id: string, updates: Partial<Ticket>): Ticket | null {
    const idx = this.data.tickets.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    this.data.tickets[idx] = {
      ...this.data.tickets[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist(this.data);
    return this.data.tickets[idx];
  }

  // --- Conversations ---
  getConversations(): Conversation[] {
    return this.data.conversations;
  }

  getConversationById(id: string): Conversation | undefined {
    return this.data.conversations.find((c) => c.id === id);
  }

  getConversationByUser(userEmail: string): Conversation | undefined {
    const cleanEmail = userEmail.toLowerCase().trim();
    return this.data.conversations.find(
      (c) => c.userId.toLowerCase().trim() === cleanEmail
    );
  }

  saveConversation(conv: Conversation): Conversation {
    const idx = this.data.conversations.findIndex((c) => c.id === conv.id);
    conv.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.data.conversations[idx] = conv;
    } else {
      this.data.conversations.push(conv);
    }
    this.persist(this.data);
    return conv;
  }

  resetToSeed() {
    this.data = {
      users: SEED_USERS,
      articles: SEED_ARTICLES,
      tickets: SEED_TICKETS,
      conversations: SEED_CONVERSATIONS,
    };
    this.persist(this.data);
    return this.data;
  }
}

// Singleton global persistente
const globalForDb = globalThis as unknown as { dbInstance?: DatabaseService };
export const db = globalForDb.dbInstance ?? new DatabaseService();
if (process.env.NODE_ENV !== 'production') globalForDb.dbInstance = db;
