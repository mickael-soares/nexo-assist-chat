'use client';

import React from 'react';
import { TicketDraft } from '@/types';
import { FileEdit, Check, X, AlertCircle } from 'lucide-react';

interface DraftCardProps {
  draft: TicketDraft;
  onConfirm: () => void;
  onCancel?: () => void;
  isConfirmed?: boolean;
}

export function DraftCard({ draft, onConfirm, onCancel, isConfirmed }: DraftCardProps) {
  return (
    <div className="mt-3 w-full max-w-md rounded-xl border border-rule bg-white shadow-sm overflow-hidden text-xs">
      {/* Top Header */}
      <div className="px-4 py-2.5 bg-desk border-b border-rule flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink text-[11px] uppercase tracking-wider">Novo chamado</span>
          <span className="text-ink-3 font-mono text-[11px]">{draft.draftId}</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            isConfirmed
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {isConfirmed ? 'Confirmado' : 'Aguardando confirmação'}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-semibold text-ink text-sm leading-snug">{draft.title}</h4>
          <p className="text-ink-2 mt-1 leading-relaxed text-[11.5px]">{draft.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-rule text-[11px]">
          <div>
            <span className="text-ink-3 block">Categoria</span>
            <span className="font-medium text-ink">{draft.category}</span>
          </div>

          <div>
            <span className="text-ink-3 block">Prioridade</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                  draft.priority === 'Crítica'
                    ? 'bg-red-100 text-red-800'
                    : draft.priority === 'Alta'
                    ? 'bg-orange-100 text-orange-800'
                    : draft.priority === 'Média'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {draft.priority}
              </span>
              <span className="text-ink-3">{draft.dueText}</span>
            </div>
          </div>

          <div>
            <span className="text-ink-3 block">Afetados</span>
            <span className="font-medium text-ink">{draft.affectedScope}</span>
          </div>

          <div>
            <span className="text-ink-3 block">Tipo</span>
            <span className="font-mono text-ink font-medium">{draft.type}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {!isConfirmed && (
        <div className="px-4 py-2.5 bg-desk border-t border-rule flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cta text-white font-medium hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 bg-white/20 text-[9px] rounded font-mono">⌘↵</kbd>
            </button>
            <button
              onClick={() => alert('Para editar, escreva as alterações no chat (ex: "Altere a prioridade para média").')}
              className="px-2.5 py-1.5 rounded-lg text-ink-2 hover:bg-white border border-transparent hover:border-rule transition-colors cursor-pointer"
            >
              Editar
            </button>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-2 py-1 text-ink-3 hover:text-danger text-[11px] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
