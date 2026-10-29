'use client';

import React, { useEffect } from 'react';
import { Action, HandSituation } from '@/lib/blackjack/types';
import { ACTION_NAMES } from '@/lib/blackjack/strategyMatrix';
import { AlertTriangle, ArrowRight, BookOpen, CheckCircle, Flame, RotateCcw, Zap } from 'lucide-react';

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
  // Escuta ENTER ou BARRA DE ESPAÇO para avançar rapidamente
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

  const isDeviation = situation.isDeviation;
  const exp = situation.explanation;
  const isCorrect = userAction === situation.optimalAction;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-7 overflow-hidden text-white"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(220, 38, 38, 0.15)',
        }}
      >
        {/* Glow de cabeçalho */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        {/* Header do Modal */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${isCorrect ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
            {isCorrect ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <span className={`text-xs uppercase font-extrabold tracking-wider ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isCorrect ? 'Decisão Perfeita' : 'Decisão Incorreta'}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {exp.title}
            </h3>
          </div>
        </div>

        {/* Comparativo de Escolha */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-rose-950/40 border border-rose-800/40 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider mb-1">
              Você Escolheu
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-rose-200">
                {ACTION_NAMES[userAction]}
              </span>
            </div>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-1">
              Decisão Matemática Ótima
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-emerald-200">
                {exp.optimalActionName}
              </span>
            </div>
          </div>
        </div>

        {/* Detalhes Matemáticos & Teóricos */}
        <div className="space-y-3.5 mb-6 text-sm bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Regra Estratégica:</span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              {exp.ruleExplanation}
            </p>
          </div>

          {exp.mathematicalReason && (
            <div className="border-t border-slate-800/80 pt-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Justificativa Matemática & EV:</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {exp.mathematicalReason}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5 text-xs">
            <span className="text-slate-400">
              Taxa de Estouro do Dealer ({situation.dealerCard.rank}):
            </span>
            <span className="font-mono font-bold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
              {exp.dealerBustProbability}
            </span>
          </div>

          {isDeviation && exp.cardCountingContext && (
            <div className="bg-purple-950/40 border border-purple-800/50 rounded-lg p-2.5 text-xs text-purple-200">
              <div className="font-bold flex items-center gap-1 mb-0.5">
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                <span>Índice Don Schlesinger (Illustrious 18):</span>
              </div>
              <div>{exp.cardCountingContext}</div>
            </div>
          )}
        </div>

        {/* Aviso de Repetição Espaçada Inteligente */}
        <div className="flex items-center gap-2 bg-blue-950/30 border border-blue-800/40 rounded-lg px-3 py-2 mb-5 text-xs text-blue-300">
          <RotateCcw className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Fila de Fixação Ativada:</strong> Esta situação foi readicionada à sua fila para ser testada novamente até fixar 100% no seu cérebro.
          </span>
        </div>

        {/* Botão de Avanço com Atalho Destacado */}
        <button
          onClick={onNext}
          autoFocus
          className="w-full py-3.5 px-5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 border border-emerald-400/40 text-base group"
        >
          <span>Avançar para a Próxima Mão</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="ml-2 text-xs font-mono font-normal opacity-90 bg-black/30 px-2 py-1 rounded border border-white/20">
            [ENTER] ou [ESPAÇO]
          </span>
        </button>
      </div>
    </div>
  );
};
