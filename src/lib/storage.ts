import { TableRules, TrainingMode, UserStats } from './blackjack/types';

const STATS_KEY = 'bj_apex_pro_stats_clean_v1';
const RULES_KEY = 'bj_apex_pro_rules_clean_v1';
const SETTINGS_KEY = 'bj_apex_pro_settings_clean_v1';

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
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATS, ...parsed };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats to localStorage', e);
  }
}

export function loadTableRules(): TableRules {
  if (typeof window === 'undefined') return DEFAULT_RULES;
  try {
    const raw = localStorage.getItem(RULES_KEY);
    if (!raw) return DEFAULT_RULES;
    return { ...DEFAULT_RULES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_RULES;
  }
}

export function saveTableRules(rules: TableRules): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save rules to localStorage', e);
  }
}

export function loadAppSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
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
