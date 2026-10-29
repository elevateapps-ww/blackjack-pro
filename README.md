# ♠️ Blackjack Apex Pro - Simulador & Treinador de Fixação Mental

> Domine 100% da teoria matemática mundial de Blackjack, estratégias básicas, variações de mesa e índices de desvios (Illustrious 18 de Don Schlesinger) sem necessidade de login.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Felevateapps-ww%2Fblackjack-pro)

---

## 🎯 Objetivo & Filosofia de Treino

Este aplicativo foi construído especificamente para **fixação mental de nível profissional** através de repetição acelerada e explicação matemática instantânea de Expected Value (EV):

1. **Sem Login / Sem Fricção**: Seu progresso, histórico de erros e estatísticas são salvos instantaneamente no armazenamento local (`localStorage`) do navegador.
2. **Ciclo de Fixação Rápido**:
   - **Se acertar**: Som de confirmação em frequência pura, flash visual verde e avanço automático instantâneo (220ms).
   - **Se errar**: O app pausa e exibe a explicação aprofundada: o que você escolheu, o que a matemática determina, a probabilidade exata de busto do dealer e o motivo pelo qual aquela jogada conserva ou maximiza sua banca.
   - **Avanço Rápido no Erro**: Basta pressionar **`ENTER`** ou a **`BARRA DE ESPAÇO`** e o app já carrega a próxima mão!
3. **Fila Inteligente de Erros (Spaced Repetition)**: Toda mão errada é imediatamente re-enfileirada na fila de revisão para reaparecer até você dominá-la com 100% de precisão!
4. **Metas de Treino Flexíveis**:
   - Contador dinâmico: `Mão 1 de 5.000` (ajustável para 500, 1.000, 2.500, 5.000, 10.000 ou infinito).
   - Streak em tempo real com comemorações e confetes em marcos (10, 25, 50, 100, 500, etc.).

---

## ⌨️ Controles e Atalhos de Teclado Ultra-Rápidos

| Tecla | Ação |
| :--- | :--- |
| **`H`** | **Pedir Carta (Hit)** |
| **`S`** | **Parar (Stand)** |
| **`D`** | **Dobrar (Double)** |
| **`P`** ou **`Y`** ou **`V`** | **Dividir Par (Split)** |
| **`R`** | **Render-se (Surrender)** |
| **`ENTER`** ou **`ESPAÇO`** | **Avançar para a próxima mão** (quando a explicação estiver na tela) |
| **`C`** | **Abrir/Fechar a Tabela de Estratégia Básica Interativa** |
| **`ESC`** | **Fechar qualquer janela/modal** |

---

## 🧠 Modos de Treinamento

- ⚡ **Todas as Mãos (Mundial Completo)**: Combinação ponderada de todas as situações possíveis.
- 🧱 **Apenas Mãos Rígidas (Hard Totals)**: Decisões críticas de 12 a 16 (stiff hands) contra dealer 2 a A.
- 🃏 **Apenas Mãos Suaves (Soft Totals)**: Mãos com Ás (A,2 a A,9) e janelas perfeitas de dobro.
- ✂️ **Apenas Pares (Pair Splitting)**: Divisões de 2,2 até A,A com regras DAS.
- 🏳️ **Apenas Rendição (Surrender)**: 15 e 16 vs 9, 10 e Ás.
- 🧠 **Contagem de Cartas & Desvios (Illustrious 18 & Fab 4)**: True Count e índices matemáticos de Don Schlesinger.
- 🔁 **Fila de Erros**: Pratique exclusivamente as mãos que você já errou até zerar a fila!

---

## 🎰 Variações de Regras Suportadas

- **Dealer no 17 Suave**: S17 (Dealer Stands no A,6) vs H17 (Dealer Hits no A,6).
- **Double After Split (DAS)**: Permitido vs Proibido.
- **Rendição**: Late Surrender vs Sem Rendição.
- **Baralhos**: 1 Deck, 2 Decks, 6 Decks (Shoe padrão Vegas), 8 Decks.

---

## 🚀 Como Subir no Vercel (100% Gratuito)

### Opção 1: Pelo Navegador (Mais Rápido - 1 Clique)
1. Acesse o botão acima ou clique em: [Deploy no Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Felevateapps-ww%2Fblackjack-pro)
2. Conecte sua conta do GitHub/Vercel e clique em **Deploy**.
3. Em menos de 1 minuto seu link `.vercel.app` estará ativo para você treinar no computador ou celular!

### Opção 2: Pelo Terminal Local (Vercel CLI)
```bash
cd blackjack-pro
npx vercel
```
Pressione `Enter` para as configurações padrão e o deploy será concluído instantaneamente.

---

## 🛠️ Tecnologias Utilizadas

- **Next.js 14 (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **Lucide Icons**
- **Web Audio API** (Sons sintetizados nativos com latência zero e sem dependências de mp3 externo)
- **Canvas Confetti**
