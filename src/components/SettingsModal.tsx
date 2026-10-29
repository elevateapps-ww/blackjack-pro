'use client';

import React from 'react';
import { TableRules, TrainingMode } from '@/lib/blackjack/types';
import { AppSettings } from '@/lib/storage';
import { X, Settings, RotateCcw, Volume2, VolumeX, FastForward, Target, Layers } from 'lucide-react';

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
    { id: 'all', title: '⚡ Todas as Mãos (Mundial Completo)', desc: 'Treine todas as combinações de Hard, Soft, Pares e Rendição.' },
    { id: 'hard', title: '🧱 Apenas Mãos Rígidas (Hard Totals)', desc: 'Mãos de 8 a 17+ sem Ás suave (decisões críticas de 12 a 16).' },
    { id: 'soft', title: '🃏 Apenas Mãos Suaves (Soft Totals)', desc: 'Mãos com Ás valendo 11 (A,2 a A,9) e decisões de dobrar.' },
    { id: 'pairs', title: '✂️ Apenas Pares (Pair Splitting)', desc: 'Divisões perfeitas de 2,2 até A,A.' },
    { id: 'surrender', title: '🏳️ Apenas Rendição (Surrender)', desc: 'Decisões de quando abandonar a mão para salvar 50% da aposta.' },
    { id: 'deviations', title: '🧠 Contagem & Desvios (Illustrious 18)', desc: 'True Count e índices profissionais de Don Schlesinger.' },
    { id: 'review', title: `🔁 Foco nos Meus Erros (${reviewCount} na fila)`, desc: 'Pratique apenas mãos que você errou anteriormente até zerar!' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">Configurações & Teoria de Mesa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          
          {/* META DE TREINO (TARGET GOAL) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold">
              <Target className="w-4 h-4" />
              <span>Sua Meta de Mãos (Contador X de Y)</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Defina quantas mãos perfeitas você deseja alcançar na sua maratona de fixação mental:
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[500, 1000, 2500, 5000, 10000].map((goal) => (
                <button
                  key={goal}
                  onClick={() => onUpdateTargetGoal(goal)}
                  className={`py-2 px-3 rounded-lg font-mono font-bold text-xs transition-all ${
                    targetGoal === goal
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {goal.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* MODO DE TREINAMENTO */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold">
              <Layers className="w-4 h-4" />
              <span>Modo de Treinamento</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {modeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateSettings({ ...settings, selectedMode: opt.id })}
                  className={`p-3 rounded-xl text-left border transition-all flex items-start justify-between ${
                    settings.selectedMode === opt.id
                      ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900 border-emerald-500/80 ring-1 ring-emerald-500/50'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white text-sm mb-0.5">{opt.title}</div>
                    <div className="text-xs text-slate-400">{opt.desc}</div>
                  </div>
                  {settings.selectedMode === opt.id && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      Ativo
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* REGRAS DO CASSINO (TABLE RULES) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
              Variações e Regras de Mesa (Cassino Mundial)
            </h3>

            {/* Dealer Soft 17: S17 vs H17 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-200">Dealer no 17 Suave (A,6):</span>
                <p className="text-xs text-slate-400">
                  {rules.dealerRule === 'S17' ? 'S17: Dealer Para (Stand) no 17 suave (Mais favorável ao jogador)' : 'H17: Dealer Pede (Hit) no 17 suave (+0.22% vantagem da casa)'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateRules({ ...rules, dealerRule: 'S17' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    rules.dealerRule === 'S17' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  S17 (Stands)
                </button>
                <button
                  onClick={() => onUpdateRules({ ...rules, dealerRule: 'H17' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    rules.dealerRule === 'H17' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  H17 (Hits)
                </button>
              </div>
            </div>

            {/* Dobrar após Dividir (DAS) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
              <div>
                <span className="font-semibold text-slate-200">Dobrar após Dividir (DAS):</span>
                <p className="text-xs text-slate-400">Permite dobrar aposta logo após um split de par</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateRules({ ...rules, das: true })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    rules.das ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  DAS Ativo
                </button>
                <button
                  onClick={() => onUpdateRules({ ...rules, das: false })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    !rules.das ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Sem DAS
                </button>
              </div>
            </div>

            {/* Rendição (Surrender) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
              <div>
                <span className="font-semibold text-slate-200">Rendição Tardia (Late Surrender):</span>
                <p className="text-xs text-slate-400">Permite abrir mão de 50% da aposta com 15 e 16 vs 9, 10, A</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateRules({ ...rules, surrender: 'late' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    rules.surrender === 'late' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Surrender Permitido
                </button>
                <button
                  onClick={() => onUpdateRules({ ...rules, surrender: 'none' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    rules.surrender === 'none' ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Sem Surrender
                </button>
              </div>
            </div>

            {/* Quantidade de Baralhos (Decks) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
              <div>
                <span className="font-semibold text-slate-200">Número de Baralhos (Shoe):</span>
                <p className="text-xs text-slate-400">Influencia índices de contagem e penetração</p>
              </div>
              <div className="flex gap-1.5">
                {([1, 2, 6, 8] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => onUpdateRules({ ...rules, decks: d })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                      rules.decks === d ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {d === 1 ? '1 Deck' : `${d} Decks`}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* PREFERÊNCIAS DE INTERFACE */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white text-sm">Opções de Ritmo e Áudio</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span className="text-slate-200">Efeitos Sonoros Nativos</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  settings.soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.soundEnabled ? 'Ligado' : 'Mutado'}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
              <div className="flex items-center gap-2">
                <FastForward className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-slate-200">Avançar Rápido ao Acertar</span>
                  <p className="text-xs text-slate-400">Passa imediatamente para a próxima mão se acertar</p>
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, autoAdvanceOnCorrect: !settings.autoAdvanceOnCorrect })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  settings.autoAdvanceOnCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.autoAdvanceOnCorrect ? 'Automático' : 'Manual'}
              </button>
            </div>
          </div>

          {/* RESETAR DADOS */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja zerar todas as estatísticas e histórico de erros?')) {
                  onResetStats();
                }
              }}
              className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Resetar Estatísticas e Começar do Zero</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors"
          >
            Salvar e Voltar ao Treino
          </button>
        </div>

      </div>
    </div>
  );
};
