'use client';

import React from 'react';
import { AI_TEACHER_MODELS, AIModelConfig } from '@/lib/ai/models';
import { Cpu, Sparkles, Check, Zap } from 'lucide-react';

interface AIModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  disabled?: boolean;
}

export function AIModelSelector({
  selectedModelId,
  onSelectModel,
  disabled = false,
}: AIModelSelectorProps) {
  const currentModel = AI_TEACHER_MODELS[selectedModelId] || AI_TEACHER_MODELS.lightning30b;

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 p-3.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-stone-900 dark:text-stone-100" /> AI Teacher Engine
        </label>
        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> APFC Calibrated
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.values(AI_TEACHER_MODELS).map((m) => {
          const isSelected = m.id === selectedModelId;

          return (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectModel(m.id)}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-stone-900 dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs ring-1 ring-stone-900 dark:ring-stone-100'
                  : 'border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/40 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/80'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  {m.id === 'lightning30b' ? (
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Cpu className="h-3.5 w-3.5 text-indigo-500" />
                  )}
                  {m.name}
                </span>
                {isSelected && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-snug">
                {m.description}
              </p>
              {m.badge && (
                <span className="mt-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  {m.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
