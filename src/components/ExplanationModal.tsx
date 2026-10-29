'use client';

import React, { useEffect, useState } from 'react';
import { Action, HandSituation, CardRank } from '@/lib/blackjack/types';
import { ACTION_NAMES, rankToValue } from '@/lib/blackjack/strategyMatrix';
import { AlertTriangle, ArrowRight, BookOpen, CheckCircle, Flame, RotateCcw, Zap, DollarSign, Play } from 'lucide-react';

interface ExplanationModalProps {
  isOpen: boolean;
  situation: HandSituation;
  userAction: Action;
  onNext: () => void;
  betUnit?: number;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  isOpen,
  situation,
  userAction,
  onNext,
  betUnit = 25,
}) => {
  const [dealerRunout, setDealerRunout] = useState<{ cards: string[]; total: number; busted: boolean } | null>(null);

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

  // Resetar simulação do dealer ao abrir novo modal
  useEffect(() => {
    setDealerRunout(null);
  }, [situation]);

  if (!isOpen) return null;

  const isDeviation = situation.isDeviation;
  const exp = situation.explanation;
  const isCorrect = userAction === situation.optimalAction;

  // Simular desfecho realista das cartas do dealer
  const handleSimulateDealer = () => {
    const ranks: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '10', '10', '10', 'A'];
    const upcardRank = situation.dealerCard.rank;
    let cards: CardRank[] = [upcardRank];
    
    // Segunda carta oculta (hole card)
    const holeRank = ranks[Math.floor(Math.random() * ranks.length)];
    cards.push(holeRank);

    // Calcular total
    const calcTotal = (cdRanks: CardRank[]) => {
      let tot = 0;
      let aces = 0;
      for (const r of cdRanks) {
        if (r === 'A') {
          tot += 11;
          aces += 1;
        } else {
          tot += rankToValue(r);
        }
      }
      while (tot > 21 && aces > 0) {
        tot -= 10;
        aces -= 1;
      }
      return tot;
    };

    let total = calcTotal(cards);

    // Dealer compra até pelo menos 17
    while (total < 17) {
      const nextCard = ranks[Math.floor(Math.random() * ranks.length)];
      cards.push(nextCard);
      total = calcTotal(cards);
    }

    setDealerRunout({
      cards,
      total,
      busted: total > 21,
    });
  };

  // Estimativa de perda financeira em reais/dólares
  const evLossUnits = isCorrect ? 0 : 0.055;
  const financialCost = (evLossUnits * betUnit).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 text-white"
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
        <div className="grid grid-cols-2 gap-3 mb-4">
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

        {/* EV Impact & Custo Financeiro Teórico */}
        {!isCorrect && (
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-200">Impacto Financeiro Teórico:</span>
                <p className="text-slate-300">Este erro desperdiça cerca de ~0.055x por aposta</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-rose-400 text-sm">-R$ {financialCost}</span>
              <span className="text-[10px] text-slate-400 block">(em base R${betUnit})</span>
            </div>
          </div>
        )}

        {/* Detalhes Matemáticos & Teóricos */}
        <div className="space-y-3 mb-5 text-sm bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Regra Estratégica:</span>
            </div>
            <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
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

          {/* Gráfico Comparativo de EV das Jogadas (se disponível) */}
          {exp.evBreakdown && exp.evBreakdown.length > 0 && (
            <div className="border-t border-slate-800/80 pt-2.5 space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Comparativo de Retorno Esperado (EV por Aposta):
              </span>
              {exp.evBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-mono">
                  <span className={`font-semibold ${item.action === situation.optimalAction ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    item.ev > 0
                      ? 'bg-emerald-950 text-emerald-300'
                      : item.action === situation.optimalAction
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-rose-950 text-rose-300'
                  }`}>
                    {item.ev > 0 ? `+${item.ev.toFixed(2)}` : item.ev.toFixed(2)} EV
                  </span>
                </div>
              ))}
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
            <div className="bg-purple-950/50 border border-purple-800/60 rounded-lg p-2.5 text-xs text-purple-200">
              <div className="font-bold flex items-center gap-1 mb-0.5">
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                <span>Índice Don Schlesinger (Illustrious 18):</span>
              </div>
              <div>{exp.cardCountingContext}</div>
            </div>
          )}
        </div>

        {/* Simulação Interativa do Desfecho do Dealer */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              Simular Rodada do Dealer:
            </span>
            <button
              onClick={handleSimulateDealer}
              className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-bold transition-colors"
            >
              Revelar Cartas
            </button>
          </div>
          {dealerRunout && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-1 font-mono">
                <span className="text-slate-400">Cartas puxadas:</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  {dealerRunout.cards.join(' + ')}
                </span>
              </div>
              <div className="font-bold">
                Total: <span className="text-amber-300 font-mono">{dealerRunout.total}</span>{' '}
                {dealerRunout.busted ? (
                  <span className="text-rose-400 uppercase font-black font-mono">(ESTOUROU!)</span>
                ) : (
                  <span className="text-emerald-400 uppercase font-mono">(Fez mão)</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Aviso de Repetição Espaçada Inteligente */}
        <div className="flex items-center gap-2 bg-blue-950/40 border border-blue-800/50 rounded-lg px-3 py-2 mb-4 text-xs text-blue-300">
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
