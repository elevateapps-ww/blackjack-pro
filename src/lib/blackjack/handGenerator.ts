import { Card, CardRank, CardSuit, HandCategory, HandSituation, TableRules, TrainingMode, Action } from './types';
import { getBasicStrategyAction, rankToValue, DEALER_BUST_ODDS, ACTION_NAMES } from './strategyMatrix';
import { ILLUSTRIOUS_18_AND_FAB_4, DeviationDefinition } from './illustrious18';

const SUITS: CardSuit[] = ['♠', '♥', '♦', '♣'];
const RANKS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createCard(rank: CardRank, preferredSuit?: CardSuit): Card {
  return {
    rank,
    suit: preferredSuit || randomElement(SUITS),
    value: rankToValue(rank),
  };
}

/**
 * Gera uma mão específica para simular o valor desejado
 */
function createCardsForTotal(total: number, isSoft: boolean, isPair: boolean, pairRank?: CardRank): [Card, Card] {
  if (isPair && pairRank) {
    const s1 = randomElement(SUITS);
    let s2 = randomElement(SUITS);
    while (s2 === s1 && SUITS.length > 1) {
      s2 = randomElement(SUITS);
    }
    return [createCard(pairRank, s1), createCard(pairRank, s2)];
  }

  if (isSoft) {
    // Soft hand: one Ace + other card
    const otherRankVal = total - 11;
    const rankMap: Record<number, CardRank> = {
      2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9'
    };
    const otherRank = rankMap[otherRankVal] || '7';
    return [createCard('A'), createCard(otherRank)];
  }

  // Hard Hand: pick two cards that sum to total
  // Ensure not a pair and no Ace (unless Ace counts as 1 in hard total)
  const possibleCombos: Array<[CardRank, CardRank]> = [];
  
  for (const r1 of RANKS) {
    for (const r2 of RANKS) {
      if (r1 === 'A' || r2 === 'A') continue;
      if (r1 === r2) continue; // avoid pairs
      const val1 = rankToValue(r1);
      const val2 = rankToValue(r2);
      if (val1 + val2 === total) {
        possibleCombos.push([r1, r2]);
      }
    }
  }

  if (possibleCombos.length > 0) {
    const [c1, c2] = randomElement(possibleCombos);
    return [createCard(c1), createCard(c2)];
  }

  // Fallback
  return [createCard('10'), createCard('6')];
}

/**
 * Gera a próxima situação de treino com base nas regras e modo selecionado
 */
export function generateHandSituation(
  mode: TrainingMode,
  rules: TableRules,
  reviewQueue: string[] = []
): HandSituation {
  // Se estiver no modo 'review' ou se houver fila de erros e sorteio favorável (35% chance de reforço)
  const shouldPullFromReview = (mode === 'review' && reviewQueue.length > 0) ||
    (mode !== 'deviations' && reviewQueue.length > 0 && Math.random() < 0.35);

  if (shouldPullFromReview) {
    const targetId = randomElement(reviewQueue);
    const parsedSituation = parseSituationId(targetId, rules);
    if (parsedSituation) {
      return parsedSituation;
    }
  }

  // Se modo for desvios de contagem (Illustrious 18)
  if (mode === 'deviations') {
    return generateDeviationSituation(rules);
  }

  // Seleção de categoria conforme o modo
  let category: HandCategory;
  if (mode === 'all') {
    const weights: Array<{ cat: HandCategory; weight: number }> = [
      { cat: 'hard', weight: 45 },
      { cat: 'soft', weight: 25 },
      { cat: 'pair', weight: 20 },
      { cat: 'surrender', weight: 10 },
    ];
    const rnd = Math.random() * 100;
    let accumulated = 0;
    category = 'hard';
    for (const w of weights) {
      accumulated += w.weight;
      if (rnd <= accumulated) {
        category = w.cat;
        break;
      }
    }
  } else if (mode === 'hard') {
    category = 'hard';
  } else if (mode === 'soft') {
    category = 'soft';
  } else if (mode === 'pairs') {
    category = 'pair';
  } else if (mode === 'surrender') {
    category = 'surrender';
  } else {
    category = 'hard';
  }

  return generateStandardSituation(category, rules);
}

function generateStandardSituation(category: HandCategory, rules: TableRules): HandSituation {
  const dealerRank: CardRank = randomElement(RANKS);
  let playerCards: [Card, Card];
  let playerTotal = 0;
  let isSoft = false;
  let isPair = false;
  let pairRank: CardRank | null = null;

  if (category === 'pair') {
    // Pares de 2,2 até A,A
    const pairRanks: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
    pairRank = randomElement(pairRanks);
    isPair = true;
    isSoft = pairRank === 'A';
    playerCards = createCardsForTotal(pairRank === 'A' ? 12 : rankToValue(pairRank) * 2, isSoft, true, pairRank);
    playerTotal = pairRank === 'A' ? 12 : rankToValue(pairRank) * 2;
  } else if (category === 'soft') {
    // Soft hands de A,2 (13) a A,9 (20)
    const softTotals = [13, 14, 15, 16, 17, 18, 19, 20];
    playerTotal = randomElement(softTotals);
    isSoft = true;
    isPair = false;
    playerCards = createCardsForTotal(playerTotal, true, false);
  } else if (category === 'surrender') {
    // Mãos típicas de surrender: 16 duro vs 9,10,A ou 15 duro vs 10,A
    const surrenderOptions: Array<{ total: number; dealer: CardRank }> = [
      { total: 16, dealer: '10' },
      { total: 16, dealer: '9' },
      { total: 16, dealer: 'A' },
      { total: 15, dealer: '10' },
      { total: 15, dealer: 'A' },
    ];
    const pick = randomElement(surrenderOptions);
    playerTotal = pick.total;
    const finalDealerRank = pick.dealer;
    isSoft = false;
    isPair = false;
    playerCards = createCardsForTotal(playerTotal, false, false);
    const dealerCard = createCard(finalDealerRank);
    const strat = getBasicStrategyAction(playerTotal, finalDealerRank, false, false, null, rules);
    
    return buildSituationObject(playerCards, dealerCard, playerTotal, false, false, 'surrender', strat.action, strat.explanation, rules);
  } else {
    // Hard Totals: 8 a 17 (com foco nas decisões críticas 12-16 e 9-11)
    const criticalHardTotals = [9, 10, 11, 12, 13, 14, 15, 16, 17, 8, 7];
    playerTotal = randomElement(criticalHardTotals);
    isSoft = false;
    isPair = false;
    playerCards = createCardsForTotal(playerTotal, false, false);
  }

  const dealerCard = createCard(dealerRank);
  const strat = getBasicStrategyAction(playerTotal, dealerRank, isSoft, isPair, pairRank, rules);

  return buildSituationObject(
    playerCards,
    dealerCard,
    playerTotal,
    isSoft,
    isPair,
    category,
    strat.action,
    strat.explanation,
    rules
  );
}

/**
 * Gera uma situação com contagem e desvio do Illustrious 18
 */
function generateDeviationSituation(rules: TableRules): HandSituation {
  const deviation = randomElement(ILLUSTRIOUS_18_AND_FAB_4);
  const dealerCard = createCard(deviation.dealerCard);

  // Vamos gerar um True Count que ou dispara o desvio ou testa se o usuário sabe NÃO desviar!
  // 60% das vezes testamos exatamente a condição de desvio, 40% das vezes testamos um count logo abaixo/acima
  const shouldTriggerDeviation = Math.random() < 0.60;
  let testTrueCount: number;

  if (deviation.condition === '>=') {
    if (shouldTriggerDeviation) {
      testTrueCount = deviation.index + randomInt(0, 3);
    } else {
      testTrueCount = deviation.index - randomInt(1, 3);
    }
  } else { // '<='
    if (shouldTriggerDeviation) {
      testTrueCount = deviation.index - randomInt(0, 2);
    } else {
      testTrueCount = deviation.index + randomInt(1, 3);
    }
  }

  const runningCount = testTrueCount * 3; // Supondo 3 baralhos restantes

  const playerCards = createCardsForTotal(
    deviation.playerTotal,
    deviation.isSoft,
    deviation.isPair,
    deviation.pairRank
  );

  const isConditionMet = deviation.condition === '>=' 
    ? testTrueCount >= deviation.index 
    : testTrueCount <= deviation.index;

  const optimalAction = isConditionMet ? deviation.deviationAction : deviation.basicAction;

  const explanationTitle = isConditionMet
    ? `DESVIO APLICADO: ${deviation.name}`
    : `MANTENHA A ESTRATÉGIA BÁSICA (${deviation.name})`;

  const explanationRule = isConditionMet
    ? `Com True Count = ${testTrueCount >= 0 ? '+' : ''}${testTrueCount} (${deviation.condition} ${deviation.index}), o índice de Schlesinger foi atingido! Você deve mudar de ${ACTION_NAMES[deviation.basicAction]} para ${ACTION_NAMES[deviation.deviationAction]}.`
    : `O True Count é ${testTrueCount >= 0 ? '+' : ''}${testTrueCount}, que AINDA NÃO atingiu o índice ${deviation.condition} ${deviation.index}. Portanto, continue jogando a Estratégia Básica pura (${ACTION_NAMES[deviation.basicAction]})!`;

  return {
    id: `dev_${deviation.id}_tc${testTrueCount}`,
    playerCards,
    dealerCard,
    playerTotal: deviation.playerTotal,
    isSoft: deviation.isSoft,
    isPair: deviation.isPair,
    category: 'deviation',
    optimalAction,
    allowedActions: getAllowedActions(playerCards, rules),
    explanation: {
      title: explanationTitle,
      optimalActionName: ACTION_NAMES[optimalAction],
      ruleExplanation: explanationRule,
      mathematicalReason: deviation.explanation,
      dealerBustProbability: DEALER_BUST_ODDS[deviation.dealerCard],
      cardCountingContext: `True Count Atual: ${testTrueCount >= 0 ? '+' : ''}${testTrueCount} | Índice Don Schlesinger: ${deviation.condition} ${deviation.index}`,
    },
    isDeviation: true,
    trueCount: testTrueCount,
    runningCount,
    deviationIndex: deviation.index,
    basicStrategyAction: deviation.basicAction,
    deviationName: deviation.name,
  };
}

function getAllowedActions(playerCards: [Card, Card], rules: TableRules): Action[] {
  const allowed: Action[] = ['H', 'S', 'D'];
  const isPair = playerCards[0].rank === playerCards[1].rank ||
    (playerCards[0].value === 10 && playerCards[1].value === 10);
  
  if (isPair) {
    allowed.push('P');
  }
  if (rules.surrender === 'late') {
    allowed.push('R');
  }
  return allowed;
}

function buildSituationObject(
  playerCards: [Card, Card],
  dealerCard: Card,
  playerTotal: number,
  isSoft: boolean,
  isPair: boolean,
  category: HandCategory,
  optimalAction: Action,
  explanation: any,
  rules: TableRules
): HandSituation {
  const pairRank = isPair ? playerCards[0].rank : null;
  const sitId = `${isPair ? 'P_' + pairRank : isSoft ? 'S_' + playerTotal : 'H_' + playerTotal}_vs_${dealerCard.rank}`;

  return {
    id: sitId,
    playerCards,
    dealerCard,
    playerTotal,
    isSoft,
    isPair,
    category,
    optimalAction,
    allowedActions: getAllowedActions(playerCards, rules),
    explanation,
  };
}

function parseSituationId(id: string, rules: TableRules): HandSituation | null {
  try {
    const parts = id.split('_vs_');
    if (parts.length !== 2) return null;
    const playerPart = parts[0];
    const dealerRank = parts[1] as CardRank;

    let isPair = false;
    let isSoft = false;
    let playerTotal = 16;
    let pairRank: CardRank | null = null;

    if (playerPart.startsWith('P_')) {
      isPair = true;
      pairRank = playerPart.replace('P_', '') as CardRank;
      playerTotal = pairRank === 'A' ? 12 : rankToValue(pairRank) * 2;
    } else if (playerPart.startsWith('S_')) {
      isSoft = true;
      playerTotal = parseInt(playerPart.replace('S_', ''), 10);
    } else {
      playerTotal = parseInt(playerPart.replace('H_', ''), 10);
    }

    const playerCards = createCardsForTotal(playerTotal, isSoft, isPair, pairRank || undefined);
    const dealerCard = createCard(dealerRank);
    const strat = getBasicStrategyAction(playerTotal, dealerRank, isSoft, isPair, pairRank, rules);

    return buildSituationObject(
      playerCards,
      dealerCard,
      playerTotal,
      isSoft,
      isPair,
      isPair ? 'pair' : isSoft ? 'soft' : 'hard',
      strat.action,
      strat.explanation,
      rules
    );
  } catch {
    return null;
  }
}
