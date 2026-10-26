'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/types';
import { Bot, Headphones, UserCircle, LogOut } from 'lucide-react';

interface NavbarProps {
  currentUser?: User | null;
  onSwitchUser?: (email: string) => void;
}

export function Navbar({ currentUser, onSwitchUser }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('nexo_user');
    router.push('/login');
  };

  return (
    <header className="h-14 border-b border-rule bg-white px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path
              d="M21.763 0.245l-3.374 1.687c-.623.308-.973.903-.973 1.631v6.293L6.223.427C5.6-.042 4.851-.126 4.193.182L1.008 1.813C.357 2.135 0 2.737 0 3.486v15.218c0 1.477 1.526 2.289 2.716 1.785l3.073-1.617c.693-.322 1.057-.952 1.057-1.722v-7.7l11.732 10.591c.602.546 1.421.679 2.086.364l2.786-1.505c.602-.315.938-.931.938-1.68V3.628c0-1.463-1.505-2.275-2.625-1.687z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div>
          <span className="font-semibold text-ink text-[15px] tracking-tight">Nexo Assist</span>
          <span className="text-[11px] text-ink-3 ml-2 hidden sm:inline-block">Service Desk de TI</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-desk p-1 rounded-lg border border-rule">
        <Link
          href="/chat"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            pathname === '/chat' || pathname === '/'
              ? 'bg-white text-ink shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-white/50'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-primary" />
          Atendimento
        </Link>
        <Link
          href="/console"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            pathname.startsWith('/console')
              ? 'bg-white text-ink shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-white/50'
          }`}
        >
          <Headphones className="w-3.5 h-3.5 text-cta" />
          Console do Analista
          <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.2 rounded-full">
            N1/N2
          </span>
        </Link>
        <Link
          href="/perfil"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            pathname === '/perfil'
              ? 'bg-white text-ink shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-white/50'
          }`}
        >
          <UserCircle className="w-3.5 h-3.5" />
          Meu perfil
        </Link>
      </nav>

      {/* Current User */}
      <div className="flex items-center gap-3">
        {currentUser ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-medium text-xs flex items-center justify-center tracking-wider">
              {currentUser.initials}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-ink leading-tight">{currentUser.name}</div>
              <div className="text-[11px] text-ink-3 leading-tight">{currentUser.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair da sessão"
              className="p-1.5 text-ink-3 hover:text-danger rounded-md hover:bg-slate-100 ml-1 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-medium px-3 py-1.5 bg-ink text-white rounded-md hover:bg-ink-2"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
