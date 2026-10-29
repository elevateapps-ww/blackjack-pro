'use client';

import React, { useState } from 'react';
import { TableRules, CardRank, Action } from '@/lib/blackjack/types';
import { getBasicStrategyAction } from '@/lib/blackjack/strategyMatrix';
import { X, Table as TableIcon } from 'lucide-react';

interface StrategyChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: TableRules;
  currentHandTotal?: number;
  currentDealerRank?: CardRank;
  currentIsSoft?: boolean;
  currentIsPair?: boolean;
  currentPairRank?: CardRank;
}

const DEALER_UPCARDS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

export const StrategyChartModal: React.FC<StrategyChartModalProps> = ({
  isOpen,
  onClose,
  rules,
  currentHandTotal,
  currentDealerRank,
  currentIsSoft,
  currentIsPair,
  currentPairRank,
}) => {
  const [activeTab, setActiveTab] = useState<'hard' | 'soft' | 'pairs' | 'all'>('all');

  if (!isOpen) return null;

  const hardTotals = [17, 16, 15, 14, 13, 12, 11, 10, 9, 8];
  const softTotals = [20, 19, 18, 17, 16, 15, 14, 13];
  const pairRanks: CardRank[] = ['A', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

  const getActionColor = (action: Action) => {
    switch (action) {
      case 'S':
        return 'bg-emerald-600 text-white font-bold';
      case 'H':
        return 'bg-blue-600 text-white font-bold';
      case 'D':
        return 'bg-amber-500 text-slate-950 font-black';
      case 'P':
        return 'bg-purple-600 text-white font-bold';
      case 'R':
        return 'bg-rose-600 text-white font-bold';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getActionLabel = (action: Action) => {
    switch (action) {
      case 'S': return 'S';
      case 'H': return 'H';
      case 'D': return 'D';
      case 'P': return 'P';
      case 'R': return 'R';
      default: return '-';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <TableIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Tabela de Estratégia Básica Completa ({rules.dealerRule} • {rules.das ? 'DAS' : 'Sem DAS'} • {rules.surrender === 'late' ? 'Late Surrender' : 'Sem Surrender'})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs & Legend */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex gap-1.5">
            {(['all', 'hard', 'soft', 'pairs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab === 'all' ? 'Todas as Mãos' : tab === 'hard' ? 'Mãos Rígidas' : tab === 'soft' ? 'Mãos Suaves' : 'Pares'}
              </button>
            ))}
          </div>

          {/* Legenda de cores */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 font-mono">
              <span className="w-4 h-4 rounded bg-emerald-600 inline-block text-[10px] text-center font-bold text-white">S</span>
              <span className="text-slate-300">Stand (Parar)</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="w-4 h-4 rounded bg-blue-600 inline-block text-[10px] text-center font-bold text-white">H</span>
              <span className="text-slate-300">Hit (Pedir)</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="w-4 h-4 rounded bg-amber-500 inline-block text-[10px] text-center font-bold text-slate-950">D</span>
              <span className="text-slate-300">Double (Dobrar)</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="w-4 h-4 rounded bg-purple-600 inline-block text-[10px] text-center font-bold text-white">P</span>
              <span className="text-slate-300">Split (Dividir)</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="w-4 h-4 rounded bg-rose-600 inline-block text-[10px] text-center font-bold text-white">R</span>
              <span className="text-slate-300">Surrender</span>
            </span>
          </div>
        </div>

        {/* Grid Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* MÃOS RÍGIDAS (HARD TOTALS) */}
          {(activeTab === 'all' || activeTab === 'hard') && (
            <div>
              <h3 className="text-sm font-extrabold text-amber-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <span>Mãos Rígidas (Hard Totals)</span>
                <span className="text-slate-500 text-xs font-normal">(Sem Ás contando 11)</span>
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-center border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400">
                      <th className="py-2 px-3 text-left font-bold border-r border-slate-800">Sua Mão</th>
                      {DEALER_UPCARDS.map((dealer) => (
                        <th
                          key={dealer}
                          className={`py-2 px-2 font-mono font-bold ${
                            currentDealerRank === dealer ? 'bg-amber-500/20 text-amber-300' : ''
                          }`}
                        >
                          {dealer}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hardTotals.map((tot) => {
                      const isCurrentRow = !currentIsSoft && !currentIsPair && (
                        (tot === 17 && (currentHandTotal || 0) >= 17) ||
                        currentHandTotal === tot
                      );

                      return (
                        <tr
                          key={tot}
                          className={`border-t border-slate-800/60 ${
                            isCurrentRow ? 'bg-amber-500/10 ring-1 ring-amber-500/40' : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="py-2 px-3 text-left font-bold text-slate-200 border-r border-slate-800">
                            {tot >= 17 ? '17+' : tot}
                          </td>
                          {DEALER_UPCARDS.map((dealer) => {
                            const strat = getBasicStrategyAction(tot, dealer, false, false, null, rules);
                            const isCurrentCell = isCurrentRow && currentDealerRank === dealer;
                            return (
                              <td key={dealer} className="p-1">
                                <div
                                  className={`py-1.5 px-2 rounded font-mono text-xs transition-all ${getActionColor(
                                    strat.action
                                  )} ${isCurrentCell ? 'ring-2 ring-white scale-110 shadow-lg z-10' : ''}`}
                                  title={`${strat.explanation.title}: ${strat.explanation.optimalActionName}`}
                                >
                                  {getActionLabel(strat.action)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MÃOS SUAVES (SOFT HANDS) */}
          {(activeTab === 'all' || activeTab === 'soft') && (
            <div>
              <h3 className="text-sm font-extrabold text-cyan-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <span>Mãos Suaves (Soft Totals)</span>
                <span className="text-slate-500 text-xs font-normal">(Com Ás contando 11)</span>
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-center border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400">
                      <th className="py-2 px-3 text-left font-bold border-r border-slate-800">Sua Mão</th>
                      {DEALER_UPCARDS.map((dealer) => (
                        <th
                          key={dealer}
                          className={`py-2 px-2 font-mono font-bold ${
                            currentDealerRank === dealer ? 'bg-amber-500/20 text-amber-300' : ''
                          }`}
                        >
                          {dealer}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {softTotals.map((tot) => {
                      const otherCardVal = tot - 11;
                      const label = `A,${otherCardVal} (${tot})`;
                      const isCurrentRow = currentIsSoft && !currentIsPair && currentHandTotal === tot;

                      return (
                        <tr
                          key={tot}
                          className={`border-t border-slate-800/60 ${
                            isCurrentRow ? 'bg-amber-500/10 ring-1 ring-amber-500/40' : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="py-2 px-3 text-left font-bold text-slate-200 border-r border-slate-800">
                            {label}
                          </td>
                          {DEALER_UPCARDS.map((dealer) => {
                            const strat = getBasicStrategyAction(tot, dealer, true, false, null, rules);
                            const isCurrentCell = isCurrentRow && currentDealerRank === dealer;
                            return (
                              <td key={dealer} className="p-1">
                                <div
                                  className={`py-1.5 px-2 rounded font-mono text-xs transition-all ${getActionColor(
                                    strat.action
                                  )} ${isCurrentCell ? 'ring-2 ring-white scale-110 shadow-lg z-10' : ''}`}
                                  title={`${strat.explanation.title}: ${strat.explanation.optimalActionName}`}
                                >
                                  {getActionLabel(strat.action)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PARES (PAIRS) */}
          {(activeTab === 'all' || activeTab === 'pairs') && (
            <div>
              <h3 className="text-sm font-extrabold text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <span>Divisão de Pares (Splitting Pairs)</span>
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-center border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400">
                      <th className="py-2 px-3 text-left font-bold border-r border-slate-800">Seu Par</th>
                      {DEALER_UPCARDS.map((dealer) => (
                        <th
                          key={dealer}
                          className={`py-2 px-2 font-mono font-bold ${
                            currentDealerRank === dealer ? 'bg-amber-500/20 text-amber-300' : ''
                          }`}
                        >
                          {dealer}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pairRanks.map((pRank) => {
                      const isCurrentRow = currentIsPair && currentPairRank === pRank;
                      return (
                        <tr
                          key={pRank}
                          className={`border-t border-slate-800/60 ${
                            isCurrentRow ? 'bg-amber-500/10 ring-1 ring-amber-500/40' : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="py-2 px-3 text-left font-bold text-slate-200 border-r border-slate-800">
                            {pRank},{pRank}
                          </td>
                          {DEALER_UPCARDS.map((dealer) => {
                            const strat = getBasicStrategyAction(20, dealer, pRank === 'A', true, pRank, rules);
                            const isCurrentCell = isCurrentRow && currentDealerRank === dealer;
                            return (
                              <td key={dealer} className="p-1">
                                <div
                                  className={`py-1.5 px-2 rounded font-mono text-xs transition-all ${getActionColor(
                                    strat.action
                                  )} ${isCurrentCell ? 'ring-2 ring-white scale-110 shadow-lg z-10' : ''}`}
                                  title={`${strat.explanation.title}: ${strat.explanation.optimalActionName}`}
                                >
                                  {getActionLabel(strat.action)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400">
          <span>Esta tabela reflete a teoria de jogo matematicamente ideal (GTO / Basic Strategy).</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
          >
            Fechar Tabela [ESC]
          </button>
        </div>

      </div>
    </div>
  );
};
