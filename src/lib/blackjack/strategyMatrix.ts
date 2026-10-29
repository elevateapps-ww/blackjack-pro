import { Action, CardRank, TableRules, ExplanationDetails, HandCategory, ActionEV } from './types';

export const DEALER_BUST_ODDS: Record<CardRank, string> = {
  '2': '35.3%',
  '3': '37.5%',
  '4': '40.3%',
  '5': '42.9%',
  '6': '42.1%',
  '7': '26.0%',
  '8': '23.9%',
  '9': '23.3%',
  '10': '21.4%',
  'J': '21.4%',
  'Q': '21.4%',
  'K': '21.4%',
  'A': '11.6% (+31.4% chance de 21 natural)',
};

export const ACTION_NAMES: Record<Action, string> = {
  'H': 'Pedir',
  'S': 'Parar',
  'D': 'Dobrar',
};

/**
 * Retorna a melhor ação matemática (Estratégia Básica pura: Pedir, Parar ou Dobrar)
 */
export function getBasicStrategyAction(
  playerTotal: number,
  dealerUpcardRank: CardRank,
  isSoft: boolean,
  rules: TableRules
): { action: Action; category: HandCategory; explanation: ExplanationDetails } {
  const dVal = rankToValue(dealerUpcardRank);

  // 1. MÃOS SUAVES (SOFT HANDS COM ÁS)
  if (isSoft) {
    return evaluateSoftAction(playerTotal, dealerUpcardRank, rules);
  }

  // 2. MÃOS RÍGIDAS (HARD TOTALS)
  return evaluateHardAction(playerTotal, dealerUpcardRank, rules);
}

// Avaliação de Mãos Suaves (Soft Hands com Ás)
function evaluateSoftAction(
  playerTotal: number,
  dealerRank: CardRank,
  rules: TableRules
): { action: Action; category: HandCategory; explanation: ExplanationDetails } {
  const dVal = rankToValue(dealerRank);

  if (playerTotal >= 20) {
    return {
      action: 'S',
      category: 'soft',
      explanation: buildExplanation(
        'S',
        `Parar no ${playerTotal} Suave vs ${dealerRank}`,
        `Você já tem ${playerTotal}, uma mão fortíssima que ganha da maioria absoluta dos jogos do dealer.`,
        'Nunca peça carta ou dobre no 20 suave.',
        DEALER_BUST_ODDS[dealerRank],
        [
          { action: 'S', ev: +0.76, label: 'Parar (Ótimo)' },
          { action: 'H', ev: -0.15, label: 'Pedir' },
        ]
      ),
    };
  }

  if (playerTotal === 19) {
    if (rules.dealerRule === 'H17' && dVal === 6) {
      return {
        action: 'D',
        category: 'soft',
        explanation: buildExplanation(
          'D',
          'Dobrar com A,8 (Soft 19) vs 6',
          'Na regra H17, o 6 do dealer tem 42.1% de chance de estourar. Dobrar a aposta nessa fraqueza é a jogada com maior lucro esperado.',
          'Dobre a aposta com risco zero de estourar na primeira compra.',
          DEALER_BUST_ODDS[dealerRank],
          [
            { action: 'D', ev: +0.62, label: 'Dobrar (Ótimo)' },
            { action: 'S', ev: +0.55, label: 'Parar' },
          ]
        ),
      };
    }
    return {
      action: 'S',
      category: 'soft',
      explanation: buildExplanation(
        'S',
        `Parar com A,8 (Soft 19) vs ${dealerRank}`,
        '19 suave é uma mão pronta de alta vitória. Pare e garanta seu lucro contra o dealer.',
        'Mantenha a mão.',
        DEALER_BUST_ODDS[dealerRank],
        [
          { action: 'S', ev: +0.55, label: 'Parar (Ótimo)' },
          { action: 'H', ev: +0.22, label: 'Pedir' },
        ]
      ),
    };
  }

  if (playerTotal === 18) {
    if (dVal >= 3 && dVal <= 6) {
      return {
        action: 'D',
        category: 'soft',
        explanation: buildExplanation(
          'D',
          `Dobrar com A,7 (Soft 18) vs ${dealerRank}`,
          `O dealer em ${dealerRank} tem ${DEALER_BUST_ODDS[dealerRank]} de chance de estourar. Como sua mão é suave, você não pode estourar na próxima carta.`,
          'Dobre a aposta para maximizar o ganho contra o dealer vulnerável.',
          DEALER_BUST_ODDS[dealerRank],
          [
            { action: 'D', ev: +0.38, label: 'Dobrar (Ótimo)' },
            { action: 'S', ev: +0.22, label: 'Parar' },
            { action: 'H', ev: +0.10, label: 'Pedir' },
          ]
        ),
      };
    }
    if (dVal === 2) {
      if (rules.dealerRule === 'H17') {
        return {
          action: 'D',
          category: 'soft',
          explanation: buildExplanation(
            'D',
            'Dobrar com A,7 vs 2 (Mesa H17)',
            'Em mesas H17, o ganho de dobrar A,7 contra o 2 supera parar.',
            'Dobre sem risco de estourar.',
            DEALER_BUST_ODDS[dealerRank]
          ),
        };
      } else {
        return {
          action: 'S',
          category: 'soft',
          explanation: buildExplanation(
            'S',
            'Parar com A,7 vs 2 (Mesa S17)',
            'Contra dealer 2 em mesa S17, seu 18 já é favorito sólido. Parar protege seu retorno sem arriscar dobrar.',
            'Pare no 18.',
            DEALER_BUST_ODDS[dealerRank]
          ),
        };
      }
    }
    if (dVal === 7 || dVal === 8) {
      return {
        action: 'S',
        category: 'soft',
        explanation: buildExplanation(
          'S',
          `Parar com A,7 (Soft 18) vs ${dealerRank}`,
          `Contra 7 e 8, seu 18 vence ou empata na maioria das vezes. Não arrisque piorar uma mão vitoriosa.`,
          'Pare no 18.',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    // 9, 10, A: PEDIR CARTA (HIT)!
    return {
      action: 'H',
      category: 'soft',
      explanation: buildExplanation(
        'H',
        `Pedir com A,7 (Soft 18) vs ${dealerRank}`,
        `Contra cartas altas (${dealerRank}), o dealer frequentemente atinge 19, 20 ou 21. Se você parar no 18, você perde a longo prazo!`,
        'Como a mão é suave com Ás, você tem uma carta sem risco de estourar para tentar fazer 19, 20 ou 21.',
        DEALER_BUST_ODDS[dealerRank],
        [
          { action: 'H', ev: -0.12, label: 'Pedir (Menor Perda)' },
          { action: 'S', ev: -0.18, label: 'Parar (Perde Dinheiro)' },
        ]
      ),
    };
  }

  // Soft 17 (A,6)
  if (playerTotal === 17) {
    if (dVal >= 3 && dVal <= 6) {
      return {
        action: 'D',
        category: 'soft',
        explanation: buildExplanation(
          'D',
          `Dobrar com A,6 (Soft 17) vs ${dealerRank}`,
          `17 é fraco, mas contra dealer fraco (${dealerRank}), dobrar aproveita a imunidade a estouro para tentar chegar a 18-21 com aposta em dobro.`,
          'Dobre a aposta.',
          DEALER_BUST_ODDS[dealerRank],
          [
            { action: 'D', ev: +0.22, label: 'Dobrar (Ótimo)' },
            { action: 'H', ev: +0.08, label: 'Pedir' },
            { action: 'S', ev: -0.18, label: 'Parar (Erro Crasso)' },
          ]
        ),
      };
    }
    return {
      action: 'H',
      category: 'soft',
      explanation: buildExplanation(
        'H',
        `Pedir com A,6 (Soft 17) vs ${dealerRank}`,
        'Nunca pare no 17 suave. O dealer só para no 17 ou mais, então 17 nunca ganha a menos que o dealer estoure.',
        'Como a mão tem Ás, você não estoura pedindo carta. Peça mais!',
        DEALER_BUST_ODDS[dealerRank],
        [
          { action: 'H', ev: -0.05, label: 'Pedir (Ótimo)' },
          { action: 'S', ev: -0.38, label: 'Parar no 17 (Erro Grave)' },
        ]
      ),
    };
  }

  // Soft 15 e 16 (A,4 e A,5)
  if (playerTotal === 15 || playerTotal === 16) {
    if (dVal >= 4 && dVal <= 6) {
      return {
        action: 'D',
        category: 'soft',
        explanation: buildExplanation(
          'D',
          `Dobrar com ${playerTotal === 15 ? 'A,4' : 'A,5'} vs ${dealerRank}`,
          `Contra a zona de maior estouro do dealer (${dealerRank} estoura em ${DEALER_BUST_ODDS[dealerRank]}), dobre com tranquilidade sem medo de estourar.`,
          'Dobre a aposta.',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    return {
      action: 'H',
      category: 'soft',
      explanation: buildExplanation(
        'H',
        `Pedir com ${playerTotal === 15 ? 'A,4' : 'A,5'} vs ${dealerRank}`,
        'Mão suave baixa contra carta sólida. Peça carta para construir uma pontuação maior.',
        'Peça carta.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // Soft 13 e 14 (A,2 e A,3)
  if (playerTotal === 13 || playerTotal === 14) {
    if (dVal === 5 || dVal === 6) {
      return {
        action: 'D',
        category: 'soft',
        explanation: buildExplanation(
          'D',
          `Dobrar com ${playerTotal === 13 ? 'A,2' : 'A,3'} vs ${dealerRank}`,
          `5 e 6 são as cartas mais vulneráveis do dealer (estouro de ~42%). Vale a pena dobrar a aposta.`,
          'Dobre.',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    return {
      action: 'H',
      category: 'soft',
      explanation: buildExplanation(
        'H',
        `Pedir com ${playerTotal === 13 ? 'A,2' : 'A,3'} vs ${dealerRank}`,
        'Pontuação baixa para dobrar. Peça carta.',
        'Peça carta.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  return {
    action: 'H',
    category: 'soft',
    explanation: buildExplanation('H', 'Pedir', 'Peça carta em mão suave.', '', DEALER_BUST_ODDS[dealerRank]),
  };
}

// Avaliação de Mãos Rígidas (Hard Totals)
function evaluateHardAction(
  playerTotal: number,
  dealerRank: CardRank,
  rules: TableRules
): { action: Action; category: HandCategory; explanation: ExplanationDetails } {
  const dVal = rankToValue(dealerRank);

  // 17 a 21: Parar sempre
  if (playerTotal >= 17) {
    return {
      action: 'S',
      category: 'hard',
      explanation: buildExplanation(
        'S',
        `Parar com ${playerTotal} Rígido vs ${dealerRank}`,
        `Com ${playerTotal} duro, o risco de você estourar é de 70% a 85%.`,
        'Nunca peça carta no 17+ duro. Deixe o dealer jogar.',
        DEALER_BUST_ODDS[dealerRank],
        [
          { action: 'S', ev: playerTotal >= 19 ? +0.45 : -0.15, label: `Parar no ${playerTotal} (Ótimo)` },
          { action: 'H', ev: -0.75, label: 'Pedir (Estoura)' },
        ]
      ),
    };
  }

  // 13 a 16: Parar contra 2 a 6; Pedir contra 7 a A
  if (playerTotal >= 13 && playerTotal <= 16) {
    if (dVal >= 2 && dVal <= 6) {
      return {
        action: 'S',
        category: 'hard',
        explanation: buildExplanation(
          'S',
          `Parar com ${playerTotal} vs ${dealerRank} (Dealer em Zona de Estouro)`,
          `Contra cartas fracas do dealer (2 a 6), a chance de ele estourar é de ${DEALER_BUST_ODDS[dealerRank]}. Se você pedir carta, você estoura em mais da metade das vezes.`,
          'Não se suicide. Pare e deixe o dealer estourar!',
          DEALER_BUST_ODDS[dealerRank],
          [
            { action: 'S', ev: -0.18, label: 'Parar (Ótimo)' },
            { action: 'H', ev: -0.28, label: 'Pedir (Risco Alto)' },
          ]
        ),
      };
    }
    return {
      action: 'H',
      category: 'hard',
      explanation: buildExplanation(
        'H',
        `Pedir com ${playerTotal} vs ${dealerRank}`,
        `Contra 7 a Ás, o dealer raramente estoura. Se você parar no ${playerTotal}, você perderá em 75%+ das vezes.`,
        'Pedir carta perde menos dinheiro a longo prazo do que aceitar a derrota parado.',
        DEALER_BUST_ODDS[dealerRank],
        [
          { action: 'H', ev: -0.42, label: 'Pedir (Menor Perda)' },
          { action: 'S', ev: -0.54, label: 'Parar (Derrota Certa)' },
        ]
      ),
    };
  }

  // 12: Parar contra 4, 5, 6; Pedir contra 2, 3 e 7 a A
  if (playerTotal === 12) {
    if (dVal >= 4 && dVal <= 6) {
      return {
        action: 'S',
        category: 'hard',
        explanation: buildExplanation(
          'S',
          `Parar com 12 vs ${dealerRank}`,
          `Com 12, você só estoura com carta 10 (30.8%). Porém o dealer estoura em ${DEALER_BUST_ODDS[dealerRank]}.`,
          'O valor esperado de parar é superior. Deixe o dealer quebrar.',
          DEALER_BUST_ODDS[dealerRank],
          [
            { action: 'S', ev: -0.158, label: 'Parar (Ótimo)' },
            { action: 'H', ev: -0.224, label: 'Pedir' },
          ]
        ),
      };
    }
    return {
      action: 'H',
      category: 'hard',
      explanation: buildExplanation(
        'H',
        `Pedir com 12 vs ${dealerRank}`,
        `Diferente de 4, 5 e 6, o dealer 2 e 3 não estoura tanto quanto se imagina (~35% a 37%).`,
        'Como você só estoura em 30.8% das vezes, pedir carta perde menos do que parar.',
        DEALER_BUST_ODDS[dealerRank],
        [
          { action: 'H', ev: -0.25, label: 'Pedir (Ótimo)' },
          { action: 'S', ev: -0.29, label: 'Parar' },
        ]
      ),
    };
  }

  // 11: Dobrar sempre contra 2 a 10; vs A depende de H17/S17
  if (playerTotal === 11) {
    if (dealerRank === 'A') {
      if (rules.dealerRule === 'H17') {
        return {
          action: 'D',
          category: 'hard',
          explanation: buildExplanation(
            'D',
            'Dobrar com 11 vs Ás (Regra H17)',
            'Em mesas H17, dobrar 11 contra Ás gera EV positivo.',
            'Dobre a aposta.',
            DEALER_BUST_ODDS[dealerRank]
          ),
        };
      } else {
        return {
          action: 'H',
          category: 'hard',
          explanation: buildExplanation(
            'H',
            'Pedir com 11 vs Ás (Regra S17)',
            'Em mesas S17, o Ás do dealer é tão dominante que dobrar é agressivo demais. Peça carta.',
            'Peça carta.',
            DEALER_BUST_ODDS[dealerRank]
          ),
        };
      }
    }
    return {
      action: 'D',
      category: 'hard',
      explanation: buildExplanation(
        'D',
        `Dobrar com 11 vs ${dealerRank}!`,
        '11 é a melhor mão do blackjack para dobrar, com quase 1/3 de chance de bater 21 de imediato.',
        'Dobre o valor da aposta para maximizar o retorno.',
        DEALER_BUST_ODDS[dealerRank],
        [
          { action: 'D', ev: +0.67, label: 'Dobrar (Lucro Máximo)' },
          { action: 'H', ev: +0.33, label: 'Pedir' },
        ]
      ),
    };
  }

  // 10: Dobrar contra 2 a 9; Pedir contra 10, A
  if (playerTotal === 10) {
    if (dVal >= 2 && dVal <= 9) {
      return {
        action: 'D',
        category: 'hard',
        explanation: buildExplanation(
          'D',
          `Dobrar com 10 vs ${dealerRank}`,
          `Você tem vantagem líquida enorme com 10 contra cartas menores que 10. Você tem quase 31% de chance de somar 20.`,
          'Aproveite a vantagem e dobre.',
          DEALER_BUST_ODDS[dealerRank],
          [
            { action: 'D', ev: +0.52, label: 'Dobrar (Ótimo)' },
            { action: 'H', ev: +0.26, label: 'Pedir' },
          ]
        ),
      };
    }
    return {
      action: 'H',
      category: 'hard',
      explanation: buildExplanation(
        'H',
        `Pedir com 10 vs ${dealerRank}`,
        `Contra 10 ou Ás, o dealer tem tanta probabilidade de 20 ou 21 quanto você. Dobrar aumentaria o risco sem vantagem matemática.`,
        'Peça carta normalmente.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 9: Dobrar contra 3 a 6; senão Pedir
  if (playerTotal === 9) {
    if (dVal >= 3 && dVal <= 6) {
      return {
        action: 'D',
        category: 'hard',
        explanation: buildExplanation(
          'D',
          `Dobrar com 9 vs ${dealerRank}`,
          `Contra cartas fracas do dealer (3 a 6), o 9 frequentemente atinge 19 com uma única carta alta.`,
          'Dobre a aposta.',
          DEALER_BUST_ODDS[dealerRank],
          [
            { action: 'D', ev: +0.24, label: 'Dobrar (Ótimo)' },
            { action: 'H', ev: +0.12, label: 'Pedir' },
          ]
        ),
      };
    }
    return {
      action: 'H',
      category: 'hard',
      explanation: buildExplanation(
        'H',
        `Pedir com 9 vs ${dealerRank}`,
        'Contra 2 ou contra 7+, a vantagem não justifica dobrar. Peça carta.',
        'Peça carta.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 5 a 8: Pedir sempre
  return {
    action: 'H',
    category: 'hard',
    explanation: buildExplanation(
      'H',
      `Pedir com ${playerTotal} Rígido vs ${dealerRank}`,
      `Com ${playerTotal}, você nunca estoura na primeira carta.`,
      'Peça carta.',
      DEALER_BUST_ODDS[dealerRank]
    ),
  };
}

export function rankToValue(rank: CardRank): number {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J', '10'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

function buildExplanation(
  action: Action,
  title: string,
  ruleExplanation: string,
  mathematicalReason: string,
  dealerBustProbability: string,
  evBreakdown?: ActionEV[]
): ExplanationDetails {
  return {
    title,
    optimalActionName: ACTION_NAMES[action],
    ruleExplanation,
    mathematicalReason,
    dealerBustProbability,
    evBreakdown,
  };
}
