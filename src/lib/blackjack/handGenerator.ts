import { Card, CardRank, CardSuit, HandCategory, HandSituation, TableRules, TrainingMode, Action } from './types';
import { getBasicStrategyAction, rankToValue } from './strategyMatrix';

const SUITS: CardSuit[] = ['♠', '♥', '♦', '♣'];
const RANKS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function createCard(rank: CardRank, preferredSuit?: CardSuit): Card {
  return {
    rank,
    suit: preferredSuit || randomElement(SUITS),
    value: rankToValue(rank),
  };
}

/**
 * Cria 2 cartas para atingir o total desejado
 */
function createCardsForTotal(total: number, isSoft: boolean): [Card, Card] {
  if (isSoft) {
    const otherRankVal = total - 11;
    const rankMap: Record<number, CardRank> = {
      2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9'
    };
    const otherRank = rankMap[otherRankVal] || '7';
    return [createCard('A'), createCard(otherRank)];
  }

  // Hard Hand
  const possibleCombos: Array<[CardRank, CardRank]> = [];
  for (const r1 of RANKS) {
    for (const r2 of RANKS) {
      if (r1 === 'A' || r2 === 'A') continue;
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

  return [createCard('10'), createCard('6')];
}

/**
 * Gera a próxima situação com as 3 decisões: Pedir, Parar, Dobrar
 */
export function generateHandSituation(
  mode: TrainingMode,
  rules: TableRules,
  reviewQueue: string[] = []
): HandSituation {
  // Se houver fila de revisão de erros, puxa dela para fixação mental
  const shouldPullFromReview = (mode === 'review' && reviewQueue.length > 0) ||
    (reviewQueue.length > 0 && Math.random() < 0.40);

  if (shouldPullFromReview) {
    const targetId = randomElement(reviewQueue);
    const parsed = parseSituationId(targetId, rules);
    if (parsed) return parsed;
  }

  let isSoft = false;
  if (mode === 'soft') {
    isSoft = true;
  } else if (mode === 'hard') {
    isSoft = false;
  } else {
    // Modo All: 65% mãos rígidas, 35% mãos suaves
    isSoft = Math.random() < 0.35;
  }

  let playerTotal: number;
  if (isSoft) {
    const softTotals = [13, 14, 15, 16, 17, 18, 19, 20];
    playerTotal = randomElement(softTotals);
  } else {
    // Hard totals críticos para Pedir, Parar, Dobrar: 8 a 17
    const hardTotals = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
    playerTotal = randomElement(hardTotals);
  }

  const dealerRank: CardRank = randomElement(RANKS);
  const playerCards = createCardsForTotal(playerTotal, isSoft);
  const dealerCard = createCard(dealerRank);

  const strat = getBasicStrategyAction(playerTotal, dealerRank, isSoft, rules);

  return buildSituationObject(
    playerCards,
    dealerCard,
    playerTotal,
    isSoft,
    isSoft ? 'soft' : 'hard',
    strat.action,
    strat.explanation
  );
}

function buildSituationObject(
  playerCards: [Card, Card],
  dealerCard: Card,
  playerTotal: number,
  isSoft: boolean,
  category: HandCategory,
  optimalAction: Action,
  explanation: any
): HandSituation {
  const sitId = `${isSoft ? 'S_' : 'H_'}${playerTotal}_vs_${dealerCard.rank}`;

  return {
    id: sitId,
    playerCards,
    dealerCard,
    playerTotal,
    isSoft,
    category,
    optimalAction,
    allowedActions: ['H', 'S', 'D'],
    explanation,
  };
}

function parseSituationId(id: string, rules: TableRules): HandSituation | null {
  try {
    const parts = id.split('_vs_');
    if (parts.length !== 2) return null;
    const playerPart = parts[0];
    const dealerRank = parts[1] as CardRank;

    const isSoft = playerPart.startsWith('S_');
    const playerTotal = parseInt(playerPart.replace('S_', '').replace('H_', ''), 10);

    const playerCards = createCardsForTotal(playerTotal, isSoft);
    const dealerCard = createCard(dealerRank);
    const strat = getBasicStrategyAction(playerTotal, dealerRank, isSoft, rules);

    return buildSituationObject(
      playerCards,
      dealerCard,
      playerTotal,
      isSoft,
      isSoft ? 'soft' : 'hard',
      strat.action,
      strat.explanation
    );
  } catch {
    return null;
  }
}
