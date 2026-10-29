import { TableRules, TrainingMode, UserStats } from './blackjack/types';
import {
  loadRobustStats,
  saveRobustStats,
  loadRobustRules,
  saveRobustRules,
  loadRobustSettings,
  saveRobustSettings,
} from './persistence';

export const DEFAULT_RULES: TableRules = {
  decks: 6,
  dealerRule: 'S17',
  doubleRestrictions: 'any',
};

export const DEFAULT_STATS: UserStats = {
  totalDecisions: 0,
  correctDecisions: 0,
  currentStreak: 0,
  bestStreak: 0,
  targetGoal: 5000,
  totalResponseTimeMs: 0,
  categoryStats: {
    hard: { total: 0, correct: 0 },
    soft: { total: 0, correct: 0 },
  },
  mistakeHistory: [],
  recentHistory: [],
  reviewQueue: [],
};

export interface AppSettings {
  soundEnabled: boolean;
  autoAdvanceOnCorrect: boolean;
  selectedMode: TrainingMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  autoAdvanceOnCorrect: true,
  selectedMode: 'all',
};

export function loadUserStats(): UserStats {
  return loadRobustStats();
}

export function saveUserStats(stats: UserStats): void {
  saveRobustStats(stats);
}

export function loadTableRules(): TableRules {
  return loadRobustRules();
}

export function saveTableRules(rules: TableRules): void {
  saveRobustRules(rules);
}

export function loadAppSettings(): AppSettings {
  return loadRobustSettings();
}

export function saveAppSettings(settings: AppSettings): void {
  saveRobustSettings(settings);
}

export function resetAllStats(): UserStats {
  const resetStats: UserStats = {
    ...DEFAULT_STATS,
    mistakeHistory: [],
    recentHistory: [],
    reviewQueue: [],
  };
  saveUserStats(resetStats);
  return resetStats;
}
