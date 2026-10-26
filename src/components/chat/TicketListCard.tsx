'use client';

import React from 'react';
import { Ticket } from '@/types';
import { ChevronRight } from 'lucide-react';

interface TicketListCardProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export function TicketListCard({ tickets, onSelectTicket }: TicketListCardProps) {
  return (
    <div className="mt-2.5 w-full max-w-md space-y-2">
      {tickets.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelectTicket(t)}
          className="w-full text-left p-3 rounded-xl border border-rule bg-white hover:border-primary/50 hover:shadow-xs transition-all flex items-center justify-between gap-3 group cursor-pointer"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] font-semibold text-primary">{t.id}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-desk text-ink-2">
                {t.status}
              </span>
            </div>
            <div className="font-medium text-ink text-xs truncate group-hover:text-primary transition-colors">
              {t.title}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-3 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      ))}
    </div>
  );
}
