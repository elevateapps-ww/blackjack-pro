'use client';

import React from 'react';
import { UserStats } from '@/lib/blackjack/types';
import { X, BarChart3, Flame, Trophy } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onStartReviewMode: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen) return null;

  const total = stats.totalDecisions;
  const correct = stats.correctDecisions;
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : '100.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Estatísticas</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <span className="text-xs text-slate-500 font-semibold mb-1 block">Mãos Jogadas</span>
              <span className="text-xl font-bold font-mono text-slate-900">{total.toLocaleString()}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <span className="text-xs text-slate-500 font-semibold mb-1 block">Precisão</span>
              <span className="text-xl font-bold font-mono text-emerald-600">{accuracy}%</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <span className="text-xs text-slate-500 font-semibold mb-1 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Sequência</span>
              </span>
              <span className="text-xl font-bold font-mono text-amber-600">{stats.currentStreak}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <span className="text-xs text-slate-500 font-semibold mb-1 flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                <span>Melhor Streak</span>
              </span>
              <span className="text-xl font-bold font-mono text-slate-900">{stats.bestStreak}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
