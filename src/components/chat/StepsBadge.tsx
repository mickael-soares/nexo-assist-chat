'use client';

import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { DecisionDetail } from '@/types';

interface StepsBadgeProps {
  steps?: string[];
  decision?: DecisionDetail;
  onInspect?: () => void;
}

export function StepsBadge({ steps, decision, onInspect }: StepsBadgeProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-[11px] text-ink-2">
        <Sparkles className="w-3 h-3 text-primary" />
        <span>{steps.join(' · ')}</span>
      </div>

      {decision && (
        <button
          onClick={onInspect}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-primary-text hover:bg-blue-100 text-[10px] font-semibold transition-colors cursor-pointer"
          title="Ver por que o agent tomou esta decisão"
        >
          <Info className="w-3 h-3" />
          <span>Ver decisão ({decision.confidence}%)</span>
        </button>
      )}
    </div>
  );
}
