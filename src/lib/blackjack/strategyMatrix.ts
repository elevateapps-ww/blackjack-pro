import { Action, CardRank, TableRules, ExplanationDetails, HandCategory } from './types';

// Probabilidade matemática exata de estouro do Dealer por carta aberta (multi-deck S17 padrão)
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
  'H': 'Pedir Carta (Hit)',
  'S': 'Parar (Stand)',
  'D': 'Dobrar (Double)',
  'P': 'Dividir Par (Split)',
  'R': 'Render-se (Surrender)',
};

/**
 * Retorna a melhor ação matemática (Estratégia Básica) para uma mão
 */
export function getBasicStrategyAction(
  playerTotal: number,
  dealerUpcardRank: CardRank,
  isSoft: boolean,
  isPair: boolean,
  pairRank: CardRank | null,
  rules: TableRules
): { action: Action; category: HandCategory; explanation: ExplanationDetails } {
  const dVal = rankToValue(dealerUpcardRank);
  const dealerRankDisplay = dealerUpcardRank;

  // 1. CHECAGEM DE RENDIÇÃO (LATE SURRENDER) - Se permitido
  if (rules.surrender === 'late') {
    // 16 vs 9, 10, A (exceto par de 8,8 se divisão for melhor)
    if (playerTotal === 16 && !isSoft) {
      if (isPair && pairRank === '8') {
        // 8,8 vs A em H17 rende se surrender permitido, senão split
        if (rules.dealerRule === 'H17' && dealerUpcardRank === 'A') {
          return {
            action: 'R',
            category: 'surrender',
            explanation: buildExplanation(
              'R',
              'Render-se (Surrender) com 8,8 vs Ás (Mesa H17)',
              'Em mesas H17 (Dealer pede com 17 suave), o Ás do dealer é ainda mais forte. A rendição economiza 50% da sua aposta, gerando EV de -0.50 contra -0.52 da divisão.',
              'A rendição de 8,8 contra Ás em H17 é a jogada estatisticamente comprovada pelos maiores matemáticos de cassino.',
              DEALER_BUST_ODDS[dealerUpcardRank]
            ),
          };
        }
        // Em outras situações 8,8 divide
      } else {
        if (dealerUpcardRank === '9' || dealerUpcardRank === '10' || dealerUpcardRank === 'J' || dealerUpcardRank === 'Q' || dealerUpcardRank === 'K' || dealerUpcardRank === 'A') {
          return {
            action: 'R',
            category: 'surrender',
            explanation: buildExplanation(
              'R',
              `Render-se (Surrender) com 16 vs ${dealerRankDisplay}`,
              `Com 16 contra cartas de ponta do dealer (${dealerRankDisplay}), você está na pior situação possível do blackjack. Pedir carta estoura em ~62% das vezes; parar perde em mais de 77% das vezes.`,
              'Rendendo-se imediatamente, você recupera 50% do seu dinheiro (-0.50 EV), que é muito superior a jogar a mão com EV médio de -0.54.',
              DEALER_BUST_ODDS[dealerUpcardRank],
              'Se o cassino não permitir rendição nesta mesa, a melhor alternativa seria Pedir Carta (Hit).'
            ),
          };
        }
      }
    }

    // 15 vs 10, e vs A em H17
    if (playerTotal === 15 && !isSoft) {
      if (dealerUpcardRank === '10' || dealerUpcardRank === 'J' || dealerUpcardRank === 'Q' || dealerUpcardRank === 'K') {
        return {
          action: 'R',
          category: 'surrender',
          explanation: buildExplanation(
            'R',
            'Render-se (Surrender) com 15 vs 10',
            'O 15 contra 10 do Dealer tem valor esperado negativo gravíssimo se você jogar (-0.54 EV pedindo, -0.57 EV parando).',
            'Cortar a perda em exatamente 50% (-0.50 EV) é a jogada com maior conservação de banca a longo prazo.',
            DEALER_BUST_ODDS[dealerUpcardRank],
            'Sem opção de rendição, a alternativa obrigatória é Pedir Carta (Hit).'
          ),
        };
      }
      if (rules.dealerRule === 'H17' && dealerUpcardRank === 'A') {
        return {
          action: 'R',
          category: 'surrender',
          explanation: buildExplanation(
            'R',
            'Render-se (Surrender) com 15 vs Ás (Regra H17)',
            'Em mesas H17, o Dealer que atinge 17 suave ainda tem chance de melhorar a mão. Isso empurra a perda esperada de bater ou parar com 15 para além de -0.50.',
            'A matemática dita rendição mandatória de 15 contra Ás em qualquer mesa H17 com Late Surrender.',
            DEALER_BUST_ODDS[dealerUpcardRank]
          ),
        };
      }
    }

    // 17 vs A em H17
    if (playerTotal === 17 && !isSoft && rules.dealerRule === 'H17' && dealerUpcardRank === 'A') {
      return {
        action: 'R',
        category: 'surrender',
        explanation: buildExplanation(
          'R',
          'Render-se (Surrender) com 17 Rígido vs Ás (Regra H17)',
          'Um 17 duro contra Ás em mesa H17 perde para quase qualquer mão final do dealer (dealer só empata no 17 e ganha com 18 a 21).',
          'Rendendo-se, você preserva metade da aposta, superando a perda bruta de jogar o 17.',
          DEALER_BUST_ODDS[dealerUpcardRank]
        ),
      };
    }
  }

  // 2. CHECAGEM DE DIVISÃO DE PARES (PAIR SPLITTING)
  if (isPair && pairRank) {
    const pairResult = evaluatePairAction(pairRank, dealerUpcardRank, rules);
    if (pairResult) return pairResult;
  }

  // 3. CHECAGEM DE MÃOS SUAVES (SOFT HANDS COM ÁS)
  if (isSoft) {
    const softResult = evaluateSoftAction(playerTotal, dealerUpcardRank, rules);
    if (softResult) return softResult;
  }

  // 4. MÃOS RÍGIDAS (HARD TOTALS)
  return evaluateHardAction(playerTotal, dealerUpcardRank, rules);
}

// Avaliação completa de pares
function evaluatePairAction(
  pairRank: CardRank,
  dealerRank: CardRank,
  rules: TableRules
): { action: Action; category: HandCategory; explanation: ExplanationDetails } | null {
  const dVal = rankToValue(dealerRank);

  // A,A: Sempre dividir
  if (pairRank === 'A') {
    return {
      action: 'P',
      category: 'pair',
      explanation: buildExplanation(
        'P',
        'Sempre Dividir Áses (A,A)!',
        'Dividir Áses é a regra de ouro número 1 do blackjack. Ter duas mãos iniciando com valor 11 oferece 30.8% de probabilidade imediata de fazer 21 em cada mão.',
        'Se você não dividir, ficará preso a um 2 ou um 12 suave miserável. O EV do split de Áses é esmagadoramente positivo (+0.40 a +0.70 dependendo da carta do dealer).',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 8,8: Sempre dividir (exceto surrender vs A em H17, já tratado acima)
  if (pairRank === '8') {
    return {
      action: 'P',
      category: 'pair',
      explanation: buildExplanation(
        'P',
        'Sempre Dividir Oitos (8,8)!',
        'Um total de 16 duro é a pior mão existente. Ao dividir, você desmonta o 16 e cria duas novas oportunidades iniciando com 8, com alta chance de receber um 10 e finalizar com 18.',
        'Mesmo contra 9, 10 ou Ás, dividir oitos perde menos dinheiro estatístico do que pedir ou parar no 16!',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 10,10 / J,J / Q,Q / K,K: Nunca dividir, sempre Parar (Stand)
  if (pairRank === '10' || pairRank === 'J' || pairRank === 'Q' || pairRank === 'K') {
    return {
      action: 'S',
      category: 'pair',
      explanation: buildExplanation(
        'S',
        'Nunca Dividir Dez (10,10 / JJ / QQ / KK) - Parar no 20!',
        'Você já tem 20, uma mão praticamente imbatível com taxa de vitória superior a 85%.',
        'Dividir 20 para arriscar duas mãos é um erro de ganância grave que destrói o EV. Apenas contadores avançados com True Count altíssimo (+5 ou +6) desviam disso.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 9,9: Dividir contra 2 a 9 (exceto 7), Parar contra 7, 10, A
  if (pairRank === '9') {
    if (dealerRank === '7') {
      return {
        action: 'S',
        category: 'pair',
        explanation: buildExplanation(
          'S',
          'Parar (Stand) com 9,9 vs 7!',
          'Você tem 18. Contra um 7 aberto do dealer, a probabilidade mais frequente é o dealer virar 10 e totalizar 17.',
          'Seu 18 supera o 17 esperado do dealer! Não há razão para quebrar uma mão já vencedora.',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    if (dealerRank === '10' || dealerRank === 'J' || dealerRank === 'Q' || dealerRank === 'K' || dealerRank === 'A') {
      return {
        action: 'S',
        category: 'pair',
        explanation: buildExplanation(
          'S',
          `Parar (Stand) com 9,9 vs ${dealerRank}`,
          `Contra cartas fortes (${dealerRank}), o dealer frequentemente fará 19, 20 ou 21. Dividir colocaria você em duas mãos iniciando em 9 com risco de desfecho pior e dobraria seu dinheiro exposto.`,
          'Ficar com 18 sólido é matematicamente a jogada com menor perda esperada.',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    // Contra 2 a 6 e contra 8, 9
    return {
      action: 'P',
      category: 'pair',
      explanation: buildExplanation(
        'P',
        `Dividir (Split) com 9,9 vs ${dealerRank}`,
        `Contra dealer ${dealerRank}, iniciar duas mãos em 9 contra uma carta fraca ou vulnerável multiplica seu ganho esperado.`,
        'Mesmo contra 9 do dealer, seu split é superior porque você ganha a chance de dobrar quando vier uma carta favorável.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 7,7: Dividir contra 2 a 7, Pedir contra 8 a A
  if (pairRank === '7') {
    if (dVal >= 2 && dVal <= 7) {
      return {
        action: 'P',
        category: 'pair',
        explanation: buildExplanation(
          'P',
          `Dividir (Split) com 7,7 vs ${dealerRank}`,
          `Um 14 rígido é vulnerável. Contra um dealer mostrando ${dealerRank} (com alta probabilidade de estouro ou total fraco), iniciar duas mãos com 7 tem expectativa muito superior a arriscar estourar com 14.`,
          'Você transforma uma mão ruim (14) em duas oportunidades lucrativas.',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    return {
      action: 'H',
      category: 'pair',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com 7,7 vs ${dealerRank}`,
        `Contra cartas fortes (${dealerRank}), dividir 7,7 dobraria sua aposta em duas situações desfavoráveis.`,
        'Você deve tratar o 7,7 como um 14 rígido comum e pedir carta (Hit).',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 6,6: Dividir contra 3 a 6 (e contra 2 se DAS for permitido); senão Pedir
  if (pairRank === '6') {
    const canSplitVs2 = rules.das ? (dVal >= 2 && dVal <= 6) : (dVal >= 3 && dVal <= 6);
    if (canSplitVs2) {
      return {
        action: 'P',
        category: 'pair',
        explanation: buildExplanation(
          'P',
          `Dividir (Split) com 6,6 vs ${dealerRank}`,
          `Com o dealer mostrando ${dealerRank}, a taxa de estouro da mesa é de ${DEALER_BUST_ODDS[dealerRank]}. ${rules.das ? 'Como é permitido dobrar após dividir (DAS), iniciar em 6 torna-se lucrativo.' : 'A fraqueza do dealer justifica dividir.'}`,
          '12 rígido arrisca estourar com qualquer carta 10 (30.8%). Dividir dispersa o risco em duas mãos com potencial.',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    return {
      action: 'H',
      category: 'pair',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com 6,6 vs ${dealerRank}`,
        `Trate como 12 rígido contra carta neutra/forte do dealer. Pedir carta é estatisticamente a melhor jogada.`,
        'Dividir 6 contra cartas altas apenas duplica suas chances de perder.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 5,5: NUNCA DIVIDIR! Tratar como 10 rígido -> Dobrar contra 2 a 9, senão Pedir
  if (pairRank === '5') {
    if (dVal >= 2 && dVal <= 9) {
      return {
        action: 'D',
        category: 'pair',
        explanation: buildExplanation(
          'D',
          `Dobrar (Double) com 5,5 vs ${dealerRank} - NUNCA DIVIDA CINCOS!`,
          'Dividir 5,5 é um dos maiores pecados do blackjack! Você quebraria um 10 poderoso em dois 5 horríveis.',
          `Com 10 contra ${dealerRank}, você tem uma vantagem enorme. Dobre para maximizar o lucro recebendo exatamente mais uma carta (com 30.8% de chance de somar 20).`,
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    return {
      action: 'H',
      category: 'pair',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com 5,5 vs ${dealerRank}`,
        'Nunca divida 5,5. Contra 10 ou Ás do dealer, dobrar é muito arriscado. Bater no 10 garante a flexibilidade de continuar pedindo se vier carta baixa.',
        'Aproveite a mão como 10 rígido e peça carta.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 4,4: Dividir apenas contra 5 e 6 se DAS for permitido; senão Pedir
  if (pairRank === '4') {
    if (rules.das && (dVal === 5 || dVal === 6)) {
      return {
        action: 'P',
        category: 'pair',
        explanation: buildExplanation(
          'P',
          `Dividir (Split) com 4,4 vs ${dealerRank} (com regra DAS)`,
          `Com DAS (Dobrar após Split permitido) e dealer em 5 ou 6 (${DEALER_BUST_ODDS[dealerRank]} de chance de estourar), dividir 4,4 permite dobrar se receber 5, 6 ou 7.`,
          'A possibilidade de dobrar após a divisão converte o split de 4 em valor esperado positivo.',
          DEALER_BUST_ODDS[dealerRank],
          'Sem regra DAS, a jogada correta seria Pedir Carta (Hit).'
        ),
      };
    }
    return {
      action: 'H',
      category: 'pair',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com 4,4 vs ${dealerRank}`,
        'Um total de 8 rígido tem excelente potencial para receber cartas médias e altas. Dividir sem a certeza de poder dobrar lucrativamente é prejudicial.',
        'Trate como 8 rígido e peça mais uma carta.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 2,2 e 3,3: Dividir contra 4 a 7 (e contra 2 e 3 se DAS permitido); senão Pedir
  if (pairRank === '2' || pairRank === '3') {
    const canSplit = rules.das ? (dVal >= 2 && dVal <= 7) : (dVal >= 4 && dVal <= 7);
    if (canSplit) {
      return {
        action: 'P',
        category: 'pair',
        explanation: buildExplanation(
          'P',
          `Dividir (Split) com ${pairRank},${pairRank} vs ${dealerRank}`,
          `Contra dealer vulnerável (${dealerRank}), começar duas mãos novas com ${pairRank} e aproveitar a alta taxa de busto (${DEALER_BUST_ODDS[dealerRank]}) ou dobrar após split supera manter 4 ou 6.`,
          'A jogada explora a fraqueza do dealer para dobrar o potencial de lucro.',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    return {
      action: 'H',
      category: 'pair',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com ${pairRank},${pairRank} vs ${dealerRank}`,
        `Contra cartas altas (${dealerRank}), o dealer provavelmente formará um jogo forte. Dividir colocaria você em desvantagem em duas frentes.`,
        `Peça carta no total de ${pairRank === '2' ? '4' : '6'}.`,
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  return null;
}

// Avaliação completa de Mãos Suaves (com Ás)
function evaluateSoftAction(
  playerTotal: number,
  dealerRank: CardRank,
  rules: TableRules
): { action: Action; category: HandCategory; explanation: ExplanationDetails } {
  const dVal = rankToValue(dealerRank);

  // Soft 20 (A,9) ou Soft 21 (A,10): Sempre Parar (Stand)
  // Nota: em raríssimos jogos de single deck H17 pode dobrar A,9 vs 6, mas em padrão profissional paramos
  if (playerTotal >= 20) {
    return {
      action: 'S',
      category: 'soft',
      explanation: buildExplanation(
        'S',
        `Parar (Stand) no ${playerTotal} Suave vs ${dealerRank}`,
        `Você já possui ${playerTotal}, uma pontuação excepcional que vence a esmagadora maioria das mãos do dealer.`,
        'Arriscar dobrar ou bater seria destruir uma mão praticamente vitoriosa.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // Soft 19 (A,8):
  // H17: Dobra contra 6; senão Parar
  // S17: Sempre Parar
  if (playerTotal === 19) {
    if (rules.dealerRule === 'H17' && dVal === 6) {
      return {
        action: 'D',
        category: 'soft',
        explanation: buildExplanation(
          'D',
          'Dobrar (Double) com A,8 (Soft 19) vs 6 (Regra H17)',
          'Em mesas onde o Dealer Pede no 17 suave (H17), a carta 6 do dealer tem a pior taxa de sobrevivência da mesa (42.1% de busto).',
          'Dobrar um 19 suave contra o 6 do dealer tem um ganho de EV líquido substancial porque sua aposta é duplicada na posição mais vulnerável possível do cassino.',
          DEALER_BUST_ODDS[dealerRank],
          'Em mesas S17 padrão, a jogada recomendada é Parar (Stand).'
        ),
      };
    }
    return {
      action: 'S',
      category: 'soft',
      explanation: buildExplanation(
        'S',
        `Parar (Stand) com A,8 (Soft 19) vs ${dealerRank}`,
        '19 suave é uma mão fortíssima que já te coloca à frente de quase todas as finalizações do dealer.',
        'Mantenha a mão e garanta a vitória.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // Soft 18 (A,7):
  // Dobra contra 2, 3, 4, 5, 6 (em H17 dobra vs 2..6; em S17 dobra vs 3..6 e Stand vs 2)
  // Parar contra 7, 8
  // Pedir contra 9, 10, A
  if (playerTotal === 18) {
    if (dVal >= 3 && dVal <= 6) {
      return {
        action: 'D',
        category: 'soft',
        explanation: buildExplanation(
          'D',
          `Dobrar (Double) com A,7 (Soft 18) vs ${dealerRank}`,
          `Com o dealer vulnerável em ${dealerRank} (${DEALER_BUST_ODDS[dealerRank]} de chance de estourar), dobrar o 18 suave é matematicamente fantástico.`,
          'Como a mão é suave, você não pode estourar na próxima carta! Se vier uma carta alta, você mantém ou melhora; se vier baixa, o dealer ainda tem probabilidade massiva de estourar.',
          DEALER_BUST_ODDS[dealerRank],
          'Se o cassino proibir dobrar em mãos suaves, a jogada é Parar (Stand).'
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
            'Dobrar (Double) com A,7 vs 2 (Mesa H17)',
            'Em mesas H17, o dealer é mais agressivo, e o ganho matemático de dobrar o A,7 contra o 2 supera o Stand.',
            'Você dobra a aposta com risco zero de estourar no sorteio imediato.',
            DEALER_BUST_ODDS[dealerRank],
            'Em mesas S17, a jogada correta é Parar (Stand).'
          ),
        };
      } else {
        return {
          action: 'S',
          category: 'soft',
          explanation: buildExplanation(
            'S',
            'Parar (Stand) com A,7 vs 2 (Mesa S17)',
            'Contra dealer 2 em mesa S17, seu 18 já possui taxa de vitória sólida. O dealer 2 não é tão vulnerável quanto 4, 5 ou 6 para compensar dobrar.',
            'Parar preserva seu valor esperado com segurança.',
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
          `Parar (Stand) com A,7 (Soft 18) vs ${dealerRank}`,
          `Contra o 7 e 8 do dealer, seu 18 é favorito ou empata. Arriscar pedir carta pode piorar uma mão que já está na frente.`,
          'Fique no 18 e colha o ganho esperado positivo.',
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
        `Pedir Carta (Hit) com A,7 (Soft 18) vs ${dealerRank}!`,
        `Este é um dos erros mais comuns de iniciantes! Muitos param no 18 contra cartas altas. Porém, contra ${dealerRank}, o dealer atinge 19, 20 ou 21 na maior parte das rodadas. Seu 18 é perdedor a longo prazo se você parar!`,
        'Como você tem uma mão suave, você NÃO corre risco de estourar na primeira carta! Você tem uma carta grátis para tentar um Ás, 2 ou 3 (virando 19, 20 ou 21) ou uma carta de 10 para continuar no 18.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // Soft 17 (A,6):
  // Dobra contra 3 a 6; senão Pedir
  if (playerTotal === 17) {
    if (dVal >= 3 && dVal <= 6) {
      return {
        action: 'D',
        category: 'soft',
        explanation: buildExplanation(
          'D',
          `Dobrar (Double) com A,6 (Soft 17) vs ${dealerRank}`,
          `17 é uma mão fraca no blackjack (o dealer empata com 17 ou faz melhor). Porém, contra a fraqueza do dealer (${dealerRank}), dobrar aproveita a imunidade a estouro para tentar converter a mão em 18 a 21 enquanto o dealer corre risco de busto de ${DEALER_BUST_ODDS[dealerRank]}.`,
          'Se não puder dobrar, sempre peça carta (Hit). Nunca pare no 17 suave!',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    return {
      action: 'H',
      category: 'soft',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com A,6 (Soft 17) vs ${dealerRank} - NUNCA PARE NO 17 SUAVE!`,
        'Nunca, em hipótese alguma, pare com Soft 17. O 17 só vence se o dealer estourar, e o dealer nunca para abaixo de 17.',
        'Como a mão é suave com Ás, você não tem nenhum risco de estourar pedindo carta. Melhore sua mão!',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // Soft 15 (A,4) e Soft 16 (A,5):
  // Dobra contra 4 a 6; senão Pedir
  if (playerTotal === 15 || playerTotal === 16) {
    if (dVal >= 4 && dVal <= 6) {
      return {
        action: 'D',
        category: 'soft',
        explanation: buildExplanation(
          'D',
          `Dobrar (Double) com ${playerTotal === 15 ? 'A,4 (Soft 15)' : 'A,5 (Soft 16)'} vs ${dealerRank}`,
          `Contra os dealers mais propensos a estourar (${dealerRank} estoura em ${DEALER_BUST_ODDS[dealerRank]}), dobrar ${playerTotal} suave tem expectativa positiva.`,
          'Você arrisca o dobro na vulnerabilidade do dealer sabendo que não pode estourar na próxima carta.',
          DEALER_BUST_ODDS[dealerRank],
          'Se dobrar não for permitido, peça carta (Hit).'
        ),
      };
    }
    return {
      action: 'H',
      category: 'soft',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com ${playerTotal === 15 ? 'A,4' : 'A,5'} vs ${dealerRank}`,
        'Mão suave baixa contra carta sólida do dealer. Peça carta sem medo de estourar para construir um total competitivo.',
        'A única forma de rentabilizar essa mão é melhorando a pontuação.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // Soft 13 (A,2) e Soft 14 (A,3):
  // Dobra contra 5 e 6; senão Pedir
  if (playerTotal === 13 || playerTotal === 14) {
    if (dVal === 5 || dVal === 6) {
      return {
        action: 'D',
        category: 'soft',
        explanation: buildExplanation(
          'D',
          `Dobrar (Double) com ${playerTotal === 13 ? 'A,2' : 'A,3'} vs ${dealerRank}`,
          `5 e 6 são as cartas mais desastrosas para o dealer (estouro de 42% a 43%). Isso permite até mãos suaves modestas como ${playerTotal} dobrarem a aposta com EV positivo.`,
          'Receba mais uma carta e deixe a matemática do cassino trabalhar ao seu favor.',
          DEALER_BUST_ODDS[dealerRank],
          'Se não puder dobrar, peça carta (Hit).'
        ),
      };
    }
    return {
      action: 'H',
      category: 'soft',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com ${playerTotal === 13 ? 'A,2' : 'A,3'} vs ${dealerRank}`,
        'Sua pontuação atual é muito baixa para dobrar contra esse dealer. Peça carta para evoluir a mão.',
        'O Ás garante proteção total contra busto no primeiro hit.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // Fallback
  return {
    action: 'H',
    category: 'soft',
    explanation: buildExplanation('H', 'Pedir Carta', 'Peça carta em mão suave.', '', DEALER_BUST_ODDS[dealerRank]),
  };
}

// Avaliação completa de Mãos Rígidas (Hard Totals)
function evaluateHardAction(
  playerTotal: number,
  dealerRank: CardRank,
  rules: TableRules
): { action: Action; category: HandCategory; explanation: ExplanationDetails } {
  const dVal = rankToValue(dealerRank);

  // 17 a 21 Rígido: Sempre Parar (Stand)
  if (playerTotal >= 17) {
    return {
      action: 'S',
      category: 'hard',
      explanation: buildExplanation(
        'S',
        `Parar (Stand) com ${playerTotal} Rígido vs ${dealerRank}`,
        `Com ${playerTotal} duro, a chance de você estourar pedindo carta é gigantesca (${playerTotal === 17 ? '69.2%' : playerTotal === 18 ? '76.9%' : '84.6%+'}).`,
        'Nunca peça carta no 17+ rígido. Deixe o dealer jogar e arriscar a própria mão.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 13 a 16 Rígido (Stiff Hands):
  // Parar contra 2 a 6 (Dealer Bust zone)
  // Pedir contra 7 a A (Dealer Pat zone)
  if (playerTotal >= 13 && playerTotal <= 16) {
    if (dVal >= 2 && dVal <= 6) {
      return {
        action: 'S',
        category: 'hard',
        explanation: buildExplanation(
          'S',
          `Parar (Stand) com ${playerTotal} vs ${dealerRank} (Dealer em Zona de Estouro!)`,
          `Mãos de 12 a 16 são chamadas 'mãos quebradas' (stiff hands). Contra cartas de 2 a 6, o dealer é forçado a pedir e tem probabilidade de estourar de ${DEALER_BUST_ODDS[dealerRank]}.`,
          'Se você pedir carta, você corre risco de ~54% a ~62% de estourar imediatamente. Não se suicide quando o dealer tem alta chance de se autodestruir!',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    return {
      action: 'H',
      category: 'hard',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com ${playerTotal} vs ${dealerRank}`,
        `Contra um 7, 8, 9, 10 ou Ás, o dealer raramente estoura (taxa de busto de apenas ~21% a 26%). Se você parar com ${playerTotal}, você perde cerca de 75% a 80% das vezes.`,
        'Mesmo correndo risco de estourar, a matemática comprova que pedir carta tem expectativa de perda substancialmente menor do que parar conformado.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 12 Rígido:
  // Parar contra 4, 5, 6
  // Pedir contra 2, 3 e 7 a A
  if (playerTotal === 12) {
    if (dVal >= 4 && dVal <= 6) {
      return {
        action: 'S',
        category: 'hard',
        explanation: buildExplanation(
          'S',
          `Parar (Stand) com 12 vs ${dealerRank}`,
          `Com 12, você só estoura se vier um 10 (4 cartas em 13, ~30.8%). Porém, contra 4, 5 ou 6, o dealer estoura em ${DEALER_BUST_ODDS[dealerRank]}.`,
          'O valor esperado de parar (+EV relativo) supera pedir carta. Deixe o dealer estourar!',
          DEALER_BUST_ODDS[dealerRank]
        ),
      };
    }
    return {
      action: 'H',
      category: 'hard',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com 12 vs ${dealerRank}`,
        `Diferente de 4, 5 e 6, o dealer 2 e 3 não estoura tanto quanto as pessoas pensam (apenas 35% a 37%).`,
        'Como você só estoura em 30.8% das vezes com 12 (somente se vier um 10), a matemática prova que pedir carta perde menos a longo prazo do que parar!',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 11 Rígido:
  // Dobrar contra 2 a 10 (sempre).
  // Contra Ás: Dobra se H17, Pedir se S17.
  if (playerTotal === 11) {
    if (dealerRank === 'A') {
      if (rules.dealerRule === 'H17') {
        return {
          action: 'D',
          category: 'hard',
          explanation: buildExplanation(
            'D',
            'Dobrar (Double) com 11 vs Ás (Regra H17)',
            'Em mesas H17, o Dealer tem maior probabilidade de estourar no 17 suave. Isso empurra o valor esperado de dobrar 11 para o território positivo contra o Ás.',
            'Dobre e pressione o dealer.',
            DEALER_BUST_ODDS[dealerRank],
            'Em mesas S17, a jogada da estratégia básica é Pedir Carta (Hit).'
          ),
        };
      } else {
        return {
          action: 'H',
          category: 'hard',
          explanation: buildExplanation(
            'H',
            'Pedir Carta (Hit) com 11 vs Ás (Regra S17)',
            'Em mesas S17, o Ás do dealer é tão dominante e tem baixa probabilidade de busto que dobrar é matematicamente agressivo demais.',
            'Peça carta para receber seu 10 e ainda manter flexibilidade se receber uma carta baixa.',
            DEALER_BUST_ODDS[dealerRank],
            'Em mesas H17, a jogada muda para Dobrar (Double).'
          ),
        };
      }
    }
    // Contra 2 a 10: SEMPRE DOBRAR!
    return {
      action: 'D',
      category: 'hard',
      explanation: buildExplanation(
        'D',
        `Dobrar (Double) com 11 vs ${dealerRank}!`,
        'O 11 é a melhor mão inicial do blackjack para dobrar. Com 30.8% de probabilidade imediata de fazer um 21 perfeito (ao puxar 10, J, Q ou K).',
        'Dobre o valor da sua aposta para maximizar os lucros matemáticos.',
        DEALER_BUST_ODDS[dealerRank],
        'Se o cassino não permitir dobrar, sempre peça carta (Hit).'
      ),
    };
  }

  // 10 Rígido:
  // Dobra contra 2 a 9; Pedir contra 10, A
  if (playerTotal === 10) {
    if (dVal >= 2 && dVal <= 9) {
      return {
        action: 'D',
        category: 'hard',
        explanation: buildExplanation(
          'D',
          `Dobrar (Double) com 10 vs ${dealerRank}`,
          `Você tem vantagem líquida expressiva com 10 contra cartas menores que 10. Você tem quase 1/3 de chance de bater 20.`,
          'Aproveite a vantagem e dobre a aposta.',
          DEALER_BUST_ODDS[dealerRank],
          'Se dobrar não for permitido, peça carta (Hit).'
        ),
      };
    }
    return {
      action: 'H',
      category: 'hard',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com 10 vs ${dealerRank}`,
        `Contra 10 ou Ás, o dealer tem tanta probabilidade de fazer 20 ou 21 quanto você. Dobrar o seu dinheiro aumentaria a volatilidade sem vantagem matemática.`,
        'Peça carta no seu 10 normalmente.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 9 Rígido:
  // Dobra contra 3 a 6; senão Pedir
  if (playerTotal === 9) {
    if (dVal >= 3 && dVal <= 6) {
      return {
        action: 'D',
        category: 'hard',
        explanation: buildExplanation(
          'D',
          `Dobrar (Double) com 9 vs ${dealerRank}`,
          `Contra cartas fracas do dealer (3, 4, 5, 6), um total de 9 oferece excelente taxa de conversão em 19 com uma única carta alta.`,
          `Combinado com a taxa de busto do dealer (${DEALER_BUST_ODDS[dealerRank]}), dobrar o 9 rende EV positivo a longo prazo.`,
          DEALER_BUST_ODDS[dealerRank],
          'Se dobrar não for permitido, peça carta (Hit).'
        ),
      };
    }
    return {
      action: 'H',
      category: 'hard',
      explanation: buildExplanation(
        'H',
        `Pedir Carta (Hit) com 9 vs ${dealerRank}`,
        'Contra 2 ou contra cartas 7+, a vantagem não é suficiente para dobrar. Peça mais cartas para construir sua mão.',
        'Manter a aposta simples protege seu capital.',
        DEALER_BUST_ODDS[dealerRank]
      ),
    };
  }

  // 5 a 8 Rígido: Sempre Pedir Carta (Hit)
  return {
    action: 'H',
    category: 'hard',
    explanation: buildExplanation(
      'H',
      `Pedir Carta (Hit) com ${playerTotal} Rígido vs ${dealerRank}`,
      `Com pontuação de ${playerTotal}, você é 100% imune a estourar na primeira carta (a maior carta é 10, totalizando no máximo 18).`,
      'Peça carta para elevar a pontuação a níveis competitivos.',
      DEALER_BUST_ODDS[dealerRank]
    ),
  };
}

export function rankToValue(rank: CardRank): number {
  if (rank === 'A') return 11;
  if (rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10') return 10;
  return parseInt(rank, 10);
}

function buildExplanation(
  action: Action,
  title: string,
  ruleExplanation: string,
  mathematicalReason: string,
  dealerBustProbability: string,
  alternativeMoveTip?: string,
  cardCountingContext?: string
): ExplanationDetails {
  return {
    title,
    optimalActionName: ACTION_NAMES[action],
    ruleExplanation,
    mathematicalReason,
    dealerBustProbability,
    alternativeMoveTip,
    cardCountingContext,
  };
}
