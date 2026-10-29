'use client';

import React from 'react';
import { TableRules, TrainingMode } from '@/lib/blackjack/types';
import { AppSettings } from '@/lib/storage';
import { X, Settings, RotateCcw, Volume2, VolumeX, Target, Layers } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: TableRules;
  settings: AppSettings;
  targetGoal: number;
  onUpdateRules: (newRules: TableRules) => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onUpdateTargetGoal: (newGoal: number) => void;
  onResetStats: () => void;
  reviewCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  rules,
  settings,
  targetGoal,
  onUpdateRules,
  onUpdateSettings,
  onUpdateTargetGoal,
  onResetStats,
  reviewCount,
}) => {
  if (!isOpen) return null;

  const modeOptions: Array<{ id: TrainingMode; title: string; desc: string }> = [
    { id: 'all', title: 'Todas as Mãos', desc: 'Mãos rígidas e suaves misturadas aleatoriamente.' },
    { id: 'hard', title: 'Apenas Mãos Rígidas (Hard)', desc: 'Totais de 8 a 17 sem Ás suave (decisões críticas de 12 a 16).' },
    { id: 'soft', title: 'Apenas Mãos Suaves (Soft)', desc: 'Mãos com Ás (A,2 a A,9) e janelas de dobrar.' },
    { id: 'review', title: `Fila de Erros (${reviewCount} pendentes)`, desc: 'Pratique apenas mãos que você errou anteriormente.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Configurações</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          
          {/* META DE TREINO */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold">
              <Target className="w-4 h-4 text-slate-600" />
              <span>Meta de Mãos (Contador X de Y)</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[500, 1000, 2500, 5000, 10000].map((goal) => (
                <button
                  key={goal}
                  onClick={() => onUpdateTargetGoal(goal)}
                  className={`py-2 px-2 rounded-xl font-mono font-bold text-xs transition-all border ${
                    targetGoal === goal
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {goal.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* MODO DE TREINO */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold">
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Modo de Treino</span>
            </div>
            <div className="space-y-2">
              {modeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateSettings({ ...settings, selectedMode: opt.id })}
                  className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                    settings.selectedMode === opt.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">{opt.title}</div>
                    <div className={`text-xs ${settings.selectedMode === opt.id ? 'text-slate-300' : 'text-slate-500'}`}>{opt.desc}</div>
                  </div>
                  {settings.selectedMode === opt.id && (
                    <span className="text-xs font-semibold bg-white/20 px-2.5 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* REGRAS DE MESA */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Regras de Mesa</h3>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-800">Dealer no 17 Suave (A,6):</span>
                <p className="text-xs text-slate-500">S17 para; H17 compra mais uma carta</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onUpdateRules({ ...rules, dealerRule: 'S17' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    rules.dealerRule === 'S17'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  S17 (Stand)
                </button>
                <button
                  onClick={() => onUpdateRules({ ...rules, dealerRule: 'H17' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    rules.dealerRule === 'H17'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  H17 (Hit)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-slate-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                <span className="font-medium text-slate-800">Efeitos Sonoros</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  settings.soundEnabled
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {settings.soundEnabled ? 'Ligado' : 'Mutado'}
              </button>
            </div>
          </div>

          {/* RESET */}
          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={() => {
                if (confirm('Zerar progresso e reiniciar contador de mãos?')) {
                  onResetStats();
                }
              }}
              className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zerar Estatísticas e Começar do Zero</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Salvar e Voltar
          </button>
        </div>

      </div>
    </div>
  );
};
