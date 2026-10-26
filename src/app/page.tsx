'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('nexo_user');
    if (saved) {
      router.push('/chat');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-desk flex items-center justify-center">
      <div className="text-xs text-ink-3">Carregando Nexo Assist…</div>
    </div>
  );
}
