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
  const isActionAllowed = (action: Action) => allowedActions.includes(action);

  const handleClick = (action: Action) => {
    if (disabled || !isActionAllowed(action)) return;
    // Feedback tátil em dispositivos móveis
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch {
        // Ignore
      }
    }
    onAction(action);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        {/* HIT (Pedir Carta) */}
        <button
          onClick={() => handleClick('H')}
          disabled={disabled || !isActionAllowed('H')}
          className={`relative group overflow-hidden py-3 sm:py-4 px-3 rounded-xl font-bold transition-all duration-150 active:scale-95 flex flex-col items-center justify-center border shadow-lg ${
            disabled || !isActionAllowed('H')
              ? 'bg-slate-800/40 text-slate-500 border-slate-700/50 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white border-blue-400/50 shadow-blue-900/40 hover:shadow-blue-600/30 ring-1 ring-white/20'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm sm:text-base tracking-wide uppercase font-extrabold">Pedir</span>
          </div>
          <span className="text-[11px] font-mono opacity-80 bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
            [H]
          </span>
        </button>

        {/* STAND (Parar) */}
        <button
          onClick={() => handleClick('S')}
          disabled={disabled || !isActionAllowed('S')}
          className={`relative group overflow-hidden py-3 sm:py-4 px-3 rounded-xl font-bold transition-all duration-150 active:scale-95 flex flex-col items-center justify-center border shadow-lg ${
            disabled || !isActionAllowed('S')
              ? 'bg-slate-800/40 text-slate-500 border-slate-700/50 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border-emerald-400/50 shadow-emerald-900/40 hover:shadow-emerald-600/30 ring-1 ring-white/20'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm sm:text-base tracking-wide uppercase font-extrabold">Parar</span>
          </div>
          <span className="text-[11px] font-mono opacity-80 bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
            [S]
          </span>
        </button>

        {/* DOUBLE (Dobrar) */}
        <button
          onClick={() => handleClick('D')}
          disabled={disabled || !isActionAllowed('D')}
          className={`relative group overflow-hidden py-3 sm:py-4 px-3 rounded-xl font-bold transition-all duration-150 active:scale-95 flex flex-col items-center justify-center border shadow-lg ${
            disabled || !isActionAllowed('D')
              ? 'bg-slate-800/40 text-slate-500 border-slate-700/50 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border-amber-400/50 shadow-amber-900/40 hover:shadow-amber-600/30 ring-1 ring-white/20'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm sm:text-base tracking-wide uppercase font-extrabold">Dobrar</span>
          </div>
          <span className="text-[11px] font-mono opacity-80 bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
            [D]
          </span>
        </button>

        {/* SPLIT (Dividir) */}
        <button
          onClick={() => handleClick('P')}
          disabled={disabled || !isActionAllowed('P')}
          className={`relative group overflow-hidden py-3 sm:py-4 px-3 rounded-xl font-bold transition-all duration-150 active:scale-95 flex flex-col items-center justify-center border shadow-lg ${
            disabled || !isActionAllowed('P')
              ? 'bg-slate-800/40 text-slate-500 border-slate-700/50 cursor-not-allowed opacity-40'
              : 'bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white border-purple-400/50 shadow-purple-900/40 hover:shadow-purple-600/30 ring-1 ring-white/20'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm sm:text-base tracking-wide uppercase font-extrabold">Dividir</span>
          </div>
          <span className="text-[11px] font-mono opacity-80 bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
            [P] ou [Y]
          </span>
        </button>

        {/* SURRENDER (Render-se) */}
        <button
          onClick={() => handleClick('R')}
          disabled={disabled || !isActionAllowed('R')}
          className={`col-span-2 sm:col-span-1 relative group overflow-hidden py-3 sm:py-4 px-3 rounded-xl font-bold transition-all duration-150 active:scale-95 flex flex-col items-center justify-center border shadow-lg ${
            disabled || !isActionAllowed('R')
              ? 'bg-slate-800/40 text-slate-500 border-slate-700/50 cursor-not-allowed opacity-40'
              : 'bg-gradient-to-b from-rose-700 to-rose-800 hover:from-rose-600 hover:to-rose-700 text-white border-rose-400/50 shadow-rose-900/40 hover:shadow-rose-600/30 ring-1 ring-white/20'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm sm:text-base tracking-wide uppercase font-extrabold">Render-se</span>
          </div>
          <span className="text-[11px] font-mono opacity-80 bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
            [R]
          </span>
        </button>
      </div>
    </div>
  );
};
