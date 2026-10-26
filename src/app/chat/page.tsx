'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { StepsBadge } from '@/components/chat/StepsBadge';
import { DecisionDrawer } from '@/components/chat/DecisionDrawer';
import { DraftCard } from '@/components/chat/DraftCard';
import { TicketCard } from '@/components/chat/TicketCard';
import { TicketListCard } from '@/components/chat/TicketListCard';
import { QuickChips } from '@/components/chat/QuickChips';
import { User, Conversation, ChatMessage, Ticket, DecisionDetail } from '@/types';
import { Bot, Send, ShieldAlert, Sparkles, AlertCircle, Headphones } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<{
    decision?: DecisionDetail;
    steps?: string[];
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carrega usuário autenticado
  useEffect(() => {
    const saved = localStorage.getItem('nexo_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(saved) as User;
    setCurrentUser(user);
    loadConversation(user.email);
  }, []);

  const loadConversation = async (email: string) => {
    try {
      const res = await fetch(`/api/chat?userEmail=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data.conversation) {
        setConversation(data.conversation);
      }
    } catch (err) {
      console.error('Erro ao carregar conversa:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || !currentUser || loading) return;

    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation?.id,
          userEmail: currentUser.email,
          message: text,
        }),
      });

      const data = await res.json();
      if (res.ok && data.updatedConversation) {
        setConversation(data.updatedConversation);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDraft = () => {
    handleSendMessage('Confirmar');
  };

  const isAgentPaused =
    conversation?.status === 'waiting_attendant' || conversation?.status === 'with_analyst';

  return (
    <div className="min-h-screen bg-desk flex flex-col">
      <Navbar currentUser={currentUser} />

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col">
        {/* Breadcrumb & Agent Status Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-rule mb-4">
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <span>Service desk de TI</span>
            <span>&rsaquo;</span>
            <span className="font-semibold text-ink">Atendimento</span>
          </div>

          <div className="flex items-center gap-2">
            {isAgentPaused ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                <Headphones className="w-3 h-3 text-amber-700" />
                <span>Aguardando analista · Agent pausado</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Assistente online</span>
              </span>
            )}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 bg-white rounded-2xl border border-rule shadow-xs p-4 md:p-6 overflow-y-auto space-y-5">
          {(!conversation?.messages || conversation.messages.length === 0) && (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-ink text-base">Olá, {currentUser?.name.split(' ')[0]}!</h3>
              <p className="text-xs text-ink-3 max-w-md mx-auto leading-relaxed">
                Descreva o que está acontecendo ou consulte seus chamados existentes. Eu posso resolver dúvidas pela central de ajuda ou abrir um chamado para você.
              </p>

              {/* Fast Example Prompts */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={() =>
                    handleSendMessage('Meu notebook não conecta na VPN desde ontem. Aparece o erro 809.')
                  }
                  className="px-3 py-1.5 rounded-lg bg-desk hover:bg-blue-50/70 border border-rule text-xs text-ink-2 font-medium transition-colors"
                >
                  VPN erro 809 no notebook
                </button>
                <button
                  onClick={() => handleSendMessage('Qual o status do meu chamado?')}
                  className="px-3 py-1.5 rounded-lg bg-desk hover:bg-blue-50/70 border border-rule text-xs text-ink-2 font-medium transition-colors"
                >
                  Consultar meus chamados
                </button>
                <button
                  onClick={() => handleSendMessage('Quero falar com um analista.')}
                  className="px-3 py-1.5 rounded-lg bg-desk hover:bg-blue-50/70 border border-rule text-xs text-ink-2 font-medium transition-colors"
                >
                  Falar com um analista
                </button>
              </div>
            </div>
          )}

          {conversation?.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';
            const isAnalyst = msg.sender === 'analyst';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-3">
                  <span className="inline-block px-3 py-1 rounded-full bg-desk border border-rule text-[11px] text-ink-3 font-medium">
                    {msg.content}
                  </span>
                </div>
              );
            }

            if (isUser) {
              return (
                <div key={msg.id} className="flex flex-col items-end">
                  <div className="bg-desk text-ink font-medium px-4 py-2.5 rounded-2xl rounded-tr-xs text-xs md:text-[13px] max-w-[85%] border border-rule shadow-2xs leading-relaxed">
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-ink-3 mt-1 mr-1">{msg.timestamp}</span>
                </div>
              );
            }

            // Agent or Analyst Message
            return (
              <div key={msg.id} className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold ${
                    isAnalyst
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {isAnalyst ? <Headphones className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Steps Badge & Decision Inspector Trigger */}
                  {!isAnalyst && (
                    <StepsBadge
                      steps={msg.steps}
                      decision={msg.decisionDetail}
                      onInspect={() =>
                        setSelectedDecision({
                          decision: msg.decisionDetail,
                          steps: msg.steps,
                        })
                      }
                    />
                  )}

                  {/* Message Bubble */}
                  <div className="bg-desk/60 text-ink px-4 py-3 rounded-2xl rounded-tl-xs text-xs md:text-[13px] max-w-xl border border-rule/70 leading-relaxed space-y-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-[11px] text-ink">
                        {isAnalyst ? msg.senderName || 'Analista' : 'Nexo Assist'}
                      </span>
                      <span className="text-[10px] text-ink-3">{msg.timestamp}</span>
                    </div>

                    <p className="whitespace-pre-line text-ink-2">{msg.content}</p>

                    {/* Quick Options Chips */}
                    {msg.cardType === 'quick_options' && msg.cardData && (
                      <QuickChips
                        question={msg.cardData.question}
                        options={msg.cardData.options}
                        onSelect={(val) => handleSendMessage(val)}
                      />
                    )}

                    {/* Draft Card */}
                    {msg.cardType === 'draft' && msg.cardData && (
                      <DraftCard draft={msg.cardData} onConfirm={handleConfirmDraft} />
                    )}

                    {/* Ticket List Cards */}
                    {msg.cardType === 'ticket_list' && msg.cardData && (
                      <TicketListCard
                        tickets={[
                          {
                            id: 'INC-20311',
                            type: 'INC',
                            title: 'Notebook lento após atualização do Windows',
                            description: 'Lentidão geral após update',
                            category: 'Hardware',
                            priority: 'Média',
                            status: 'Aguardando analista',
                            affectedScope: 'Somente você',
                            openedBy: currentUser?.email || '',
                            openedAt: '2026-10-16',
                            updatedAt: '2026-10-21',
                            dueAt: '2026-10-21',
                            isOverdue: true,
                            history: [],
                          },
                          {
                            id: 'INC-20298',
                            type: 'INC',
                            title: 'Acesso à pasta Financeiro no SharePoint',
                            description: 'Permissão necessária',
                            category: 'Acesso',
                            priority: 'Média',
                            status: 'Em andamento',
                            affectedScope: 'Somente você',
                            openedBy: currentUser?.email || '',
                            openedAt: '2026-10-14',
                            updatedAt: '2026-10-18',
                            dueAt: '2026-10-17',
                            isOverdue: true,
                            history: [],
                          },
                          {
                            id: 'REQ-10442',
                            type: 'REQ',
                            title: 'Segundo monitor para home office',
                            description: 'Monitor adicional',
                            category: 'Hardware',
                            priority: 'Baixa',
                            status: 'Aprovado',
                            affectedScope: 'Somente você',
                            openedBy: currentUser?.email || '',
                            openedAt: '2026-10-09',
                            updatedAt: '2026-10-15',
                            dueAt: '2026-10-16',
                            isOverdue: false,
                            history: [],
                          },
                        ]}
                        onSelectTicket={(t) =>
                          handleSendMessage(`${t.id} · ${t.title}`)
                        }
                      />
                    )}

                    {/* Ticket Detail Card */}
                    {msg.cardType === 'ticket_detail' && msg.cardData && (
                      <TicketCard
                        ticket={{
                          id: msg.cardData.ticketId || 'INC-20311',
                          type: 'INC',
                          title: 'Notebook lento após atualização do Windows',
                          description:
                            'Lentidão geral desde a atualização de 15/10. Reiniciar e rodar o diagnóstico da central não resolveu.',
                          category: 'Hardware',
                          priority: 'Média',
                          status: 'Aguardando analista',
                          affectedScope: 'Somente você',
                          openedBy: currentUser?.email || '',
                          openedAt: '16 out, 14:20',
                          updatedAt: 'há 5 dias',
                          dueAt: 'há 2 dias',
                          isOverdue: true,
                          history: [],
                        }}
                        onActionClick={(action) => handleSendMessage(action)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-desk/60 px-4 py-2.5 rounded-2xl rounded-tl-xs text-xs text-ink-3">
                Pensando e consultando base do service desk…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Message Counter Footer */}
        <div className="mt-4 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-rule shadow-xs focus-within:border-primary transition-colors"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                isAgentPaused
                  ? 'Atendimento transferido ao analista. Você pode enviar mensagens que serão lidas por ele.'
                  : 'Escreva para o Nexo…'
              }
              className="flex-1 px-3 py-2 text-xs md:text-sm bg-transparent focus:outline-none text-ink placeholder:text-ink-3"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="px-4 py-2 bg-cta hover:bg-primary-hover disabled:opacity-40 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Enviar</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Session Limit Counter (PRD: Limite de 30 mensagens por sessão) */}
          <div className="flex items-center justify-between text-[11px] text-ink-3 px-2">
            <span>
              {conversation?.status === 'waiting_attendant'
                ? 'Sua conversa está na fila do Suporte N2.'
                : conversation?.status === 'with_analyst'
                ? 'Analista assumiu o atendimento.'
                : 'Respostas com base nas regras do Service Desk Nexo.'}
            </span>
            <span className="font-mono">
              {conversation?.messageCount || 0}/30 mensagens nesta sessão
            </span>
          </div>
        </div>
      </div>

      {/* Decision Detail Drawer / Side Panel */}
      <DecisionDrawer
        isOpen={!!selectedDecision}
        onClose={() => setSelectedDecision(null)}
        decision={selectedDecision?.decision}
        steps={selectedDecision?.steps}
      />
    </div>
  );
}
