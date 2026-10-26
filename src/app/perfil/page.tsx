'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { User } from '@/types';
import { UserCircle, Key, ShieldCheck, Mail, Building, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('nexo_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(saved));
  }, []);

  const handleResetPassword = () => {
    setResetSent(true);
    setTimeout(() => setResetSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-desk flex flex-col">
      <Navbar currentUser={currentUser} />

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-10 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-3">
          <span>Service desk de TI</span>
          <span>&rsaquo;</span>
          <span className="font-semibold text-ink">Meu perfil</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-ink">Meu perfil</h1>
          <p className="text-xs text-ink-3 mt-1">Seus dados de acesso ao service desk de TI.</p>
        </div>

        {/* User Identity Card */}
        <div className="bg-white p-6 rounded-2xl border border-rule shadow-xs space-y-5">
          <div className="flex items-center gap-4 pb-5 border-b border-rule">
            <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-bold text-lg flex items-center justify-center">
              {currentUser?.initials || 'AS'}
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">{currentUser?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary-text text-[11px] font-semibold">
                  {currentUser?.department}
                </span>
                <span className="text-xs text-ink-3">· Nexo Corporativo</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-ink-3 block mb-1">Nome completo</span>
              <span className="font-semibold text-ink text-sm">{currentUser?.name}</span>
            </div>

            <div>
              <span className="text-ink-3 block mb-1">E-mail corporativo</span>
              <span className="font-semibold text-ink text-sm">{currentUser?.email}</span>
              <span className="text-[10px] text-ink-3 block mt-0.5">Gerenciado pelo Azure AD / TI</span>
            </div>

            <div>
              <span className="text-ink-3 block mb-1">Departamento</span>
              <span className="font-semibold text-ink">{currentUser?.department}</span>
            </div>

            <div>
              <span className="text-ink-3 block mb-1">Privilégio de Acesso</span>
              <span className="font-semibold text-ink">
                {currentUser?.role === 'analyst' ? 'Analista N1/N2' : 'Funcionário Solicitante'}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Password Card */}
        <div className="bg-white p-6 rounded-2xl border border-rule shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink text-sm">Senha de Rede</h3>
              <p className="text-xs text-ink-3 mt-0.5">Alterada há 42 dias · expira em 48 dias</p>
            </div>
            <button
              onClick={handleResetPassword}
              className="px-3.5 py-1.5 rounded-lg bg-desk hover:bg-slate-200/80 border border-rule text-xs font-semibold text-ink transition-colors cursor-pointer"
            >
              Redefinir senha
            </button>
          </div>

          {resetSent ? (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Link de redefinição enviado com sucesso para {currentUser?.email}.</span>
            </div>
          ) : (
            <p className="text-xs text-ink-3">
              Enviaremos um link de redefinição seguro para {currentUser?.email}.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
