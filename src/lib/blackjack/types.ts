export type CardSuit = '♠' | '♥' | '♦' | '♣';
export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: CardSuit;
  rank: CardRank;
  value: number; // 2..10, A is 11
}

// Apenas Pedir, Parar, Dobrar (conforme solicitado pelo usuário)
export type Action = 'H' | 'S' | 'D';
// H: Pedir (Hit), S: Parar (Stand), D: Dobrar (Double)

export type HandCategory = 'hard' | 'soft';

export interface TableRules {
  decks: 1 | 2 | 4 | 6 | 8;
  dealerRule: 'S17' | 'H17'; // S17: Dealer stands on soft 17, H17: Dealer hits soft 17
  doubleRestrictions: 'any' | '9-11' | '10-11';
}

export interface ActionEV {
  action: Action;
  ev: number;
  label: string;
}

export interface ExplanationDetails {
  title: string;
  optimalActionName: string;
  ruleExplanation: string;
  mathematicalReason: string;
  dealerBustProbability: string;
  evBreakdown?: ActionEV[];
}

export interface HandSituation {
  id: string;
  playerCards: [Card, Card];
  dealerCard: Card;
  playerTotal: number;
  isSoft: boolean;
  category: HandCategory;
  optimalAction: Action;
  allowedActions: Action[];
  explanation: ExplanationDetails;
}

export type TrainingMode = 
  | 'all'
  | 'hard'
  | 'soft'
  | 'review';

export interface HandRecord {
  situationId: string;
  playerDisplay: string;
  dealerDisplay: string;
  userAction: Action;
  correctAction: Action;
  isCorrect: boolean;
  responseTimeMs: number;
  timestamp: number;
}

export interface UserStats {
  totalDecisions: number;
  correctDecisions: number;
  currentStreak: number;
  bestStreak: number;
  targetGoal: number; // e.g. 5000
  totalResponseTimeMs: number;
  categoryStats: {
    hard: { total: number; correct: number };
    soft: { total: number; correct: number };
  };
  mistakeHistory: HandRecord[];
  recentHistory: HandRecord[];
  reviewQueue: string[]; // Situation IDs that need repeating
}
