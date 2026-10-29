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

  const sizeClasses = {
    sm: 'w-14 h-20 text-xs rounded-lg',
    md: 'w-20 h-28 sm:w-24 sm:h-34 text-sm sm:text-base rounded-xl',
    lg: 'w-24 h-36 sm:w-28 sm:h-40 text-base sm:text-lg rounded-2xl',
  }[size];

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeClasses} ${className} relative bg-slate-800 border-2 border-slate-700 shadow-md flex items-center justify-center overflow-hidden select-none`}
      >
        <div className="absolute inset-1.5 border border-slate-600/60 rounded-lg flex items-center justify-center bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:6px_6px]">
          <span className="text-slate-400 font-serif text-xs opacity-75">♠♥</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} ${className} relative bg-white border border-slate-200 shadow-md flex flex-col justify-between p-2 sm:p-2.5 transition-all select-none animate-deal-card hover:-translate-y-1 hover:shadow-lg`}
    >
      {/* Canto superior esquerdo */}
      <div className={`flex flex-col items-center leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        <span className="font-extrabold font-mono tracking-tight text-base sm:text-xl">{card.rank}</span>
        <span className="text-xs sm:text-sm">{card.suit}</span>
      </div>

      {/* Símbolo central */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isRed ? 'text-rose-600/80' : 'text-slate-900/80'}`}>
        <span className="text-3xl sm:text-5xl font-serif">{card.suit}</span>
      </div>

      {/* Canto inferior direito (invertido) */}
      <div className={`flex flex-col items-center leading-none rotate-180 ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        <span className="font-extrabold font-mono tracking-tight text-base sm:text-xl">{card.rank}</span>
        <span className="text-xs sm:text-sm">{card.suit}</span>
      </div>
    </div>
  );
};
