'use client';

import React from 'react';
import { UserStats, TableRules } from '@/lib/blackjack/types';
import { AppSettings } from '@/lib/storage';
import { Flame, Table as TableIcon, Settings, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface HeaderHUDProps {
  stats: UserStats;
  settings: AppSettings;
  rules: TableRules;
  onOpenChart: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onOpenReviewQueue: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  stats,
  settings,
  onOpenChart,
  onOpenSettings,
  onToggleSound,
  onOpenReviewQueue,
}) => {
  const currentHandNumber = stats.totalDecisions + 1;
  const target = stats.targetGoal;
  const progressPercent = Math.min(100, Math.max(0, (stats.totalDecisions / target) * 100));

  const total = stats.totalDecisions;
  const correct = stats.correctDecisions;
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : '100.0';

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3">
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
        
        {/* Top Row: Title, Counter & Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-base tracking-tight">
              Blackjack <span className="text-slate-500 font-normal">Pro</span>
            </span>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            
            {/* Review Queue Badge Button if items in queue */}
            {stats.reviewQueue.length > 0 && (
              <button
                onClick={onOpenReviewQueue}
                title="Erros para reforçar"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Erros: {stats.reviewQueue.length}</span>
              </button>
            )}

            {/* Strategy Chart Button */}
            <button
              onClick={onOpenChart}
              title="Tabela de Estratégia [C]"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              <TableIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Tabela [C]</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={settings.soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
              className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-slate-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              title="Configurações"
              className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-700" />
            </button>

          </div>
        </div>

        {/* Bottom Row: Clean Hand Counter, Streak & Sleek Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            
            {/* Hand Counter */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 font-mono text-sm">
                {currentHandNumber.toLocaleString()} de {target.toLocaleString()}
              </span>
              <span className="text-slate-400 text-[11px]">({progressPercent.toFixed(1)}%)</span>
            </div>

            {/* Streak & Accuracy */}
            <div className="flex items-center gap-3">
              {stats.currentStreak > 0 && (
                <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{stats.currentStreak} seguidos</span>
                </div>
              )}

              <div className="text-slate-700 font-mono">
                Precisão: <strong className="text-slate-900">{accuracy}%</strong>
              </div>
            </div>

          </div>

          {/* Minimalist Progress Bar */}
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all duration-200 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

        </div>

      </div>
    </header>
  );
};
