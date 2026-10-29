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
import { sounds } from '@/lib/audio/soundEffects';
import { fireMilestoneConfetti } from '@/lib/confetti';
import { HeaderHUD } from '@/components/HeaderHUD';
import { TableFelt } from '@/components/TableFelt';
import { ActionButtons } from '@/components/ActionButtons';
import { ExplanationModal } from '@/components/ExplanationModal';
import { StrategyChartModal } from '@/components/StrategyChartModal';
import { SettingsModal } from '@/components/SettingsModal';

export default function BlackjackTrainerPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [rules, setRules] = useState<TableRules>(DEFAULT_RULES);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [currentSituation, setCurrentSituation] = useState<HandSituation | null>(null);
  const [feedbackFlash, setFeedbackFlash] = useState<'correct' | 'incorrect' | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [lastUserAction, setLastUserAction] = useState<Action | null>(null);

  // Modais
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handStartTimeRef = useRef<number>(Date.now());
  const isProcessingAction = useRef(false);

  // 1. Carregar preferências no mount
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

  // 2. Próxima mão
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

  // 3. Execução da decisão do jogador (Pedir, Parar ou Dobrar)
  const handleUserAction = useCallback(
    (action: Action) => {
      if (!currentSituation || isProcessingAction.current) return;

      isProcessingAction.current = true;
      sounds.playChipClink();

      const reactionTime = Math.max(150, Date.now() - handStartTimeRef.current);
      setLastUserAction(action);

      const isCorrect = action === currentSituation.optimalAction;
      const category = currentSituation.category;

      const playerDisp = currentSituation.isSoft
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

        // Remove da fila de revisão caso já estivesse lá
        const updatedReviewQueue = stats.reviewQueue.filter(
          (id) => id !== currentSituation.id
        );

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

        // Marcos comemorativos
        if (newStreak === 10 || newStreak === 25 || newStreak === 50 || newStreak === 100 || (newStreak > 0 && newStreak % 100 === 0)) {
          sounds.playMilestone();
          fireMilestoneConfetti(newStreak);
        }

        // Avanço suave automático
        if (settings.autoAdvanceOnCorrect) {
          setTimeout(() => {
            nextHand(updatedReviewQueue);
          }, 200);
        } else {
          isProcessingAction.current = false;
        }
      } else {
        // --- ERROU ---
        sounds.playIncorrect();
        setFeedbackFlash('incorrect');

        const newTotal = stats.totalDecisions + 1;
        const newStreak = 0;
        const newTotalResponseTime = stats.totalResponseTimeMs + reactionTime;

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
          categoryStats: updatedCategoryStats,
          mistakeHistory: [mistakeEntry, ...(stats.mistakeHistory || [])].slice(0, 100),
          recentHistory: [mistakeEntry, ...(stats.recentHistory || [])].slice(0, 30),
          reviewQueue: updatedReviewQueue,
        };

        setStats(newStats);
        saveUserStats(newStats);

        // Abre modal de explicação
        setIsExplanationOpen(true);
      }
    },
    [currentSituation, stats, settings.autoAdvanceOnCorrect, nextHand]
  );

  // 4. Atalhos de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Se explicação estiver aberta, Enter e Barra avançam
      if (isExplanationOpen) {
        return;
      }

      if (e.key === 'Escape') {
        setIsChartOpen(false);
        setIsSettingsOpen(false);
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsChartOpen((prev) => !prev);
        return;
      }

      if (isChartOpen || isSettingsOpen) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === 'H' || key === 'P' || key === '1') {
        e.preventDefault();
        handleUserAction('H');
      } else if (key === 'S' || key === '2') {
        e.preventDefault();
        handleUserAction('S');
      } else if (key === 'D' || key === '3') {
        e.preventDefault();
        handleUserAction('D');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUserAction, isExplanationOpen, isChartOpen, isSettingsOpen]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-sm">
        Carregando Blackjack Pro...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* HEADER HUD LIMPO */}
      <HeaderHUD
        stats={stats}
        settings={settings}
        rules={rules}
        onOpenChart={() => setIsChartOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSound={() => handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
        onOpenReviewQueue={() => handleStartReviewMode()}
      />

      {/* ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col items-center justify-between p-4 sm:p-8 max-w-2xl mx-auto w-full gap-6">
        
        {/* Banner de Modo Focado se não for 'all' */}
        {settings.selectedMode !== 'all' && (
          <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2 flex items-center justify-between text-xs text-slate-700">
            <span>
              Modo: <strong>{settings.selectedMode === 'hard' ? 'Apenas Mãos Rígidas' : settings.selectedMode === 'soft' ? 'Apenas Mãos Suaves' : 'Fila de Erros'}</strong>
            </span>
            <button
              onClick={() => handleUpdateSettings({ ...settings, selectedMode: 'all' })}
              className="text-slate-900 font-bold hover:underline"
            >
              Voltar ao Geral
            </button>
          </div>
        )}

        {/* MESA DE CARTAS LIMPA */}
        <TableFelt
          situation={currentSituation}
          rules={rules}
          feedbackFlash={feedbackFlash}
        />

        {/* BOTÕES DE AÇÃO: PEDIR, PARAR, DOBRAR */}
        <div className="w-full space-y-3">
          <ActionButtons
            onAction={handleUserAction}
            allowedActions={['H', 'S', 'D']}
            disabled={isExplanationOpen}
          />

          {/* Dica de Teclado Minimalista */}
          <div className="flex items-center justify-center gap-4 text-slate-400 text-xs font-mono">
            <span><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold">H</kbd> Pedir</span>
            <span><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold">S</kbd> Parar</span>
            <span><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold">D</kbd> Dobrar</span>
            <span><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold">C</kbd> Tabela</span>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full py-4 px-4 text-center text-xs text-slate-400 border-t border-slate-100">
        Blackjack Pro • Sem login necessário • Progresso salvo localmente
      </footer>

      {/* MODAL DE EXPLICAÇÃO AO ERRAR (ENTER ou ESPAÇO avança) */}
      {currentSituation && lastUserAction && (
        <ExplanationModal
          isOpen={isExplanationOpen}
          situation={currentSituation}
          userAction={lastUserAction}
          onNext={() => nextHand()}
        />
      )}

      {/* MODAL DA TABELA LIMPA */}
      <StrategyChartModal
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
        rules={rules}
        currentHandTotal={currentSituation?.playerTotal}
        currentDealerRank={currentSituation?.dealerCard.rank}
        currentIsSoft={currentSituation?.isSoft}
      />

      {/* MODAL DE CONFIGURAÇÕES */}
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

    </div>
  );
}
