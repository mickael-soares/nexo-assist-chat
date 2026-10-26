'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { User, Conversation, Ticket } from '@/types';
import {
  Headphones,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Send,
  UserCheck,
  RotateCcw,
  Check,
  ChevronRight,
  FileText,
  ShieldAlert,
} from 'lucide-react';

export default function AnalystConsolePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [filterTab, setFilterTab] = useState<'Todas' | 'Para você' | 'Com o agent' | 'Minhas'>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const analystUser: User = {
    id: 'u-8',
    email: 'rafael.lima@nexo.com.br',
    name: 'Rafael Lima',
    department: 'Suporte N2',
    initials: 'RL',
    role: 'analyst',
    isOnline: true,
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      if (res.ok && data.conversations) {
        setConversations(data.conversations);
        if (!selectedConv && data.conversations.length > 0) {
          // Seleciona a conversa da Ana Souza por padrão
          const ana = data.conversations.find((c: Conversation) => c.userId.includes('ana.souza'));
          setSelectedConv(ana || data.conversations[0]);
        } else if (selectedConv) {
          const fresh = data.conversations.find((c: Conversation) => c.id === selectedConv.id);
          if (fresh) setSelectedConv(fresh);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar conversas do console:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000); // Polling leve a cada 4s
    return () => clearInterval(interval);
  }, []);

  const handleAnalystAction = async (action: 'takeover' | 'return_to_agent' | 'close' | 'send_message') => {
    if (!selectedConv) return;
    setLoading(true);

    try {
      const res = await fetch('/api/analyst/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          conversationId: selectedConv.id,
          analystEmail: analystUser.email,
          analystName: analystUser.name,
          messageText: action === 'send_message' ? replyText : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.conversation) {
        setSelectedConv(data.conversation);
        setReplyText('');
        loadData();
      }
    } catch (err) {
      console.error('Erro na ação do analista:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtros de conversas
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.activeTicketId && c.activeTicketId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'Para você') {
      return c.status === 'waiting_attendant';
    }
    if (filterTab === 'Com o agent') {
      return c.status === 'with_agent';
    }
    if (filterTab === 'Minhas') {
      return c.status === 'with_analyst' && c.analystId === analystUser.email;
    }
    return true;
  });

  const isAssumedByMe =
    selectedConv?.status === 'with_analyst' && selectedConv.analystId === analystUser.email;

  return (
    <div className="min-h-screen bg-desk flex flex-col">
      <Navbar currentUser={analystUser} />

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Conversations List */}
        <aside className="w-80 md:w-96 bg-white border-r border-rule flex flex-col shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-rule space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink text-sm">Conversas</span>
                <span className="px-2 py-0.2 rounded-full bg-slate-100 text-ink-2 font-mono text-xs font-semibold">
                  {conversations.length}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Disponível
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-3" />
              <input
                type="text"
                placeholder="Pesquisar conversa ou chamado"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-rule bg-desk/50 focus:outline-none focus:border-primary text-ink"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 border-b border-rule pb-1 text-xs">
              {(['Todas', 'Para você', 'Com o agent', 'Minhas'] as const).map((tab) => {
                const count =
                  tab === 'Para você'
                    ? conversations.filter((c) => c.status === 'waiting_attendant').length
                    : tab === 'Com o agent'
                    ? conversations.filter((c) => c.status === 'with_agent').length
                    : tab === 'Minhas'
                    ? conversations.filter((c) => c.status === 'with_analyst').length
                    : conversations.length;

                return (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      filterTab === tab
                        ? 'bg-ink text-white'
                        : 'text-ink-3 hover:text-ink hover:bg-desk'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className="text-[10px] opacity-80">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-rule/60">
            {filteredConversations.map((c) => {
              const isSelected = selectedConv?.id === c.id;
              const lastMsg = c.messages[c.messages.length - 1];

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConv(c)}
                  className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                    isSelected ? 'bg-blue-50/70 border-l-3 border-l-primary' : 'hover:bg-desk/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-medium text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {c.userName
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-ink text-xs truncate">{c.userName}</span>
                      <span className="text-[10px] text-ink-3">{lastMsg?.timestamp || '10:05'}</span>
                    </div>

                    <p className="text-[11px] text-ink-3 truncate mb-1.5">
                      {lastMsg?.content || 'Iniciando atendimento…'}
                    </p>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {c.status === 'with_analyst' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Você está atendendo
                        </span>
                      )}
                      {c.status === 'waiting_attendant' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          Transferida · na fila
                        </span>
                      )}
                      {c.status === 'with_agent' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-primary-text border border-blue-200">
                          Agent atendendo ({c.confidenceScore}%)
                        </span>
                      )}
                      {c.status === 'resolved' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          Resolvida pelo agent
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Column 2: Active Chat View */}
        <main className="flex-1 bg-desk flex flex-col overflow-hidden border-r border-rule">
          {selectedConv ? (
            <>
              {/* Top Banner */}
              <div className="p-4 bg-white border-b border-rule flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-ink text-sm">{selectedConv.userName}</h3>
                    <span className="text-[11px] text-ink-3">· {selectedConv.userDepartment}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[11px] text-ink-3 mt-0.5">
                    {selectedConv.handoverSummary || 'Conversa do Service Desk Nexo'}
                  </p>
                </div>

                {/* Analyst Actions */}
                <div className="flex items-center gap-2">
                  {selectedConv.status === 'waiting_attendant' && (
                    <button
                      onClick={() => handleAnalystAction('takeover')}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-cta hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Assumir atendimento</span>
                    </button>
                  )}

                  {selectedConv.status === 'with_analyst' && (
                    <>
                      <button
                        onClick={() => handleAnalystAction('return_to_agent')}
                        disabled={loading}
                        className="px-3 py-1.5 bg-white border border-rule hover:bg-desk text-ink-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-primary" />
                        <span>Devolver ao agent</span>
                      </button>
                      <button
                        onClick={() => handleAnalystAction('close')}
                        disabled={loading}
                        className="px-3 py-1.5 bg-white border border-rule hover:bg-red-50 text-danger text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Encerrar atendimento</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Timeline */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {selectedConv.messages.map((m) => {
                  const isUser = m.sender === 'user';
                  const isSys = m.sender === 'system';
                  const isAnalyst = m.sender === 'analyst';

                  if (isSys) {
                    return (
                      <div key={m.id} className="text-center my-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-desk border border-rule text-[11px] text-ink-3 font-mono">
                          {m.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="font-semibold text-[11px] text-ink">
                          {isUser
                            ? selectedConv.userName
                            : isAnalyst
                            ? `${m.senderName || 'Rafael Lima'} (Suporte N2)`
                            : 'Nexo Assist (IA)'}
                        </span>
                        <span className="text-[10px] text-ink-3">{m.timestamp}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs md:text-[13px] max-w-lg leading-relaxed ${
                          isUser
                            ? 'bg-white border border-rule text-ink shadow-2xs'
                            : isAnalyst
                            ? 'bg-amber-50 border border-amber-200 text-amber-950 shadow-2xs'
                            : 'bg-white/80 border border-rule text-ink-2'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Analyst Input Bar */}
              <div className="p-4 bg-white border-t border-rule">
                {selectedConv.status === 'with_analyst' ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (replyText.trim()) handleAnalystAction('send_message');
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Escreva sua mensagem como ${analystUser.name}…`}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-rule focus:outline-none focus:border-primary text-ink"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || loading}
                      className="px-4 py-2 bg-cta hover:bg-primary-hover disabled:opacity-40 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Responder</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="p-2.5 rounded-lg bg-desk text-center text-xs text-ink-3 border border-rule">
                    Assuma o atendimento para enviar mensagens nesta conversa e pausar o Nexo Assist.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-ink-3">
              Selecione uma conversa ao lado para visualizar os detalhes.
            </div>
          )}
        </main>

        {/* Column 3: Customer Ticket Panel (Frame 4 / 5) */}
        <aside className="w-80 bg-white p-5 overflow-y-auto hidden xl:block shrink-0 space-y-5">
          <div>
            <h4 className="font-bold text-ink text-sm">Chamados da {selectedConv?.userName.split(' ')[0] || 'Cliente'}</h4>
            <span className="text-[11px] text-ink-3">3 abertos · 2 encerrados</span>
          </div>

          {/* Desta conversa */}
          <div>
            <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider block mb-2">
              Desta conversa
            </span>
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-primary">INC-20311</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                  {selectedConv?.status === 'with_analyst' ? 'Em atendimento' : 'Aguardando analista'}
                </span>
              </div>
              <h5 className="font-semibold text-ink text-xs leading-snug">
                Notebook lento após atualização
              </h5>
              <div className="text-[11px] text-ink-3">Hardware · prioridade média</div>
              <div className="pt-2 border-t border-blue-200/60 text-[10px] text-ink-2 flex items-center justify-between">
                <span>
                  {selectedConv?.status === 'with_analyst'
                    ? 'Assumido por Rafael Lima'
                    : 'Transferido para analista'}
                </span>
                <span className="font-mono">10:05</span>
              </div>
            </div>
          </div>

          {/* Outros chamados */}
          <div>
            <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider block mb-2">
              Outros chamados
            </span>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-rule bg-white hover:border-rule/80">
                <div className="font-semibold text-ink text-xs">Acesso à pasta Financeiro</div>
                <div className="text-[11px] text-ink-3 mt-0.5">INC-20298 · Em andamento</div>
              </div>

              <div className="p-3 rounded-lg border border-rule bg-white hover:border-rule/80">
                <div className="font-semibold text-ink text-xs">Segundo monitor para home office</div>
                <div className="text-[11px] text-ink-3 mt-0.5">REQ-10442 · Aprovado</div>
              </div>

              <div className="p-3 rounded-lg border border-rule bg-white hover:border-rule/80">
                <div className="font-semibold text-ink text-xs">Outlook não sincroniza no celular</div>
                <div className="text-[11px] text-ink-3 mt-0.5">INC-19877 · Resolvido em 02 set</div>
              </div>

              <div className="p-3 rounded-lg border border-rule bg-white hover:border-rule/80">
                <div className="font-semibold text-ink text-xs">Troca de senha da rede</div>
                <div className="text-[11px] text-ink-3 mt-0.5">INC-19410 · Resolvido em 11 jul</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Lista completa de chamados históricos da colaboradora.')}
            className="w-full py-2 bg-desk hover:bg-slate-200/70 border border-rule text-ink text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Ver todos os chamados da Ana
          </button>
        </aside>
      </div>
    </div>
  );
}
