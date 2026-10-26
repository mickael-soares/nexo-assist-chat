'use client';

import React from 'react';
import { Ticket } from '@/types';
import { Clock, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  onActionClick?: (actionText: string) => void;
}

export function TicketCard({ ticket, onActionClick }: TicketCardProps) {
  const isOverdue = ticket.isOverdue || ['Aguardando analista', 'Aberto', 'Em andamento'].includes(ticket.status);

  return (
    <div className="mt-3 w-full max-w-md rounded-xl border border-rule bg-white shadow-sm overflow-hidden text-xs">
      {/* Top Header */}
      <div className="px-4 py-2.5 bg-desk border-b border-rule flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink text-[11px] uppercase tracking-wider">Chamado</span>
          <span className="font-mono text-ink font-semibold">{ticket.id}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {ticket.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-semibold text-ink text-sm leading-snug">{ticket.title}</h4>
          <p className="text-ink-2 mt-1 leading-relaxed text-[11.5px]">{ticket.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-rule text-[11px]">
          <div>
            <span className="text-ink-3 block">Categoria</span>
            <span className="font-medium text-ink">{ticket.category}</span>
          </div>

          <div>
            <span className="text-ink-3 block">Prioridade</span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded text-[10px]">
              {ticket.priority}
            </span>
          </div>

          <div>
            <span className="text-ink-3 block">Aberto em</span>
            <span className="text-ink font-medium">16 out, 14:20</span>
          </div>

          <div>
            <span className="text-ink-3 block">Última atualização</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-ink font-medium">há 5 dias</span>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-danger bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  prazo vencido
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Pills */}
      {onActionClick && (
        <div className="px-4 py-2.5 bg-desk border-t border-rule flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onActionClick('Quero falar com um analista.')}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 text-primary-text border border-rule hover:border-primary text-[11px] font-medium transition-colors cursor-pointer"
          >
            Falar com um analista
          </button>
          <button
            onClick={() => onActionClick('Gostaria de adicionar novas informações a este chamado.')}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-desk text-ink-2 border border-rule text-[11px] font-medium transition-colors cursor-pointer"
          >
            Adicionar informação
          </button>
          <button
            onClick={() => onActionClick('Não, obrigado')}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-desk text-ink-3 border border-rule text-[11px] font-medium transition-colors cursor-pointer"
          >
            Não, obrigado
          </button>
        </div>
      )}
    </div>
  );
}
