import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nexoAgent } from '@/lib/agent/orchestrator';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');
  const userEmail = searchParams.get('userEmail');

  if (conversationId) {
    const conv = db.getConversationById(conversationId);
    if (!conv) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ conversation: conv });
  }

  if (userEmail) {
    let conv = db.getConversationByUser(userEmail);
    if (!conv) {
      const user = db.getUserByEmail(userEmail);
      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      conv = {
        id: `conv-${Date.now()}`,
        userId: user.email,
        userName: user.name,
        userDepartment: user.department,
        status: 'with_agent',
        messageCount: 0,
        confidenceScore: 95,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveConversation(conv);
    }
    return NextResponse.json({ conversation: conv });
  }

  const all = db.getConversations();
  return NextResponse.json({ conversations: all });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conversationId, userEmail, message } = body;

    if (!userEmail || !message) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos: userEmail e message são obrigatórios' },
        { status: 400 }
      );
    }

    const user = db.getUserByEmail(userEmail);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não cadastrado' }, { status: 404 });
    }

    const convId = conversationId || `conv-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const result = await nexoAgent.processUserMessage(convId, message, user);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API /api/chat] Erro:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no agent' }, { status: 500 });
  }
}
