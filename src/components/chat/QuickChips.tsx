'use client';

import React from 'react';

interface QuickOptionItem {
  label: string;
  value: string;
}

interface QuickChipsProps {
  question?: string;
  options: QuickOptionItem[];
  onSelect: (value: string) => void;
}

export function QuickChips({ question, options, onSelect }: QuickChipsProps) {
  return (
    <div className="mt-3 w-full max-w-md space-y-2">
      {question && <p className="text-xs font-semibold text-ink">{question}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(opt.value)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rule bg-white hover:bg-blue-50/60 hover:border-primary/50 text-xs font-medium text-ink transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <span className="w-4 h-4 rounded-full bg-desk border border-rule text-[10px] font-mono flex items-center justify-center text-ink-3">
              {i + 1}
            </span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
