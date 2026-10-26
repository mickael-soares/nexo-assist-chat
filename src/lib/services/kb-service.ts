import { db } from '@/lib/db';
import { KnowledgeArticle } from '@/types';

export class HelpCenterService {
  async search(query: string): Promise<KnowledgeArticle[]> {
    return db.searchArticles(query);
  }

  async getAll(): Promise<KnowledgeArticle[]> {
    return db.getArticles();
  }

  async getById(id: string): Promise<KnowledgeArticle | undefined> {
    return db.getArticles().find((a) => a.id === id);
  }
}

export const helpCenterService = new HelpCenterService();
