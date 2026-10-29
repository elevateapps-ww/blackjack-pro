import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blackjack Apex Pro - Simulador & Treinador de Fixação Mental',
  description: 'Treine todas as mãos, regras e variações de Blackjack do mundo até atingir precisão matemática absoluta (Basic Strategy & Illustrious 18).',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>♠️</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
