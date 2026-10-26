'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Shield, CheckCircle, ArrowRight, Zap, Users, PhoneCall } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ana.souza@nexo.com.br');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (loginEmail?: string) => {
    const targetEmail = loginEmail || email;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autenticar');
      }

      localStorage.setItem('nexo_user', JSON.stringify(data.user));

      if (data.user.role === 'analyst') {
        router.push('/console');
      } else {
        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-desk flex flex-col justify-between">
      {/* Top Bar */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-rule bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path
                d="M21.763 0.245l-3.374 1.687c-.623.308-.973.903-.973 1.631v6.293L6.223.427C5.6-.042 4.851-.126 4.193.182L1.008 1.813C.357 2.135 0 2.737 0 3.486v15.218c0 1.477 1.526 2.289 2.716 1.785l3.073-1.617c.693-.322 1.057-.952 1.057-1.722v-7.7l11.732 10.591c.602.546 1.421.679 2.086.364l2.786-1.505c.602-.315.938-.931.938-1.68V3.628c0-1.463-1.505-2.275-2.625-1.687z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-ink text-base">Nexo Assist</span>
            <span className="text-xs text-ink-3 ml-2">Service desk de TI</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-3">
          <PhoneCall className="w-3.5 h-3.5 text-ink-2" />
          <span>Problema para entrar? Ligue no ramal <strong>4000</strong></span>
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left: Showcase */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary-text font-medium text-xs">
            Service desk de TI da Nexo
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight leading-tight">
            Seu problema de TI, resolvido em uma conversa.
          </h1>
          <p className="text-ink-2 text-sm md:text-base leading-relaxed max-w-xl">
            Descreva o que está acontecendo. O assistente consulta seus chamados, busca na central de ajuda e chama um analista quando precisa.
          </p>

          {/* Interactive Chat Mock Card from Prototype */}
          <div className="p-4 rounded-2xl bg-white border border-rule shadow-sm space-y-3 max-w-md">
            <div className="flex justify-end">
              <div className="bg-desk px-3 py-2 rounded-xl text-xs text-ink max-w-[85%] font-medium">
                Meu notebook não conecta na VPN. Erro 809.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] text-ink-3 font-medium flex items-center gap-1">
                  <span>consultou seus chamados</span>
                  <span>·</span>
                  <span>criou um chamado</span>
                </div>
                <div className="bg-desk p-2.5 rounded-xl text-xs text-ink leading-relaxed">
                  Pronto: abri o chamado com prioridade alta. Um analista fala com você em até 4 h úteis.
                </div>
                <div className="p-2 rounded-lg border border-rule bg-white flex items-center justify-between text-[11px]">
                  <span className="font-mono font-semibold text-primary">INC-20517</span>
                  <span className="text-ink-3">Rede e VPN · Alta · em até 4 h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 max-w-md">
            <div className="p-3 rounded-xl bg-white border border-rule">
              <div className="text-xl font-bold text-ink">8 s</div>
              <div className="text-[11px] text-ink-3 mt-0.5">primeira resposta, em média</div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-rule">
              <div className="text-xl font-bold text-ink">72%</div>
              <div className="text-[11px] text-ink-3 mt-0.5">resolvidos sem fila</div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-rule">
              <div className="text-xl font-bold text-ink">6</div>
              <div className="text-[11px] text-ink-3 mt-0.5">analistas online agora</div>
            </div>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="lg:col-span-5 bg-white p-7 md:p-8 rounded-2xl border border-rule shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-ink">Entrar</h2>
            <p className="text-xs text-ink-3 mt-1">Use seu e-mail corporativo e a senha da rede Nexo.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-danger font-medium">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">E-mail corporativo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome.sobrenome@nexo.com.br"
                className="w-full px-3.5 py-2.5 rounded-lg border border-rule focus:outline-none focus:border-primary text-xs bg-desk/50 text-ink"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-ink">Senha</label>
                <a href="#reset" className="text-[11px] text-primary hover:underline">
                  Esqueci minha senha
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-rule focus:outline-none focus:border-primary text-xs bg-desk/50 text-ink"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                defaultChecked
                className="rounded border-rule text-primary focus:ring-primary"
              />
              <label htmlFor="remember" className="text-xs text-ink-2 cursor-pointer">
                Manter conectado neste computador
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cta hover:bg-primary-hover text-white font-medium rounded-lg text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Entrando...' : 'Entrar'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Demo User Fast Presets */}
          <div className="pt-4 border-t border-rule">
            <span className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-2">
              Perfis de Demonstração (Clique para entrar):
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('ana.souza@nexo.com.br');
                  handleLogin('ana.souza@nexo.com.br');
                }}
                className="w-full text-left p-2 rounded-lg bg-desk hover:bg-blue-50/60 border border-rule text-xs flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-semibold text-ink block group-hover:text-primary">Ana Souza</span>
                  <span className="text-[11px] text-ink-3">Financeiro · 3 chamados (Cenário do Protótipo)</span>
                </div>
                <span className="text-[10px] font-medium text-primary">Entrar &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('rafael.lima@nexo.com.br');
                  handleLogin('rafael.lima@nexo.com.br');
                }}
                className="w-full text-left p-2 rounded-lg bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200 text-xs flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-semibold text-ink block group-hover:text-amber-800">Rafael Lima</span>
                  <span className="text-[11px] text-amber-800">Analista Suporte N2 · Acessar Console</span>
                </div>
                <span className="text-[10px] font-medium text-amber-800">Console &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-rule bg-white flex flex-col sm:flex-row items-center justify-between text-xs text-ink-3 gap-2">
        <span>© 2026 Nexo · Service desk de TI</span>
        <span>Privacidade e uso de dados corporativos</span>
      </footer>
    </div>
  );
}
