'use client';

import React from 'react';
import { DecisionDetail } from '@/types';
import { X, ShieldCheck, Cpu, CheckCircle2, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';

interface DecisionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  decision?: DecisionDetail;
  steps?: string[];
}

export function DecisionDrawer({ isOpen, onClose, decision, steps }: DecisionDrawerProps) {
  if (!isOpen || !decision) return null;

  const confidence = decision.confidence ?? 90;
  const isHighConfidence = confidence >= 80;
  const isMediumConfidence = confidence >= 50 && confidence < 80;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-rule overflow-hidden animate-in slide-in-from-right duration-300"
        role="dialog"
      >
        {/* Header */}
        <div className="p-5 border-b border-rule flex items-center justify-between bg-desk">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Visibilidade da Decisão (IA)</h2>
              <p className="text-[11px] text-ink-3">Auditoria e transparência do raciocínio do agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-3 hover:text-ink hover:bg-white rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-ink-2">
          {/* Confiança */}
          <div className="p-3.5 rounded-xl border border-rule bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className={`w-4 h-4 ${
                  isHighConfidence
                    ? 'text-emerald-600'
                    : isMediumConfidence
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              />
              <span className="font-medium text-ink">Grau de Segurança (Confiança):</span>
            </div>
            <div
              className={`px-2.5 py-1 rounded-full font-semibold text-xs ${
                isHighConfidence
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isMediumConfidence
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {confidence}% {isHighConfidence ? '· Alta segurança' : '· Atenção necessária'}
            </div>
          </div>

          {/* Passos percorridos */}
          {steps && steps.length > 0 && (
            <div>
              <h3 className="font-semibold text-ink text-[11px] uppercase tracking-wider mb-2 text-ink-3">
                Ações Executadas Nesta Resposta
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {steps.map((st, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-desk border border-rule text-ink text-[11px] font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    {st}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Intenção Identificada */}
          <div>
            <h3 className="font-semibold text-ink text-[11px] uppercase tracking-wider mb-1.5 text-ink-3">
              Intenção Identificada
            </h3>
            <div className="p-3 rounded-lg bg-desk font-mono text-[11px] text-ink border border-rule">
              {decision.intent}
            </div>
          </div>

          {/* Justificativa / Rationale */}
          <div>
            <h3 className="font-semibold text-ink text-[11px] uppercase tracking-wider mb-1.5 text-ink-3">
              Por que o Agent agiu assim? (Raciocínio)
            </h3>
            <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-100 text-ink leading-relaxed">
              {decision.rationale}
            </div>
          </div>

          {/* Regras do Anexo A aplicadas */}
          {decision.rulesApplied && decision.rulesApplied.length > 0 && (
            <div>
              <h3 className="font-semibold text-ink text-[11px] uppercase tracking-wider mb-2 text-ink-3">
                Regras do Service Desk Acionadas (Anexo A)
              </h3>
              <ul className="space-y-1.5">
                {decision.rulesApplied.map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded-md bg-desk border border-rule text-ink font-medium"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ação Tomada */}
          <div>
            <h3 className="font-semibold text-ink text-[11px] uppercase tracking-wider mb-1.5 text-ink-3">
              Ação de Sistema Realizada
            </h3>
            <div className="p-2.5 rounded-md bg-desk font-mono text-[11px] text-ink border border-rule">
              {decision.actionTaken}
            </div>
          </div>

          {/* Entrada do Usuário Analisada */}
          <div>
            <h3 className="font-semibold text-ink text-[11px] uppercase tracking-wider mb-1.5 text-ink-3">
              Entrada do Usuário Analisada
            </h3>
            <div className="p-3 rounded-md bg-white border border-rule text-ink-2 italic">
              &quot;{decision.inputAnalyzed}&quot;
            </div>
          </div>

          {/* Alternativas Consideradas */}
          {decision.alternativesConsidered && decision.alternativesConsidered.length > 0 && (
            <div>
              <h3 className="font-semibold text-ink text-[11px] uppercase tracking-wider mb-1.5 text-ink-3">
                Alternativas Descartadas / Trade-offs
              </h3>
              <ul className="space-y-1">
                {decision.alternativesConsidered.map((alt, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-ink-3">
                    <ArrowRight className="w-3 h-3 text-ink-3" />
                    <span>{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-rule bg-desk flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-ink text-white font-medium rounded-lg text-xs hover:bg-ink-2 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
