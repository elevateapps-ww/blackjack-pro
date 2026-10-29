import confetti from 'canvas-confetti';

export function fireMilestoneConfetti(streak: number) {
  if (typeof window === 'undefined') return;

  // Confete dourado e verde esmeralda estilo Vegas
  const colors = ['#f59e0b', '#10b981', '#fbbf24', '#34d399', '#ffffff'];

  try {
    confetti({
      particleCount: streak >= 100 ? 120 : 60,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      disableForReducedMotion: true,
    });
  } catch {
    // Ignore if canvas is unavailable
  }
}
