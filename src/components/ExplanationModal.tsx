'use client';

import React, { useEffect } from 'react';
import { Action, HandSituation } from '@/lib/blackjack/types';
import { ACTION_NAMES } from '@/lib/blackjack/strategyMatrix';
import { AlertCircle, ArrowRight, RotateCcw, Brain, CheckCircle2 } from 'lucide-react';

interface ExplanationModalProps {
  isOpen: boolean;
  situation: HandSituation;
  userAction: Action;
  onNext: () => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  isOpen,
  situation,
  userAction,
  onNext,
}) => {
  // ENTER ou BARRA DE ESPAÇO avança instantaneamente para a próxima mão
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNext]);

  if (!isOpen) return null;

  const exp = situation.explanation;
  const isCorrect = userAction === situation.optimalAction;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-900"
      >
        {/* Header do Modal */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2.5 rounded-2xl ${isCorrect ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
            {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <span className={`text-[11px] uppercase font-bold tracking-wider ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCorrect ? 'Decisão Correta' : 'Decisão Incorreta'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {exp.title}
            </h3>
          </div>
        </div>

        {/* Comparativo de Escolha */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3.5 flex flex-col">
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider mb-1">
              Sua Escolha
            </span>
            <span className="text-base font-extrabold text-rose-700">
              {ACTION_NAMES[userAction]}
            </span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              Decisão do Mestre Mundial
            </span>
            <span className="text-base font-extrabold text-emerald-700">
              {exp.optimalActionName}
            </span>
          </div>
        </div>

        {/* Gatilho Mental Didático */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 text-sm space-y-3">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-1">
                Gatilho Mental de Alta Performance:
              </span>
              <p className="text-slate-800 leading-relaxed text-xs sm:text-sm">
                {exp.ruleExplanation}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-xs text-slate-500">
            <span>Probabilidade de busto do Dealer ({situation.dealerCard.rank}):</span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {exp.dealerBustProbability}
            </span>
          </div>
        </div>

        {/* Fila de Repetição */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-6 text-xs text-slate-600">
          <RotateCcw className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Fila de Fixação:</strong> Esta situação foi re-embaralhada na sua fila para você acertar de olhos fechados.
          </span>
        </div>

        {/* Botão de Avanço */}
        <button
          onClick={onNext}
          autoFocus
          className="w-full py-3.5 px-5 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
        >
          <span>Avançar para a Próxima Mão</span>
          <ArrowRight className="w-4 h-4" />
          <span className="ml-1.5 text-xs font-mono font-normal opacity-75 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            [ENTER] ou [ESPAÇO]
          </span>
        </button>
      </div>
    </div>
  );
};
