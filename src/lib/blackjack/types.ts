export type CardSuit = '♠' | '♥' | '♦' | '♣';
export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: CardSuit;
  rank: CardRank;
  value: number; // 2..10, A is 11
}

export type Action = 'H' | 'S' | 'D' | 'P' | 'R';
// H: Hit, S: Stand, D: Double, P: Split, R: Surrender

export type HandCategory = 'hard' | 'soft' | 'pair' | 'surrender' | 'deviation';

export interface TableRules {
  decks: 1 | 2 | 4 | 6 | 8;
  dealerRule: 'S17' | 'H17'; // S17: Dealer stands on soft 17, H17: Dealer hits soft 17
  das: boolean; // Double After Split allowed
  surrender: 'late' | 'none';
  doubleRestrictions: 'any' | '9-11' | '10-11';
  enhc: boolean; // European No Hole Card (default false = American peek)
}

export interface ExplanationDetails {
  title: string;
  optimalActionName: string;
  ruleExplanation: string;
  mathematicalReason: string;
  dealerBustProbability: string;
  alternativeMoveTip?: string;
  cardCountingContext?: string;
}

export interface HandSituation {
  id: string;
  playerCards: [Card, Card];
  dealerCard: Card;
  playerTotal: number;
  isSoft: boolean;
  isPair: boolean;
  category: HandCategory;
  optimalAction: Action;
  allowedActions: Action[];
  explanation: ExplanationDetails;
  
  // Deviation specific
  isDeviation?: boolean;
  trueCount?: number;
  runningCount?: number;
  deviationIndex?: number;
  basicStrategyAction?: Action;
  deviationName?: string;
}

export type TrainingMode = 
  | 'all'
  | 'hard'
  | 'soft'
  | 'pairs'
  | 'surrender'
  | 'deviations'
  | 'review';

export interface UserStats {
  totalDecisions: number;
  correctDecisions: number;
  currentStreak: number;
  bestStreak: number;
  targetGoal: number; // e.g. 5000
  categoryStats: {
    hard: { total: number; correct: number };
    soft: { total: number; correct: number };
    pair: { total: number; correct: number };
    surrender: { total: number; correct: number };
    deviation: { total: number; correct: number };
  };
  mistakeHistory: Array<{
    situationId: string;
    playerDisplay: string;
    dealerDisplay: string;
    userAction: Action;
    correctAction: Action;
    timestamp: number;
  }>;
  reviewQueue: string[]; // Situation IDs that need repeating
}
