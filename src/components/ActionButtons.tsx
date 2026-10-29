'use client';

import React from 'react';
import { Action } from '@/lib/blackjack/types';

interface ActionButtonsProps {
  onAction: (action: Action) => void;
  allowedActions: Action[];
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAction,
  allowedActions,
  disabled = false,
}) => {
  const handleClick = (action: Action) => {
    if (disabled) return;
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore
      }
    }
    onAction(action);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-2">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        
        {/* PEDIR (HIT) */}
        <button
          onClick={() => handleClick('H')}
          disabled={disabled}
          className={`group py-4 px-3 rounded-2xl font-bold transition-all duration-150 active:scale-95 flex flex-col items-center justify-center border shadow-sm ${
            disabled
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <span className="text-base sm:text-lg uppercase tracking-wide font-extrabold text-blue-700">
            Pedir
          </span>
          <span className="text-xs font-mono text-blue-500/80 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 mt-1">
            [H]
          </span>
        </button>

        {/* PARAR (STAND) */}
        <button
          onClick={() => handleClick('S')}
          disabled={disabled}
          className={`group py-4 px-3 rounded-2xl font-bold transition-all duration-150 active:scale-95 flex flex-col items-center justify-center border shadow-sm ${
            disabled
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              : 'bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-300 hover:shadow-md'
          }`}
        >
          <span className="text-base sm:text-lg uppercase tracking-wide font-extrabold text-emerald-700">
            Parar
          </span>
          <span className="text-xs font-mono text-emerald-600/80 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 mt-1">
            [S]
          </span>
        </button>

        {/* DOBRAR (DOUBLE) */}
        <button
          onClick={() => handleClick('D')}
          disabled={disabled}
          className={`group py-4 px-3 rounded-2xl font-bold transition-all duration-150 active:scale-95 flex flex-col items-center justify-center border shadow-sm ${
            disabled
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              : 'bg-white hover:bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-300 hover:shadow-md'
          }`}
        >
          <span className="text-base sm:text-lg uppercase tracking-wide font-extrabold text-amber-700">
            Dobrar
          </span>
          <span className="text-xs font-mono text-amber-600/80 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 mt-1">
            [D]
          </span>
        </button>

      </div>
    </div>
  );
};
