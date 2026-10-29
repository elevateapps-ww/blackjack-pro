import { UserStats, TableRules } from './blackjack/types';
import { AppSettings, DEFAULT_STATS, DEFAULT_RULES, DEFAULT_SETTINGS } from './storage';

const PRIMARY_STATS_KEY = 'blackjack_mastery_persistent_db_v1';
const LEGACY_STATS_KEYS = [
  'bj_apex_pro_stats_clean_v1',
  'bj_apex_pro_stats_v1',
  'bj_pro_stats',
  'blackjack_pro_stats',
];

const PRIMARY_RULES_KEY = 'blackjack_mastery_rules_v1';
const LEGACY_RULES_KEYS = ['bj_apex_pro_rules_clean_v1', 'bj_apex_pro_rules_v1'];

const PRIMARY_SETTINGS_KEY = 'blackjack_mastery_settings_v1';
const LEGACY_SETTINGS_KEYS = ['bj_apex_pro_settings_clean_v1', 'bj_apex_pro_settings_v1'];

const DB_NAME = 'BlackjackProMasteryDB';
const DB_VERSION = 1;
const STORE_NAME = 'mastery_data';

/**
 * Solicita ao navegador permissão de Armazenamento Persistente (Evita que Safari/Chrome limpem o cache)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    }
  } catch {
    // Ignore
  }
  return false;
}

/**
 * Inicializa ou abre o IndexedDB nativo
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Salva um valor no IndexedDB de forma assíncrona e segura
 */
export async function saveToIndexedDB(key: string, value: any): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    // Fallback silencioso
  }
}

/**
 * Recupera um valor do IndexedDB
 */
export async function getFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Recupera o progresso do usuário com verificação cruzada de chaves legadas para NUNCA perder progresso!
 */
export function loadRobustStats(): UserStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;

  let bestStats: UserStats = { ...DEFAULT_STATS };

  // 1. Tenta carregar da chave primária
  try {
    const primaryRaw = localStorage.getItem(PRIMARY_STATS_KEY);
    if (primaryRaw) {
      const parsed = JSON.parse(primaryRaw);
      if (parsed && typeof parsed.totalDecisions === 'number') {
        bestStats = { ...DEFAULT_STATS, ...parsed };
      }
    }
  } catch {
    // Fallback para legadas
  }

  // 2. Vasculha chaves anteriores e preserva se tiver mais mãos jogadas!
  for (const legKey of LEGACY_STATS_KEYS) {
    try {
      const legacyRaw = localStorage.getItem(legKey);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (legacyParsed && typeof legacyParsed.totalDecisions === 'number') {
          if (legacyParsed.totalDecisions > bestStats.totalDecisions) {
            bestStats = {
              ...DEFAULT_STATS,
              ...legacyParsed,
              // Preserva maior número de acertos e streak
              totalDecisions: Math.max(bestStats.totalDecisions, legacyParsed.totalDecisions),
              correctDecisions: Math.max(bestStats.correctDecisions, legacyParsed.correctDecisions || 0),
              bestStreak: Math.max(bestStats.bestStreak, legacyParsed.bestStreak || 0),
              currentStreak: legacyParsed.currentStreak || bestStats.currentStreak,
              reviewQueue: Array.from(new Set([...(bestStats.reviewQueue || []), ...(legacyParsed.reviewQueue || [])])),
            };
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // 3. Salva de volta na chave primária unificada
  saveRobustStats(bestStats);

  return bestStats;
}

/**
 * Salva no LocalStorage E no IndexedDB simultaneamente (Dupla Redundância)
 */
export function saveRobustStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(stats);
    // Salva na chave primária
    localStorage.setItem(PRIMARY_STATS_KEY, serialized);
    // Também salva na chave de backup
    localStorage.setItem('bj_apex_pro_stats_clean_v1', serialized);
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }

  // Salva no IndexedDB em paralelo (não-bloqueante)
  saveToIndexedDB('stats', stats);
}

/**
 * Carrega regras com migração
 */
export function loadRobustRules(): TableRules {
  if (typeof window === 'undefined') return DEFAULT_RULES;
  try {
    const raw = localStorage.getItem(PRIMARY_RULES_KEY) || localStorage.getItem(LEGACY_RULES_KEYS[0]);
    if (raw) return { ...DEFAULT_RULES, ...JSON.parse(raw) };
  } catch {
    // Ignore
  }
  return DEFAULT_RULES;
}

export function saveRobustRules(rules: TableRules): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(rules);
    localStorage.setItem(PRIMARY_RULES_KEY, raw);
    localStorage.setItem(LEGACY_RULES_KEYS[0], raw);
  } catch {
    // Ignore
  }
  saveToIndexedDB('rules', rules);
}

/**
 * Carrega configurações de app
 */
export function loadRobustSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(PRIMARY_SETTINGS_KEY) || localStorage.getItem(LEGACY_SETTINGS_KEYS[0]);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // Ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveRobustSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(settings);
    localStorage.setItem(PRIMARY_SETTINGS_KEY, raw);
    localStorage.setItem(LEGACY_SETTINGS_KEYS[0], raw);
  } catch {
    // Ignore
  }
  saveToIndexedDB('settings', settings);
}

/**
 * Exporta todo o histórico e progresso em arquivo JSON para backup pessoal
 */
export function exportProgressBackup(stats: UserStats, rules: TableRules, settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const backupData = {
      app: 'BlackjackPro',
      exportedAt: new Date().toISOString(),
      stats,
      rules,
      settings,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackjack-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Falha ao exportar backup:', e);
  }
}

/**
 * Importa um arquivo de backup JSON
 */
export function importProgressBackup(jsonString: string): { stats?: UserStats; rules?: TableRules; settings?: AppSettings } | null {
  try {
    const data = JSON.parse(jsonString);
    if (data && data.stats && typeof data.stats.totalDecisions === 'number') {
      const validatedStats: UserStats = { ...DEFAULT_STATS, ...data.stats };
      saveRobustStats(validatedStats);
      if (data.rules) saveRobustRules(data.rules);
      if (data.settings) saveRobustSettings(data.settings);
      return {
        stats: validatedStats,
        rules: data.rules,
        settings: data.settings,
      };
    }
  } catch (e) {
    console.error('Falha ao importar backup:', e);
  }
  return null;
}
