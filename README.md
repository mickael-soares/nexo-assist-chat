# Nexo Assist — Agente Inteligente de Service Desk & Suporte de TI

> **Aplicacao em Producao (Live Demo):** [desafio-nexo-assist-iota.vercel.app](https://desafio-nexo-assist-iota.vercel.app/chat)  
> *(Acesso direto com usuarios de demonstracao pre-configurados no login para teste imediato de todos os fluxos)*

O **Nexo Assist** e uma plataforma conversacional orientada a agentes inteligentes de IA desenhada para automatizar o Service Desk e Suporte de TI. Ele realiza triagem automatizada, consulta bases de conhecimento, abre e atualiza chamados com calculo dinamico de SLA e escalona atendimentos criticos para analistas humanos com transferencia de contexto e historico completo.

---

## Como Rodar o Projeto

### Pre-requisitos
* **Node.js**: v18+ (testado e homologado no Node v24)
* **npm** ou **yarn / pnpm**

### Passos de Instalacao e Execucao
```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Configurar chaves de ambiente
cp .env.example .env.local

# 3. Rodar a suite de testes unitarios (regras, SLA, deduplicacao e escopo)
npm test

# 4. Iniciar em ambiente de desenvolvimento
npm run dev
```

A aplicacao estara disponivel em **`http://localhost:3000`**.

> **Ambiente Demonstrativo**: A aplicacao possui um **motor deterministico integrado**, permitindo testar e avaliar **100% dos fluxos, telas, transicoes de estado e decisoes de IA sem necessidade de cadastrar chaves pagas de API de LLM**. Se desejar plugar OpenAI, Gemini ou Anthropic, basta preencher `OPENAI_API_KEY` ou `GEMINI_API_KEY` no seu `.env.local`.

---

## Visao Geral da Arquitetura

O projeto adota uma arquitetura em camadas com separacao estrita de responsabilidades:

```
src/
├── app/                        # Camada de Apresentacao (Next.js 14 App Router)
│   ├── (auth)/login/           # Tela 1: Identificacao e Metricas de Atendimento
│   ├── chat/                   # Telas 2 e 3: Chat com Rascunho, Selecao e Cards de Chamado
│   ├── console/                # Telas 4 e 5: Console de Atendimento do Analista (N1/N2)
│   ├── perfil/                 # Tela 6: Perfil do Colaborador
│   └── api/                    # Endpoints RESTful desacoplados
├── components/                 # Componentes Visuais com Fidelidade ao Layout
│   ├── chat/                   # MessageBubble, DraftCard, TicketCard, StepsBadge, QuickChips
│   ├── chat/DecisionDrawer.tsx # Drawer de Inspecao e Auditoria da Decisao (IA)
│   └── analyst/                # Abas, Filtros, Fila e Painel de Chamados do Colaborador
├── lib/
│   ├── agent/                  # Orquestrador do Agent (Mastra / Engine de Decisao)
│   │   ├── orchestrator.ts     # Ciclo de vida da mensagem, pausa de agent e handoff
│   │   └── rules.ts            # Implementacao formal das regras de negocio
│   ├── services/               # Servicos Legados Desacoplados do Agent
│   │   ├── legacy-ticket-service.ts # CRUD de chamados, calculo de SLA e simulacao de indisponibilidade
│   │   └── kb-service.ts       # Central de Ajuda (Base de Conhecimento)
│   └── db/                     # Persistencia Atomica que Sobrevive a Reinicio
│       ├── index.ts            # Gerenciador de banco persistido em disco (`data/db.json`)
│       └── seed.ts             # Dados de exemplo e catalogo inicial
└── tests/                      # Testes Automatizados com Node Test Runner
```

---

## Como o Agente Decide o que Fazer

A cada interacao do colaborador, o **Nexo Assist** executa um ciclo de decisao em 6 etapas:

1. **Checagem de Estado do Atendimento**:
   - Se o atendimento ja foi assumido por um analista humano ou esta marcado como `waiting_attendant`, **o agente e pausado imediatamente**, garantindo que nao responda indevidamente enquanto uma pessoa atende.
2. **Validacao de Limite de Sessao**:
   - Controla o limite de **30 mensagens por sessao**. Ao atingir o limite, realiza encaminhamento automatico ao analista humano.
3. **Filtro de Escopo**:
   - Se a mensagem envolver temas de RH (ferias, holerite), Financeiro (reembolso) ou Facilities (manutencao predial), o agente nao cria chamado de TI e faz o redirecionamento educado aos canais apropriados.
4. **Resolucao Sem Fila via Central de Ajuda**:
   - Busca artigos relevantes (ex: erro 809 de VPN). Se a solucao de autoatendimento for suficiente (ex: Windows 10), fornece o passo a passo. Se houver incompatibilidade de sistema (ex: Windows 11), prossegue para abertura de chamado.
5. **Classificacao Rigorosa e Prevencao de Duplicidade**:
   - **Tipo**: `INC` (falha/parou) ou `REQ` (pedido de equipamento, software ou acesso).
   - **Deduplicacao**: Verifica se o colaborador ja possui chamado aberto com o mesmo escopo. Se sim, oferece atualizar as notas ao inves de abrir chamado duplicado.
   - **Reabertura**: Chamados com status `Resolvido` ha ate 7 dias podem ser reabertos.
   - **Matriz de Prioridade e SLA**:
     - **Critica (1h - Plantao 24h)**: Equipe inteira ou empresa afetada.
     - **Alta (4h uteis)**: Impede a pessoa de trabalhar ou ha compromisso/reuniao no mesmo dia.
     - **Media (3 dias uteis)**: Atrapalha o fluxo, porem ha alternativa de trabalho.
     - **Baixa (5 dias uteis)**: Pedidos e melhorias sem urgencia.
6. **Abertura com Rascunho Obrigatorio (Confirmacao Explicita)**:
   - O agente nunca grava o chamado diretamente no banco de dados sem antes exibir o card de rascunho com categoria, tipo, SLA e impacto para que o usuario clique em **Confirmar** ou use o atalho de confirmacao.

---

## Visibilidade e Auditoria das Decisões de IA

Acima de cada resposta da IA, o usuario conta com transparencia total:
* **Badges de Acoes Executadas**: Exibe exatamente o que foi feito em tempo real (*"consultou seus chamados · buscou na central de ajuda"*).
* **Botao "Ver decisao (XX%)"**: Abre o **DecisionDrawer**, um painel lateral detalhado exibindo:
  - **Grau de Seguranca (Confianca)** com codigo visual.
  - **Intencao Identificada** pelo modelo/parser.
  - **Por que o Agente agiu assim?** (Justificativa em linguagem natural).
  - **Regras do Service Desk Acionadas**.
  - **Acao de Sistema Realizada**.
  - **Entrada Analisada e Alternativas Descartadas** (Trade-offs e decisoes evitadas).

---

## Seguranca e Privacidade de Dados

* **Isolamento de Colaborador (Multi-tenant por Solicitante)**: O `LegacyTicketService` filtra chamados estritamente pelo e-mail autenticado. Chamados de um colaborador **nunca sao expostos a outro**.
* **Protecao de Chaves**: Nenhuma chave de API de LLM fica exposta no codigo; todas residem em `.env.local`.

---

## Persistencia Pos-Reinicio

Conversas, chamados e o estado de cada atendimento sobrevivem a qualquer reinicio da aplicacao:
* A camada de dados utiliza escrita atomica em disco (`data/db.json`) com arquivos temporarios e renomeacao segura (`fs.renameSync`).
* Ao reiniciar a aplicacao (`Ctrl+C` e `npm run dev`), todos os chamados criados, conversas em andamento e transferencias de analista permanecem salvos com integridade total.

---

## Principais Decisões Técnicas e Trade-offs

1. **Motor de Decisao Hibrido (Deterministic Rules Engine + LLM)**:
   - Criamos um motor de regras deterministico tipado em conjunto com a integracao de LLM. Isso garante custo zero de inferencia nas consultas triviais de SLA/duplicidade, velocidade de resposta instantanea (<100ms) e 100% de estabilidade para qualquer pessoa testando o sistema sem chaves pagas, mantendo suporte total a modelos generativos.
2. **Armazenamento Atomico em Arquivo JSON Persistido vs SQLite Nativo compilado**:
   - Em ambientes Windows, drivers nativos como `better-sqlite3` exigem `node-gyp` e ferramentas de build C++ instaladas no sistema operacional. Para garantir que qualquer desenvolvedor consiga clonar e rodar o projeto com **zero erros de compilacao em qualquer sistema operacional**, optamos por um repositorio atomico em JSON transacional com interface padrao de banco de dados.
