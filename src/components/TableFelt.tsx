'use client';

import React from 'react';
import { HandSituation, TableRules } from '@/lib/blackjack/types';
import { CardComponent } from './CardComponent';
import { Award, Zap, Brain } from 'lucide-react';

interface TableFeltProps {
  situation: HandSituation | null;
  rules: TableRules;
  feedbackFlash: 'correct' | 'incorrect' | null;
}

export const TableFelt: React.FC<TableFeltProps> = ({
  situation,
  rules,
  feedbackFlash,
}) => {
  if (!situation) {
    return (
      <div className="w-full h-72 flex items-center justify-center text-slate-400">
        Embaralhando situações didáticas...
      </div>
    );
  }

  const { playerCards, dealerCard, isSoft, playerTotal } = situation;

  const playerHandTitle = isSoft
    ? `A,${playerTotal - 11} (Suave ${playerTotal})`
    : `${playerTotal} Rígido`;

  // Identificador didático de arquétipo
  let didacticTag = '';
  if (playerTotal === 12) {
    didacticTag = 'Armadilha Crítica: A Regra do 12';
  } else if (isSoft && playerTotal === 18) {
    didacticTag = 'Decisão Divisora: 18 Suave';
  } else if (isSoft && playerTotal === 17) {
    didacticTag = 'Atenção: 17 Suave Nunca Para';
  } else if (!isSoft && playerTotal >= 13 && playerTotal <= 16) {
    didacticTag = 'Mão Quebrada (Stiff Hand)';
  } else if (!isSoft && (playerTotal === 9 || playerTotal === 10 || playerTotal === 11)) {
    didacticTag = 'Zona de Dobro (Hard)';
  } else if (isSoft && playerTotal <= 16) {
    didacticTag = 'Zona de Dobro Suave (Soft)';
  }

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-sm select-none transition-all">
      
      {/* Flash Feedback visual */}
      {feedbackFlash === 'correct' && (
        <div className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500 rounded-3xl z-20 pointer-events-none animate-fade-in flex items-center justify-center">
          <div className="bg-emerald-600 text-white font-bold text-sm sm:text-base px-5 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-200" />
            <span>Correto! Decisão Ótima</span>
          </div>
        </div>
      )}

      {/* ÁREA DO DEALER */}
      <div className="flex flex-col items-center justify-center mb-6 relative z-10">
        
        {/* Tag Didática da Situação */}
        {didacticTag && (
          <div className="mb-3 flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-full border border-slate-200/80">
            <Brain className="w-3.5 h-3.5 text-slate-600" />
            <span>{didacticTag}</span>
          </div>
        )}

        {/* Cartas do Dealer */}
        <div className="flex items-center gap-3">
          <CardComponent card={dealerCard} size="md" />
          <CardComponent faceDown={true} size="md" />
        </div>

        <span className="text-xs font-semibold text-slate-600 mt-2 font-mono">
          Dealer Mostra: <strong className="text-slate-900 font-bold">{dealerCard.rank}</strong>
        </span>
      </div>

      <div className="w-full h-px bg-slate-100 my-4" />

      {/* ÁREA DO JOGADOR */}
      <div className="flex flex-col items-center justify-center relative z-10">
        
        {/* Cartas do Jogador */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <CardComponent card={playerCards[0]} size="lg" />
          <CardComponent card={playerCards[1]} size="lg" />
        </div>

        {/* Badge de Pontuação da Mão */}
        <div className="bg-slate-100 text-slate-800 font-extrabold text-sm px-4 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-mono">{playerHandTitle}</span>
        </div>

      </div>

    </div>
  );
};
