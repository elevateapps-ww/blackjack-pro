import { Card, CardRank, CardSuit, HandCategory, HandSituation, TableRules, TrainingMode, Action } from './types';
import { getBasicStrategyAction, rankToValue, DEALER_BUST_ODDS } from './strategyMatrix';
import { buildExhaustiveUniverse, fisherYatesShuffle, ScenarioBlueprint, getDidacticMnemonic } from './didacticEngine';

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
 * Cria 2 cartas visualmente autênticas para atingir o total desejado
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

  // Hard Hand: escolhe duas cartas que somem o total
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

// Fila em memória para o ciclo de embaralhamento didático
let activeDidacticDeck: ScenarioBlueprint[] = [];
let deckIndex = 0;

function ensureDidacticDeck(rules: TableRules, mode: TrainingMode) {
  if (activeDidacticDeck.length === 0 || deckIndex >= activeDidacticDeck.length) {
    let full = buildExhaustiveUniverse(rules);

    if (mode === 'hard') {
      full = full.filter((s) => !s.isSoft);
    } else if (mode === 'soft') {
      full = full.filter((s) => s.isSoft);
    }

    // Embaralhamento Fisher-Yates completo
    activeDidacticDeck = fisherYatesShuffle(full);
    deckIndex = 0;
  }
}

/**
 * Gera a próxima situação com embaralhamento didático profissional e fixação de erros
 */
export function generateHandSituation(
  mode: TrainingMode,
  rules: TableRules,
  reviewQueue: string[] = []
): HandSituation {
  // 1. REPETIÇÃO ESPAÇADA PRIORITÁRIA (40% de chance de reforço se houver erros na fila)
  const shouldPullFromReview = (mode === 'review' && reviewQueue.length > 0) ||
    (reviewQueue.length > 0 && Math.random() < 0.45);

  if (shouldPullFromReview) {
    const targetId = randomElement(reviewQueue);
    const parsed = parseSituationId(targetId, rules);
    if (parsed) return parsed;
  }

  // 2. EMBARALHAMENTO DO UNIVERSO DIDÁTICO EXAUSTIVO
  ensureDidacticDeck(rules, mode);

  // Sorteio ponderado por dificuldade (as situações mais difíceis aparecem com frequência pedagógica reforçada)
  let blueprint = activeDidacticDeck[deckIndex++];
  if (!blueprint) {
    ensureDidacticDeck(rules, mode);
    blueprint = activeDidacticDeck[deckIndex++];
  }

  // 35% de chance de re-focar numa situação com peso de dificuldade 3 (boundary traps)
  if (Math.random() < 0.35 && blueprint.difficultyWeight < 3) {
    const criticalCandidates = activeDidacticDeck.filter((s) => s.difficultyWeight === 3);
    if (criticalCandidates.length > 0) {
      blueprint = randomElement(criticalCandidates);
    }
  }

  const playerCards = createCardsForTotal(blueprint.playerTotal, blueprint.isSoft);
  const dealerCard = createCard(blueprint.dealerRank);
  const strat = getBasicStrategyAction(blueprint.playerTotal, blueprint.dealerRank, blueprint.isSoft, rules);
  const mnemonic = getDidacticMnemonic(blueprint.playerTotal, blueprint.isSoft, blueprint.dealerRank, strat.action);

  return {
    id: blueprint.id,
    playerCards,
    dealerCard,
    playerTotal: blueprint.playerTotal,
    isSoft: blueprint.isSoft,
    category: blueprint.isSoft ? 'soft' : 'hard',
    optimalAction: strat.action,
    allowedActions: ['H', 'S', 'D'],
    explanation: {
      ...strat.explanation,
      ruleExplanation: `${mnemonic} • ${strat.explanation.ruleExplanation}`,
    },
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
    const mnemonic = getDidacticMnemonic(playerTotal, isSoft, dealerRank, strat.action);

    return {
      id,
      playerCards,
      dealerCard,
      playerTotal,
      isSoft,
      category: isSoft ? 'soft' : 'hard',
      optimalAction: strat.action,
      allowedActions: ['H', 'S', 'D'],
      explanation: {
        ...strat.explanation,
        ruleExplanation: `${mnemonic} • ${strat.explanation.ruleExplanation}`,
      },
    };
  } catch {
    return null;
  }
}
