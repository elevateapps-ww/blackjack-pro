'use client';

import React from 'react';
import { Card as CardType } from '@/lib/blackjack/types';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CardComponent: React.FC<CardProps> = ({
  card,
  faceDown = false,
  className = '',
  size = 'md',
}) => {
  const isRed = card ? (card.suit === '♥' || card.suit === '♦') : false;

  // Tamanhos responsivos
  const sizeClasses = {
    sm: 'w-14 h-20 text-xs rounded-md',
    md: 'w-20 h-28 sm:w-24 sm:h-36 text-sm sm:text-base rounded-lg',
    lg: 'w-24 h-36 sm:w-28 sm:h-40 text-base sm:text-lg rounded-xl',
  }[size];

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeClasses} ${className} relative bg-gradient-to-br from-red-800 via-red-950 to-red-900 border-2 border-red-300/40 shadow-xl flex items-center justify-center overflow-hidden transition-transform transform select-none`}
        style={{
          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.6), inset 0 0 12px rgba(0,0,0,0.5)',
        }}
      >
        {/* Padrão geométrico de verso de baralho de cassino */}
        <div className="absolute inset-1 border border-red-400/30 rounded flex items-center justify-center bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:6px_6px]">
          <div className="w-8 h-8 rounded-full border border-red-400/40 flex items-center justify-center">
            <span className="text-red-300 font-serif font-bold text-xs opacity-75">♠♥</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} ${className} relative bg-white border border-gray-200/90 shadow-2xl flex flex-col justify-between p-1.5 sm:p-2.5 transition-all select-none animate-deal-card hover:-translate-y-1`}
      style={{
        boxShadow: '0 10px 25px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.3)',
      }}
    >
      {/* Canto superior esquerdo */}
      <div className={`flex flex-col items-center leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="font-extrabold font-mono tracking-tight text-base sm:text-xl">{card.rank}</span>
        <span className="text-xs sm:text-sm -mt-0.5">{card.suit}</span>
      </div>

      {/* Símbolo central */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isRed ? 'text-red-600/90' : 'text-slate-900/90'}`}>
        <span className="text-3xl sm:text-5xl font-serif">{card.suit}</span>
      </div>

      {/* Canto inferior direito (invertido) */}
      <div className={`flex flex-col items-center leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="font-extrabold font-mono tracking-tight text-base sm:text-xl">{card.rank}</span>
        <span className="text-xs sm:text-sm -mt-0.5">{card.suit}</span>
      </div>
    </div>
  );
};
