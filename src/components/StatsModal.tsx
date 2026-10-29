'use client';

import React from 'react';
import { UserStats } from '@/lib/blackjack/types';
import { X, BarChart3, Flame, Trophy, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';

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
  onStartReviewMode,
}) => {
  if (!isOpen) return null;

  const total = stats.totalDecisions;
  const correct = stats.correctDecisions;
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : '100.0';

  const getCategoryPercent = (cat: { total: number; correct: number }) => {
    if (cat.total === 0) return '100%';
    return `${((cat.correct / cat.total) * 100).toFixed(0)}%`;
  };

  // Agrupar erros mais frequentes
  const mistakeCountMap = new Map<string, { count: number; situation: string; player: string; dealer: string; correct: string }>();
  stats.mistakeHistory.forEach((m) => {
    const key = m.situationId;
    const existing = mistakeCountMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      mistakeCountMap.set(key, {
        count: 1,
        situation: m.situationId,
        player: m.playerDisplay,
        dealer: m.dealerDisplay,
        correct: m.correctAction,
      });
    }
  });

  const sortedMistakes = Array.from(mistakeCountMap.values()).sort((a, b) => b.count - a.count);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">Desempenho & Estatísticas de Fixação</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          
          {/* CARDS DE RESUMO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-semibold mb-1">Mãos Jogadas</span>
              <span className="text-2xl font-black text-white font-mono">{total.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Meta: {stats.targetGoal.toLocaleString()}</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-semibold mb-1">Precisão Geral</span>
              <span className={`text-2xl font-black font-mono ${parseFloat(accuracy) >= 95 ? 'text-emerald-400' : parseFloat(accuracy) >= 85 ? 'text-amber-400' : 'text-rose-400'}`}>
                {accuracy}%
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">{correct} acertos</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Streak Atual</span>
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">{stats.currentStreak}</span>
              <span className="text-[10px] text-slate-500 mt-0.5">sem errar</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
              <span className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>Melhor Streak</span>
              </span>
              <span className="text-2xl font-black text-yellow-400 font-mono">{stats.bestStreak}</span>
              <span className="text-[10px] text-slate-500 mt-0.5">recorde pessoal</span>
            </div>
          </div>

          {/* DESEMPENHO POR CATEGORIA */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-3">
              Precisão por Categoria
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Mãos Rígidas (Hard Totals)', cat: stats.categoryStats.hard },
                { name: 'Mãos Suaves (Soft Totals)', cat: stats.categoryStats.soft },
                { name: 'Divisão de Pares (Pairs)', cat: stats.categoryStats.pair },
                { name: 'Rendição (Surrender)', cat: stats.categoryStats.surrender },
                { name: 'Contagem & Desvios (Illustrious 18)', cat: stats.categoryStats.deviation },
              ].map((item, idx) => {
                const percent = item.cat.total > 0 ? (item.cat.correct / item.cat.total) * 100 : 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-slate-400 font-mono">
                        {item.cat.correct}/{item.cat.total} ({getCategoryPercent(item.cat)})
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percent >= 95 ? 'bg-emerald-500' : percent >= 80 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LISTA DE ERROS MAIS FREQUENTES & BOTÃO DE TREINAR ERROS */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                  Mãos com Mais Erros ({stats.reviewQueue.length} na Fila de Fixação)
                </h3>
              </div>
              {stats.reviewQueue.length > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onStartReviewMode();
                  }}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Treinar Apenas Erros</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {sortedMistakes.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500/60 mb-1" />
                <span>Nenhum erro registrado ainda! Seu desempenho está impecável.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sortedMistakes.slice(0, 8).map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white font-mono">{m.situation}</span>
                      <span className="text-slate-400 ml-2">Decisão Certa: <strong className="text-emerald-400 font-mono">{m.correct}</strong></span>
                    </div>
                    <span className="bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded font-mono font-bold border border-rose-800/60">
                      {m.count} {m.count === 1 ? 'erro' : 'erros'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
          <span className="text-slate-400">Dados salvos automaticamente no seu navegador.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors"
          >
            Fechar Estatísticas
          </button>
        </div>

      </div>
    </div>
  );
};
