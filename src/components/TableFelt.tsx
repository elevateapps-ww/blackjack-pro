'use client';

import React, { useState } from 'react';
import { HandSituation, TableRules } from '@/lib/blackjack/types';
import { CardComponent } from './CardComponent';
import { Zap, Flame, Award, Timer, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface TableFeltProps {
  situation: HandSituation | null;
  rules: TableRules;
  feedbackFlash: 'correct' | 'incorrect' | null;
  reactionTimeMs?: number;
  showSpeedTimer?: boolean;
}

export const TableFelt: React.FC<TableFeltProps> = ({
  situation,
  rules,
  feedbackFlash,
  reactionTimeMs,
  showSpeedTimer = true,
}) => {
  const [showQuickTheory, setShowQuickTheory] = useState(false);

  if (!situation) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-slate-400">
        Carregando próxima situação...
      </div>
    );
  }

  const { playerCards, dealerCard, isSoft, isPair, playerTotal, isDeviation, trueCount, runningCount } = situation;

  // Rótulo da mão do jogador
  const playerHandTitle = isPair
    ? `Par de ${playerCards[0].rank}s (${playerTotal})`
    : isSoft
    ? `A,${playerTotal - 11} (Suave ${playerTotal})`
    : `${playerTotal} Rígido`;

  // Classificação da zona do dealer
  const dRank = dealerCard.rank;
  const isHighBustZone = ['4', '5', '6'].includes(dRank);
  const isNeutralZone = ['2', '3'].includes(dRank);
  const isDangerousZone = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'].includes(dRank);

  const speedRating = reactionTimeMs
    ? reactionTimeMs < 1200
      ? { text: '⚡ Ultra-Rápido', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' }
      : reactionTimeMs < 2200
      ? { text: '⏱ Ritmo Vegas', color: 'text-amber-300 bg-amber-950/60 border-amber-800' }
      : { text: '🐢 Hesitante', color: 'text-rose-300 bg-rose-950/60 border-rose-800' }
    : null;

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl p-4 sm:p-7 overflow-hidden select-none border-4 border-amber-950/40 shadow-2xl bg-gradient-to-b from-felt-900 via-felt-800 to-felt-900">
      
      {/* Felt Texture & Ring Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#157d5430_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />
      <div className="absolute inset-4 sm:inset-6 rounded-2xl border-2 border-emerald-500/20 pointer-events-none" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none" />

      {/* Flash Feedback visual */}
      {feedbackFlash === 'correct' && (
        <div className="absolute inset-0 bg-emerald-500/20 border-4 border-emerald-400 z-20 pointer-events-none animate-pulse-subtle flex items-center justify-center">
          <div className="bg-emerald-600/95 text-white font-black text-xl sm:text-2xl px-6 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-300">
            <Award className="w-7 h-7 text-yellow-300 animate-bounce-short" />
            <span>DECISÃO PERFEITA!</span>
          </div>
        </div>
      )}

      {/* ÁREA DO DEALER */}
      <div className="flex flex-col items-center justify-center mb-5 sm:mb-7 relative z-10">
        
        {/* Placa de regras da mesa gravada no feltro */}
        <div className="text-[10px] sm:text-xs font-mono tracking-widest text-emerald-400/80 uppercase font-bold mb-3 px-4 py-1 rounded-full bg-felt-950/70 border border-emerald-500/20 shadow-inner flex flex-wrap items-center justify-center gap-2">
          <span>BLACKJACK PAGA 3:2</span>
          <span>•</span>
          <span>{rules.dealerRule === 'S17' ? 'DEALER STANDS NO 17' : 'DEALER HITS NO 17 SUAVE'}</span>
          <span>•</span>
          <span>{rules.das ? 'DAS ATIVO' : 'SEM DAS'}</span>
        </div>

        {/* Cartas do Dealer */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          {/* Carta aberta */}
          <div className="relative group">
            <CardComponent card={dealerCard} size="md" />
            <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded-full border shadow-md font-bold ${
              isHighBustZone
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : isNeutralZone
                ? 'bg-amber-950 text-amber-300 border-amber-600'
                : 'bg-rose-950 text-rose-300 border-rose-600'
            }`}>
              Bust: {situation.explanation.dealerBustProbability.split(' ')[0]}
            </div>
          </div>

          {/* Carta oculta do Dealer */}
          <CardComponent faceDown={true} size="md" />
        </div>

        {/* Indicador de Fraqueza/Força do Dealer */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs font-bold text-emerald-300/90 uppercase tracking-wider">
            Dealer Mostra: <strong className="text-white font-mono text-sm">{dealerCard.rank}</strong>
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isHighBustZone
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : isNeutralZone
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}>
            {isHighBustZone ? 'Zona de Estouro Alta' : isNeutralZone ? 'Zona Neutra' : 'Zona Forte (Pat Hand)'}
          </span>
        </div>
      </div>

      {/* HUD DE CONTAGEM (SE MODO DESVIOS/ILLUSTRIOUS 18) */}
      {isDeviation && (
        <div className="relative z-10 max-w-md mx-auto mb-5 bg-gradient-to-r from-purple-950/90 via-slate-900/95 to-purple-950/90 border border-purple-500/50 rounded-2xl p-3 shadow-xl text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-purple-300 uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 text-purple-400" />
            <span>Desafio de Contagem de Cartas (True Count)</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm font-mono">
            <div className="bg-purple-900/50 px-3 py-1 rounded-lg border border-purple-500/30">
              <span className="text-purple-300 text-xs">True Count: </span>
              <strong className="text-white text-base">{(trueCount || 0) >= 0 ? `+${trueCount}` : trueCount}</strong>
            </div>
            <div className="bg-slate-950/70 px-3 py-1 rounded-lg border border-slate-700">
              <span className="text-slate-400 text-xs">Running Count: </span>
              <strong className="text-slate-200">{(runningCount || 0) >= 0 ? `+${runningCount}` : runningCount}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DO JOGADOR */}
      <div className="flex flex-col items-center justify-center relative z-10">
        
        {/* Cartas do Jogador */}
        <div className="flex items-center justify-center -space-x-4 sm:-space-x-6 mb-3 hover:space-x-1 transition-all">
          <CardComponent card={playerCards[0]} size="lg" className="transform -rotate-3 hover:rotate-0" />
          <CardComponent card={playerCards[1]} size="lg" className="transform rotate-3 hover:rotate-0" />
        </div>

        {/* Badges de Mão & Velocidade */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Pontuação da Mão */}
          <div className="bg-slate-950/95 text-white font-extrabold text-sm sm:text-base px-4 py-1.5 rounded-full border border-amber-400/50 shadow-xl flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-mono tracking-tight">{playerHandTitle}</span>
          </div>

          {/* Medidor de Velocidade da Decisão Anterior */}
          {showSpeedTimer && speedRating && (
            <div className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border shadow flex items-center gap-1.5 ${speedRating.color}`}>
              <Timer className="w-3.5 h-3.5" />
              <span>{((reactionTimeMs || 0) / 1000).toFixed(2)}s</span>
              <span className="text-[10px] font-sans font-semibold">({speedRating.text})</span>
            </div>
          )}

          {/* Botão de Dica Rápida de Teoria (Tecla T) */}
          <button
            onClick={() => setShowQuickTheory(!showQuickTheory)}
            className="text-xs bg-slate-900/90 hover:bg-slate-800 text-amber-300 px-3 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-1 transition-all"
            title="Dica Rápida de Teoria [T]"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Teoria [T]</span>
            {showQuickTheory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Dropdown de Teoria Rápida */}
        {showQuickTheory && (
          <div className="mt-3 max-w-lg bg-slate-950/95 border border-amber-500/40 rounded-xl p-3 text-xs text-slate-300 shadow-xl animate-fade-in text-center">
            <div className="font-bold text-amber-400 mb-1 flex items-center justify-center gap-1">
              <span>{situation.explanation.title}</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              {situation.explanation.ruleExplanation}
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
