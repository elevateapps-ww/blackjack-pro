'use client';

import React from 'react';
import { UserStats, TableRules, TrainingMode } from '@/lib/blackjack/types';
import { AppSettings } from '@/lib/storage';
import { Flame, BarChart3, Table as TableIcon, Settings, Volume2, VolumeX, Sparkles, RotateCcw, Timer, DollarSign } from 'lucide-react';

interface HeaderHUDProps {
  stats: UserStats;
  settings: AppSettings;
  rules: TableRules;
  onOpenStats: () => void;
  onOpenChart: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onOpenReviewQueue: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  stats,
  settings,
  rules,
  onOpenStats,
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

  const avgSpeedSec = total > 0 ? (stats.totalResponseTimeMs / total / 1000).toFixed(2) : '0.00';
  const totalMoneyLost = (stats.totalEvLoss * stats.betUnit).toFixed(2);

  const modeLabels: Record<TrainingMode, string> = {
    all: 'Todas as Mãos',
    hard: 'Hard Totals',
    soft: 'Soft Totals',
    pairs: 'Pares',
    surrender: 'Rendição',
    deviations: 'Illustrious 18',
    review: 'Fila de Erros',
  };

  return (
    <header className="w-full bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        
        {/* Top Row: Logo, Mode Badge, Quick Actions */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo & Mode */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-sm">
              ♠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight font-sans">
                  BLACKJACK <span className="text-amber-400">APEX PRO</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  {rules.dealerRule} • {rules.das ? 'DAS' : 'NO-DAS'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Modo:</span>
                <span className="text-cyan-400 font-semibold">{modeLabels[settings.selectedMode]}</span>
              </div>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Review Queue Badge Button if items in queue */}
            {stats.reviewQueue.length > 0 && (
              <button
                onClick={onOpenReviewQueue}
                title="Mãos erradas para reforço imediato"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-700/60 hover:bg-rose-900 text-rose-300 text-xs font-bold transition-all animate-pulse-subtle"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Erros:</span>
                <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                  {stats.reviewQueue.length}
                </span>
              </button>
            )}

            {/* Strategy Chart Button */}
            <button
              onClick={onOpenChart}
              title="Abrir Tabela de Estratégia [C]"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm"
            >
              <TableIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Tabela [C]</span>
            </button>

            {/* Stats Button */}
            <button
              onClick={onOpenStats}
              title="Ver Estatísticas Detalhadas"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Estatísticas</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={settings.soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              title="Configurações de Regras e Treino"
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all"
            >
              <Settings className="w-4 h-4 text-slate-300 hover:text-amber-400" />
            </button>

          </div>
        </div>

        {/* Bottom Row: Live Hand Counter, Streak, Accuracy & Financial EV Loss */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-y-1">
            
            {/* Hand Counter (1 de 5.000) */}
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-amber-400 font-sans uppercase text-[11px] font-extrabold tracking-wider">
                Mão:
              </span>
              <span className="text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {currentHandNumber.toLocaleString()} de {target.toLocaleString()}
              </span>
              <span className="text-slate-500 text-[11px]">({progressPercent.toFixed(1)}%)</span>
            </div>

            {/* Metrics Badges: Streak, Accuracy, Speed, EV Cost */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              
              {/* Streak */}
              <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-800/50 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                <span>{stats.currentStreak} seguidos</span>
              </div>

              {/* Accuracy */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="font-bold">{accuracy}%</span>
              </div>

              {/* Average Speed */}
              {total > 0 && (
                <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  <Timer className="w-3 h-3 text-emerald-400" />
                  <span>{avgSpeedSec}s méd.</span>
                </div>
              )}

              {/* EV Loss Tracker */}
              {stats.totalEvLoss > 0 && (
                <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-800/50 text-rose-300 px-2 py-0.5 rounded-full font-bold" title="Custo financeiro teórico de erros">
                  <DollarSign className="w-3 h-3 text-rose-400" />
                  <span>-R$ {totalMoneyLost}</span>
                </div>
              )}

            </div>

          </div>

          {/* Smooth Gradient Progress Bar */}
          <div className="w-full bg-slate-900/90 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

        </div>

      </div>
    </header>
  );
};
