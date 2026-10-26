import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nexo Assist · Service Desk de TI',
  description: 'O agent de atendimento inteligente do service desk da Nexo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-desk text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
