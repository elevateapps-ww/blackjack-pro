'use client';

import React, { useState } from 'react';
import { UserStats } from '@/lib/blackjack/types';
import { X, BarChart3, Flame, Trophy, CheckCircle2, AlertTriangle, ArrowRight, Timer, DollarSign, History } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onStartReviewMode: () => void;
  onUpdateBetUnit?: (unit: number) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onStartReviewMode,
  onUpdateBetUnit,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  if (!isOpen) return null;

  const total = stats.totalDecisions;
  const correct = stats.correctDecisions;
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : '100.0';
  const avgSpeedSec = total > 0 ? (stats.totalResponseTimeMs / total / 1000).toFixed(2) : '0.00';
  const totalMoneyLost = (stats.totalEvLoss * stats.betUnit).toFixed(2);

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

        {/* Sub Header Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visão Geral & Categorias</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico Recente ({stats.recentHistory?.length || 0})</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          
          {activeTab === 'overview' ? (
            <>
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
                  <span className="text-[10px] text-slate-500 mt-0.5">recorde: {stats.bestStreak}</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
                  <span className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tempo Médio</span>
                  </span>
                  <span className="text-2xl font-black text-cyan-300 font-mono">{avgSpeedSec}s</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{parseFloat(avgSpeedSec) < 1.5 ? 'Excelente' : 'Bom'}</span>
                </div>
              </div>

              {/* CARD DE VAZAMENTO DE BANCA (EV LOSS CALCULATOR) */}
              <div className="bg-gradient-to-r from-rose-950/40 via-slate-950/70 to-slate-900 border border-rose-800/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-900/40 text-rose-400 border border-rose-700/50">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white text-sm">Vazamento Financeiro de EV (Banca):</span>
                    <p className="text-xs text-slate-400">
                      Custo matemático total de apostas perdidas por decisões fora da estratégia ótima.
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xl font-black font-mono text-rose-300">-R$ {totalMoneyLost}</span>
                  <span className="text-[11px] text-slate-400 block font-mono">({stats.totalEvLoss.toFixed(2)} unidades @ R${stats.betUnit})</span>
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
            </>
          ) : (
            /* ABA DE HISTÓRICO RECENTE */
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2">
                Últimas 20 Decisões
              </h3>
              {!stats.recentHistory || stats.recentHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Nenhuma mão jogada nesta sessão ainda.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                  {stats.recentHistory.slice(0, 20).map((h, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-mono ${
                        h.isCorrect
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                          : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${h.isCorrect ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="font-bold text-white">{h.playerDisplay} vs {h.dealerDisplay}</span>
                        <span className="text-slate-400 text-[11px]">Sua: <strong>{h.userAction}</strong></span>
                        {!h.isCorrect && (
                          <span className="text-emerald-400 text-[11px]">Ótima: <strong>{h.correctAction}</strong></span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span>{(h.responseTimeMs / 1000).toFixed(2)}s</span>
                        <span className={h.isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {h.isCorrect ? 'ACERTO' : 'ERRO'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
