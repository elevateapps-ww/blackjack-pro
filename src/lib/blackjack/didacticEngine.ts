import { CardRank, TableRules, Action, HandSituation } from './types';
import { getBasicStrategyAction, rankToValue, DEALER_BUST_ODDS } from './strategyMatrix';
import { createCard } from './handGenerator';

export const ALL_DEALER_RANKS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

// Todas as mãos rígidas relevantes (5 a 20)
export const ALL_HARD_TOTALS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

// Todas as mãos suaves (A,2 até A,9)
export const ALL_SOFT_TOTALS = [13, 14, 15, 16, 17, 18, 19, 20];

export interface ScenarioBlueprint {
  id: string;
  isSoft: boolean;
  playerTotal: number;
  dealerRank: CardRank;
  archetype: 'boundary_trap' | 'soft_double' | 'hard_double' | 'stiff_stand' | 'pure_hit' | 'pure_stand';
  mnemonic: string;
  difficultyWeight: number; // 1 (fácil), 2 (médio), 3 (crítico - onde os amadores erram)
}

/**
 * Retorna o mnemônico / gatilho mental perfeito para cada situação
 */
export function getDidacticMnemonic(total: number, isSoft: boolean, dealerRank: CardRank, optimalAction: Action): string {
  const dVal = rankToValue(dealerRank);

  if (isSoft) {
    if (total === 18) {
      if (optimalAction === 'D') {
        return 'Gatilho do 18 Suave: Dobra contra dealer fraco (3 a 6) para extrair o dobro do valor enquanto você não pode estourar.';
      }
      if (optimalAction === 'S') {
        return 'Gatilho do 18 Suave: Para contra 2, 7 e 8. O 18 já é forte e tem vantagem sólida.';
      }
      return 'Armadilha Universal do 18: NUNCA pare no 18 contra 9, 10 ou Ás! O dealer fará 19-21. Você tem carta grátis sem risco de quebrar: BATA!';
    }
    if (total === 17) {
      if (optimalAction === 'D') {
        return '17 Suave Dobra: O 17 é uma mão fraca que nunca vence se você parar. Dobre na fraqueza do dealer (3 a 6).';
      }
      return '17 Suave NUNCA Para: O dealer nunca para abaixo de 17. Como tem Ás, você não estoura. BATA sem hesitar!';
    }
    if (total === 15 || total === 16) {
      if (optimalAction === 'D') {
        return `Soft ${total} dobra exclusivamente contra a zona vermelha do dealer (4, 5 e 6).`;
      }
      return `Soft ${total} pede carta contra qualquer outra situação para tentar formar um jogo competitivo.`;
    }
    if (total === 13 || total === 14) {
      if (optimalAction === 'D') {
        return 'Soft 13 e 14 dobram APENAS contra 5 e 6 (as cartas com pior taxa de sobrevivência do dealer).';
      }
      return 'Soft 13 e 14 pedem carta em todo o restante.';
    }
    if (total >= 19) {
      return `${total} Suave já é uma mão quase imbatível. Pare sempre.`;
    }
  }

  // Hard Hands
  if (total === 12) {
    if (optimalAction === 'S') {
      return 'A Regra do 12: Contra 4, 5 e 6 o dealer quebra em mais de 40% das vezes. Fique quieto e deixe ele quebrar!';
    }
    return 'A Navalha do 12: Contra 2 e 3 o dealer estoura pouco (apenas 35-37%). Como você só estoura com carta 10, a matemática manda BATER!';
  }

  if (total >= 13 && total <= 16) {
    if (optimalAction === 'S') {
      return `Mão Quebrada (${total}): O dealer mostra ${dealerRank} (zona de estouro). Não arrisque estourar quando a casa está condenada! Pare.`;
    }
    return `Mão Quebrada (${total}): Contra cartas altas (${dealerRank}), o dealer não estoura. Ficar parado perde 75%+ das vezes. Peça carta!`;
  }

  if (total === 11) {
    if (optimalAction === 'D') {
      return 'O Rei do Blackjack: 11 dobra em praticamente tudo! Quase 31% de chance de 21 imediato. Dobre a aposta!';
    }
    return '11 contra Ás (Mesa S17): O Ás do dealer é tão dominante que a estratégia básica manda pedir sem dobrar.';
  }

  if (total === 10) {
    if (optimalAction === 'D') {
      return '10 Rígido Dobra: Dobre contra qualquer carta de 2 a 9 com alta probabilidade de fechar 20.';
    }
    return '10 vs 10 ou Ás: Contra cartas máximas do dealer, dobrar aumenta o risco sem vantagem matemática. Peça carta!';
  }

  if (total === 9) {
    if (optimalAction === 'D') {
      return '9 Rígido Dobra: Dobra APENAS no 3, 4, 5 e 6. Você puxa um 10 e fecha 19 contra um dealer fraco!';
    }
    return '9 vs 2 ou 7+: O dealer 2 não é fraco o bastante e 7+ é forte demais. Apenas peça carta.';
  }

  if (total >= 17) {
    return `${total} duro: Você estoura em mais de 70% das compras. Parar é a única jogada viável.`;
  }

  return `Total ${total} rígido: Você é imune a estourar. Peça carta sem medo.`;
}

/**
 * Cria o Universo Completo de todas as 240 situações de jogo
 */
export function buildExhaustiveUniverse(rules: TableRules): ScenarioBlueprint[] {
  const list: ScenarioBlueprint[] = [];

  // 1. Mãos Rígidas (Hard Totals: 5 a 20 vs 10 cartas do dealer = 160 situações)
  for (const tot of ALL_HARD_TOTALS) {
    for (const dRank of ALL_DEALER_RANKS) {
      const id = `H_${tot}_vs_${dRank}`;
      let archetype: ScenarioBlueprint['archetype'] = 'pure_hit';
      let difficultyWeight = 1;

      if (tot === 12 && ['2', '3', '4', '5', '6'].includes(dRank)) {
        archetype = 'boundary_trap';
        difficultyWeight = 3;
      } else if (tot >= 13 && tot <= 16) {
        archetype = 'stiff_stand';
        difficultyWeight = ['2', '3', '7'].includes(dRank) ? 3 : 2;
      } else if (tot === 11 || tot === 10 || tot === 9) {
        archetype = 'hard_double';
        difficultyWeight = (tot === 9 && (dRank === '2' || dRank === '3')) || (tot === 11 && dRank === 'A') ? 3 : 2;
      } else if (tot >= 17) {
        archetype = 'pure_stand';
        difficultyWeight = 1;
      }

      const strat = getBasicStrategyAction(tot, dRank, false, rules);
      const mnemonic = getDidacticMnemonic(tot, false, dRank, strat.action);

      list.push({
        id,
        isSoft: false,
        playerTotal: tot,
        dealerRank: dRank,
        archetype,
        mnemonic,
        difficultyWeight,
      });
    }
  }

  // 2. Mãos Suaves (Soft Totals: A,2 a A,9 vs 10 cartas do dealer = 80 situações)
  for (const tot of ALL_SOFT_TOTALS) {
    for (const dRank of ALL_DEALER_RANKS) {
      const id = `S_${tot}_vs_${dRank}`;
      let archetype: ScenarioBlueprint['archetype'] = 'soft_double';
      let difficultyWeight = 2;

      if (tot === 18) {
        archetype = 'boundary_trap';
        difficultyWeight = 3; // O erro mais comum do mundo
      } else if (tot === 17) {
        archetype = 'boundary_trap';
        difficultyWeight = 3;
      } else if (tot >= 19) {
        archetype = 'pure_stand';
        difficultyWeight = 1;
      }

      const strat = getBasicStrategyAction(tot, dRank, true, rules);
      const mnemonic = getDidacticMnemonic(tot, true, dRank, strat.action);

      list.push({
        id,
        isSoft: true,
        playerTotal: tot,
        dealerRank: dRank,
        archetype,
        mnemonic,
        difficultyWeight,
      });
    }
  }

  return list;
}

/**
 * Algoritmo Fisher-Yates de Embaralhamento Perfeito
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Interleaving Pedagógico: evita repetições idênticas seguidas para forçar alternância contextual
 */
export function interleavePedagogically(deck: ScenarioBlueprint[]): ScenarioBlueprint[] {
  const result: ScenarioBlueprint[] = [];
  const hardPool = deck.filter((s) => !s.isSoft);
  const softPool = deck.filter((s) => s.isSoft);

  let hardIdx = 0;
  let softIdx = 0;

  while (hardIdx < hardPool.length || softIdx < softPool.length) {
    // 2 hard para 1 soft
    if (hardIdx < hardPool.length) {
      result.push(hardPool[hardIdx++]);
    }
    if (hardIdx < hardPool.length && Math.random() < 0.6) {
      result.push(hardPool[hardIdx++]);
    }
    if (softIdx < softPool.length) {
      result.push(softPool[softIdx++]);
    }
  }

  return result;
}
