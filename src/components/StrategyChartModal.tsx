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
}

const DEALER_UPCARDS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

export const StrategyChartModal: React.FC<StrategyChartModalProps> = ({
  isOpen,
  onClose,
  rules,
  currentHandTotal,
  currentDealerRank,
  currentIsSoft,
}) => {
  const [activeTab, setActiveTab] = useState<'hard' | 'soft'>('hard');

  if (!isOpen) return null;

  const hardTotals = [17, 16, 15, 14, 13, 12, 11, 10, 9, 8];
  const softTotals = [20, 19, 18, 17, 16, 15, 14, 13];

  const getActionBadge = (action: Action) => {
    switch (action) {
      case 'S':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'H':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'D':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <TableIcon className="w-5 h-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Tabela de Estratégia (Pedir, Parar e Dobrar)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs & Legend */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('hard')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'hard'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Mãos Rígidas (Hard)
            </button>
            <button
              onClick={() => setActiveTab('soft')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'soft'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Mãos Suaves com Ás (Soft)
            </button>
          </div>

          {/* Legenda de cores limpa */}
          <div className="flex items-center gap-3 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] flex items-center justify-center font-bold">S</span>
              <span>Parar</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-blue-100 text-blue-800 border border-blue-300 text-[10px] flex items-center justify-center font-bold">H</span>
              <span>Pedir</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] flex items-center justify-center font-bold">D</span>
              <span>Dobrar</span>
            </span>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-center border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="py-2.5 px-3 text-left font-bold border-r border-slate-200">Sua Mão</th>
                  {DEALER_UPCARDS.map((dealer) => (
                    <th key={dealer} className="py-2.5 px-2 font-mono font-bold">
                      {dealer}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'hard' ? hardTotals : softTotals).map((tot) => {
                  const label = activeTab === 'hard' 
                    ? (tot >= 17 ? '17+' : `${tot}`)
                    : `A,${tot - 11} (${tot})`;

                  const isCurrentRow = activeTab === 'hard'
                    ? (!currentIsSoft && ((tot === 17 && (currentHandTotal || 0) >= 17) || currentHandTotal === tot))
                    : (currentIsSoft && currentHandTotal === tot);

                  return (
                    <tr
                      key={tot}
                      className={`border-t border-slate-100 ${
                        isCurrentRow ? 'bg-amber-50/60 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-3 text-left font-semibold text-slate-800 border-r border-slate-200">
                        {label}
                      </td>
                      {DEALER_UPCARDS.map((dealer) => {
                        const strat = getBasicStrategyAction(tot, dealer, activeTab === 'soft', rules);
                        const isCurrentCell = isCurrentRow && currentDealerRank === dealer;
                        return (
                          <td key={dealer} className="p-1">
                            <div
                              className={`py-1 px-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${getActionBadge(
                                strat.action
                              )} ${isCurrentCell ? 'ring-2 ring-slate-900 scale-105' : ''}`}
                            >
                              {strat.action}
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Fechar [ESC]
          </button>
        </div>

      </div>
    </div>
  );
};
