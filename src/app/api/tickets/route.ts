import { NextResponse } from 'next/server';
import { legacyTicketService } from '@/lib/services/legacy-ticket-service';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get('userEmail');
  const isAnalyst = searchParams.get('isAnalyst') === 'true';

  try {
    if (isAnalyst) {
      const tickets = db.getTickets();
      return NextResponse.json({ tickets });
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail é obrigatório' }, { status: 400 });
    }

    const tickets = await legacyTicketService.getEmployeeTickets(userEmail);
    return NextResponse.json({ tickets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { draft, userEmail, userName } = await req.json();
    if (!draft || !userEmail) {
      return NextResponse.json({ error: 'Rascunho e dados do usuário são obrigatórios' }, { status: 400 });
    }

    const ticket = await legacyTicketService.createTicketFromDraft(draft, userEmail, userName || userEmail);
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
