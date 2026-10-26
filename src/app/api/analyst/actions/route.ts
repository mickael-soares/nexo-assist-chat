import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { action, conversationId, analystEmail, analystName, messageText } = await req.json();

    const conv = db.getConversationById(conversationId);
    if (!conv) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (action === 'takeover') {
      const activeAnalystName = analystName || 'Rafael Lima';
      conv.status = 'with_analyst';
      conv.analystId = analystEmail;
      conv.analystName = activeAnalystName;

      // Mensagem de sistema e mensagem inicial do analista
      conv.messages.push({
        id: `sys-${Date.now()}`,
        sender: 'system',
        content: `${activeAnalystName} assumiu · agent pausado · ${now}`,
        timestamp: now,
      });

      conv.messages.push({
        id: `msg-a-${Date.now()}`,
        sender: 'analyst',
        senderName: activeAnalystName,
        senderRole: 'Suporte N2',
        content: `Oi, ${conv.userName.split(' ')[0]}! Aqui é o ${activeAnalystName.split(' ')[0]}. Já li o histórico e vou verificar seu caso agora. Como posso ajudar com mais detalhes?`,
        timestamp: now,
      });

      // Se houver chamado ativo vinculado à conversa, marca como "Em atendimento"
      if (conv.activeTicketId) {
        db.updateTicket(conv.activeTicketId, {
          status: 'Em atendimento',
          assignedTo: analystEmail,
          assignedToName: conv.analystName,
        });
      }

      db.saveConversation(conv);
      return NextResponse.json({ success: true, conversation: conv });
    }

    if (action === 'return_to_agent') {
      conv.status = 'with_agent';
      conv.analystId = undefined;
      conv.analystName = undefined;

      conv.messages.push({
        id: `sys-${Date.now()}`,
        sender: 'system',
        content: `Atendimento devolvido ao Nexo Assist · ${now}`,
        timestamp: now,
      });

      conv.messages.push({
        id: `rep-${Date.now()}`,
        sender: 'agent',
        senderName: 'Nexo Assist',
        content: 'Estou de volta! O que mais posso fazer por você?',
        timestamp: now,
        steps: ['retomou atendimento automatizado'],
      });

      db.saveConversation(conv);
      return NextResponse.json({ success: true, conversation: conv });
    }

    if (action === 'close') {
      conv.status = 'resolved';

      conv.messages.push({
        id: `sys-${Date.now()}`,
        sender: 'system',
        content: `Atendimento encerrado por ${analystName || 'Analista'} · ${now}`,
        timestamp: now,
      });

      db.saveConversation(conv);
      return NextResponse.json({ success: true, conversation: conv });
    }

    if (action === 'send_message') {
      if (!messageText) {
        return NextResponse.json({ error: 'Texto da mensagem obrigatório' }, { status: 400 });
      }

      conv.messages.push({
        id: `msg-a-${Date.now()}`,
        sender: 'analyst',
        senderName: analystName || 'Rafael Lima',
        senderRole: 'Suporte N2',
        content: messageText,
        timestamp: now,
      });

      db.saveConversation(conv);
      return NextResponse.json({ success: true, conversation: conv });
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
