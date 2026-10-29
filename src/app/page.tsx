'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Action, HandSituation, TableRules, TrainingMode, UserStats, HandRecord } from '@/lib/blackjack/types';
import {
  loadUserStats,
  saveUserStats,
  loadTableRules,
  saveTableRules,
  loadAppSettings,
  saveAppSettings,
  resetAllStats,
  AppSettings,
  DEFAULT_STATS,
  DEFAULT_RULES,
  DEFAULT_SETTINGS,
} from '@/lib/storage';
import { generateHandSituation } from '@/lib/blackjack/handGenerator';
import { calculateEvLoss } from '@/lib/blackjack/strategyMatrix';
import { sounds } from '@/lib/audio/soundEffects';
import { fireMilestoneConfetti } from '@/lib/confetti';
import { HeaderHUD } from '@/components/HeaderHUD';
import { TableFelt } from '@/components/TableFelt';
import { ActionButtons } from '@/components/ActionButtons';
import { ExplanationModal } from '@/components/ExplanationModal';
import { StrategyChartModal } from '@/components/StrategyChartModal';
import { SettingsModal } from '@/components/SettingsModal';
import { StatsModal } from '@/components/StatsModal';
import { Keyboard, Flame, Sparkles } from 'lucide-react';

export default function BlackjackTrainerPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [rules, setRules] = useState<TableRules>(DEFAULT_RULES);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [currentSituation, setCurrentSituation] = useState<HandSituation | null>(null);
  const [feedbackFlash, setFeedbackFlash] = useState<'correct' | 'incorrect' | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [lastUserAction, setLastUserAction] = useState<Action | null>(null);
  const [lastReactionTimeMs, setLastReactionTimeMs] = useState<number | undefined>(undefined);

  // Modais auxiliares
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Timer de reação para medir velocidade de decisão
  const handStartTimeRef = useRef<number>(Date.now());
  const isProcessingAction = useRef(false);

  // 1. Carregar preferências do LocalStorage no mount
  useEffect(() => {
    const loadedStats = loadUserStats();
    const loadedRules = loadTableRules();
    const loadedSettings = loadAppSettings();

    setStats(loadedStats);
    setRules(loadedRules);
    setSettings(loadedSettings);
    sounds.enabled = loadedSettings.soundEnabled;

    const initialSit = generateHandSituation(
      loadedSettings.selectedMode,
      loadedRules,
      loadedStats.reviewQueue
    );
    setCurrentSituation(initialSit);
    handStartTimeRef.current = Date.now();
    setMounted(true);
    sounds.playCardDeal();
  }, []);

  // 2. Função para avançar para a próxima mão
  const nextHand = useCallback(
    (customQueue?: string[], customMode?: TrainingMode, customRules?: TableRules) => {
      const activeRules = customRules || rules;
      const activeMode = customMode || settings.selectedMode;
      const activeQueue = customQueue || stats.reviewQueue;

      const nextSit = generateHandSituation(activeMode, activeRules, activeQueue);
      setCurrentSituation(nextSit);
      setIsExplanationOpen(false);
      setLastUserAction(null);
      setFeedbackFlash(null);
      isProcessingAction.current = false;
      handStartTimeRef.current = Date.now();
      sounds.playCardDeal();
    },
    [rules, settings.selectedMode, stats.reviewQueue]
  );

  // 3. Execução da decisão do jogador
  const handleUserAction = useCallback(
    (action: Action) => {
      if (!currentSituation || isProcessingAction.current) return;
      if (!currentSituation.allowedActions.includes(action)) return;

      isProcessingAction.current = true;
      sounds.playChipClink();

      const reactionTime = Math.max(150, Date.now() - handStartTimeRef.current);
      setLastReactionTimeMs(reactionTime);
      setLastUserAction(action);

      const isCorrect = action === currentSituation.optimalAction;
      const category = currentSituation.category;

      const playerDisp = currentSituation.isPair
        ? `Par ${currentSituation.playerCards[0].rank}s`
        : currentSituation.isSoft
        ? `A,${currentSituation.playerTotal - 11}`
        : `${currentSituation.playerTotal}`;

      if (isCorrect) {
        // --- ACERTOU ---
        sounds.playCorrect();
        setFeedbackFlash('correct');

        const newTotal = stats.totalDecisions + 1;
        const newCorrect = stats.correctDecisions + 1;
        const newStreak = stats.currentStreak + 1;
        const newBestStreak = Math.max(stats.bestStreak, newStreak);
        const newTotalResponseTime = stats.totalResponseTimeMs + reactionTime;

        // Se a mão estava na fila de revisão, removemos porque o usuário já dominou!
        const updatedReviewQueue = stats.reviewQueue.filter(
          (id) => id !== currentSituation.id
        );

        // Estatísticas por categoria
        const updatedCategoryStats = { ...stats.categoryStats };
        if (updatedCategoryStats[category]) {
          updatedCategoryStats[category] = {
            total: updatedCategoryStats[category].total + 1,
            correct: updatedCategoryStats[category].correct + 1,
          };
        }

        const historyRecord: HandRecord = {
          situationId: currentSituation.id,
          playerDisplay: playerDisp,
          dealerDisplay: currentSituation.dealerCard.rank,
          userAction: action,
          correctAction: currentSituation.optimalAction,
          isCorrect: true,
          responseTimeMs: reactionTime,
          evLoss: 0,
          timestamp: Date.now(),
        };

        const newStats: UserStats = {
          ...stats,
          totalDecisions: newTotal,
          correctDecisions: newCorrect,
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          totalResponseTimeMs: newTotalResponseTime,
          categoryStats: updatedCategoryStats,
          reviewQueue: updatedReviewQueue,
          recentHistory: [historyRecord, ...(stats.recentHistory || [])].slice(0, 30),
        };

        setStats(newStats);
        saveUserStats(newStats);

        // Marcos comemorativos (Confete e som especial)
        if (newStreak === 10 || newStreak === 25 || newStreak === 50 || newStreak === 100 || (newStreak > 0 && newStreak % 100 === 0)) {
          sounds.playMilestone();
          fireMilestoneConfetti(newStreak);
        }

        // Avanço automático suave (220ms para registrar a cor verde)
        if (settings.autoAdvanceOnCorrect) {
          setTimeout(() => {
            nextHand(updatedReviewQueue);
          }, 220);
        } else {
          isProcessingAction.current = false;
        }
      } else {
        // --- ERROU ---
        sounds.playIncorrect();
        setFeedbackFlash('incorrect');

        const newTotal = stats.totalDecisions + 1;
        const newStreak = 0; // zera a sequência de acertos
        const newTotalResponseTime = stats.totalResponseTimeMs + reactionTime;

        // Calcular EV perdido
        const evLoss = calculateEvLoss(
          currentSituation.optimalAction,
          action,
          currentSituation.playerTotal,
          currentSituation.dealerCard.rank,
          currentSituation.isSoft,
          currentSituation.isPair
        );
        const newTotalEvLoss = stats.totalEvLoss + evLoss;

        // Adiciona à fila de revisão prioritária para fixação ("O que eu errar, coloca de novo")
        const updatedReviewQueue = stats.reviewQueue.includes(currentSituation.id)
          ? stats.reviewQueue
          : [...stats.reviewQueue, currentSituation.id];

        const mistakeEntry: HandRecord = {
          situationId: currentSituation.id,
          playerDisplay: playerDisp,
          dealerDisplay: currentSituation.dealerCard.rank,
          userAction: action,
          correctAction: currentSituation.optimalAction,
          isCorrect: false,
          responseTimeMs: reactionTime,
          evLoss,
          timestamp: Date.now(),
        };

        const updatedCategoryStats = { ...stats.categoryStats };
        if (updatedCategoryStats[category]) {
          updatedCategoryStats[category] = {
            total: updatedCategoryStats[category].total + 1,
            correct: updatedCategoryStats[category].correct,
          };
        }

        const newStats: UserStats = {
          ...stats,
          totalDecisions: newTotal,
          currentStreak: newStreak,
          totalResponseTimeMs: newTotalResponseTime,
          totalEvLoss: newTotalEvLoss,
          categoryStats: updatedCategoryStats,
          mistakeHistory: [mistakeEntry, ...(stats.mistakeHistory || [])].slice(0, 100),
          recentHistory: [mistakeEntry, ...(stats.recentHistory || [])].slice(0, 30),
          reviewQueue: updatedReviewQueue,
        };

        setStats(newStats);
        saveUserStats(newStats);

        // Abre modal de explicação profunda
        setIsExplanationOpen(true);
      }
    },
    [currentSituation, stats, settings.autoAdvanceOnCorrect, nextHand]
  );

  // 4. Atalhos Globais de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora digitação se estiver dentro de input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Se modal de explicação estiver aberto, ENTER e ESPAÇO avançam (já tratado no modal)
      if (isExplanationOpen) {
        return;
      }

      // ESC fecha modais abertos
      if (e.key === 'Escape') {
        setIsChartOpen(false);
        setIsSettingsOpen(false);
        setIsStatsOpen(false);
        return;
      }

      // Abrir/fechar tabela com 'c' ou 'C'
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsChartOpen((prev) => !prev);
        return;
      }

      // Se algum outro modal estiver aberto, não dispara ações de cartas
      if (isChartOpen || isSettingsOpen || isStatsOpen) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === 'H') {
        e.preventDefault();
        handleUserAction('H');
      } else if (key === 'S') {
        e.preventDefault();
        handleUserAction('S');
      } else if (key === 'D') {
        e.preventDefault();
        handleUserAction('D');
      } else if (key === 'P' || key === 'Y' || key === 'V') {
        e.preventDefault();
        handleUserAction('P');
      } else if (key === 'R') {
        e.preventDefault();
        handleUserAction('R');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUserAction, isExplanationOpen, isChartOpen, isSettingsOpen, isStatsOpen]);

  // Handlers de configuração
  const handleUpdateRules = (newRules: TableRules) => {
    setRules(newRules);
    saveTableRules(newRules);
    nextHand(undefined, undefined, newRules);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    sounds.enabled = newSettings.soundEnabled;
    saveAppSettings(newSettings);
    nextHand(undefined, newSettings.selectedMode);
  };

  const handleUpdateTargetGoal = (newGoal: number) => {
    const updated = { ...stats, targetGoal: newGoal };
    setStats(updated);
    saveUserStats(updated);
  };

  const handleResetStats = () => {
    const reset = resetAllStats();
    setStats(reset);
    nextHand([]);
  };

  const handleStartReviewMode = () => {
    const newSettings = { ...settings, selectedMode: 'review' as TrainingMode };
    setSettings(newSettings);
    saveAppSettings(newSettings);
    nextHand(undefined, 'review');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono">
        Carregando Blackjack Apex Pro...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-felt-950 text-slate-100 overflow-x-hidden">
      
      {/* HEADER HUD FIXO COM PROGRESSO E METAS */}
      <HeaderHUD
        stats={stats}
        settings={settings}
        rules={rules}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenChart={() => setIsChartOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSound={() => handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
        onOpenReviewQueue={() => handleStartReviewMode()}
      />

      {/* ÁREA PRINCIPAL DA MESA */}
      <main className="flex-1 flex flex-col items-center justify-between p-3 sm:p-6 max-w-5xl mx-auto w-full gap-4 sm:gap-6">
        
        {/* Banner do Modo Ativo se não for 'all' */}
        {settings.selectedMode !== 'all' && (
          <div className="w-full max-w-2xl bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                Treinando Modo Focado: <strong>{settings.selectedMode.toUpperCase()}</strong>
              </span>
            </div>
            <button
              onClick={() => handleUpdateSettings({ ...settings, selectedMode: 'all' })}
              className="underline text-amber-200 hover:text-white font-bold"
            >
              Voltar para Todas as Mãos
            </button>
          </div>
        )}

        {/* MESA DE FELTRO COM CARTAS */}
        <TableFelt
          situation={currentSituation}
          rules={rules}
          feedbackFlash={feedbackFlash}
          reactionTimeMs={lastReactionTimeMs}
          showSpeedTimer={settings.speedTimerEnabled}
        />

        {/* BOTÕES DE AÇÃO E ATALHOS */}
        <div className="w-full space-y-3">
          <ActionButtons
            onAction={handleUserAction}
            allowedActions={currentSituation?.allowedActions || ['H', 'S']}
            disabled={isExplanationOpen}
          />

          {/* Dica de Teclado no Rodapé */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-slate-500 text-[11px] font-mono text-center">
            <span className="flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5" />
              Atalhos de Teclado Rápidos:
            </span>
            <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">H</kbd> Pedir</span>
            <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">S</kbd> Parar</span>
            <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">D</kbd> Dobrar</span>
            <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">P / Y</kbd> Dividir</span>
            <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">R</kbd> Render-se</span>
            <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">C</kbd> Tabela</span>
          </div>
        </div>

      </main>

      {/* FOOTER DISCRETO */}
      <footer className="w-full py-3 px-4 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-1.5">
          <span>Blackjack Apex Pro</span>
          <span>•</span>
          <span>Estratégia Básica e Teoria Matemática GTO</span>
        </div>
        <div className="text-[11px] text-slate-600 mt-1 sm:mt-0">
          Sem login necessário • Progresso 100% gravado no navegador
        </div>
      </footer>

      {/* MODAL DE EXPLICAÇÃO MATEMÁTICA / ERRO (ENTER ou ESPAÇO avança) */}
      {currentSituation && lastUserAction && (
        <ExplanationModal
          isOpen={isExplanationOpen}
          situation={currentSituation}
          userAction={lastUserAction}
          onNext={() => nextHand()}
          betUnit={stats.betUnit}
        />
      )}

      {/* MODAL DA TABELA DE ESTRATÉGIA BÁSICA INTERATIVA */}
      <StrategyChartModal
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
        rules={rules}
        currentHandTotal={currentSituation?.playerTotal}
        currentDealerRank={currentSituation?.dealerCard.rank}
        currentIsSoft={currentSituation?.isSoft}
        currentIsPair={currentSituation?.isPair}
        currentPairRank={currentSituation?.isPair ? currentSituation.playerCards[0].rank : undefined}
      />

      {/* MODAL DE CONFIGURAÇÕES E REGRAS DA MESA */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rules={rules}
        settings={settings}
        targetGoal={stats.targetGoal}
        onUpdateRules={handleUpdateRules}
        onUpdateSettings={handleUpdateSettings}
        onUpdateTargetGoal={handleUpdateTargetGoal}
        onResetStats={handleResetStats}
        reviewCount={stats.reviewQueue.length}
      />

      {/* MODAL DE ESTATÍSTICAS E REVISÃO DE ERROS */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onStartReviewMode={handleStartReviewMode}
        onUpdateBetUnit={(unit) => {
          const upd = { ...stats, betUnit: unit };
          setStats(upd);
          saveUserStats(upd);
        }}
      />

    </div>
  );
}
