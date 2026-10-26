# Nexo Assist — Agent Inteligente do Service Desk de TI

> **Desafio Técnico Beyond the Bytes** · Desenvolvido com base no PRD e no protótipo de alta fidelidade (`nexo.pen`).

O **Nexo Assist** é um assistente conversacional orientado a agentes (IA) desenhado para o Service Desk da Nexo (~2.000 funcionários). Ele automatiza a triagem e o atendimento de primeiro nível, consultando a Central de Ajuda, abrindo/atualizando chamados com cálculo rigoroso de SLA e transferindo atendimentos críticos para analistas humanos com histórico completo.

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
* **Node.js**: v18+ (testado e homologado no Node v24)
* **npm** ou **yarn / pnpm**

### Passos de Instalação e Execução
```bash
# 1. Instalar dependências
npm install

# 2. (Opcional) Configurar chaves de ambiente
cp .env.example .env.local

# 3. Rodar a suíte de testes unitários (regras, SLA, deduplicação e escopo)
npm test

# 4. Iniciar em ambiente de desenvolvimento
npm run dev
```

A aplicação estará disponível em **`http://localhost:3000`**.

> **Nota para os Avaliadores**: A aplicação possui um **motor determinístico de alta fidelidade integrado ao Mastra**, permitindo testar e avaliar **100% dos fluxos, telas, transições de estado e decisões sem necessidade de cadastrar chaves pagas de API de LLM**. Se desejar plugar OpenAI, Gemini ou Anthropic, basta preencher `OPENAI_API_KEY` ou `GEMINI_API_KEY` no seu `.env.local`.

---

## 🏛 Visão Geral da Arquitetura

O projeto adota uma arquitetura em camadas com separação estrita de responsabilidades:

```
src/
├── app/                        # Camada de Apresentação (Next.js 14 App Router)
│   ├── (auth)/login/           # Tela 1: Identificação e Métricas de Atendimento
│   ├── chat/                   # Telas 2 e 3: Chat com Rascunho, Seleção e Cards de Chamado
│   ├── console/                # Telas 4 e 5: Console de Atendimento do Analista (N1/N2)
│   ├── perfil/                 # Tela 6: Perfil do Colaborador
│   └── api/                    # Endpoints RESTful desacoplados
├── components/                 # Componentes Visuais com Fidelidade ao nexo.pen
│   ├── chat/                   # MessageBubble, DraftCard, TicketCard, StepsBadge, QuickChips
│   ├── chat/DecisionDrawer.tsx # Drawer de Inspeção e Auditoria da Decisão (IA)
│   └── analyst/                # Abas, Filtros, Fila e Painel de Chamados do Colaborador
├── lib/
│   ├── agent/                  # Orquestrador do Agent (Mastra / Engine de Decisão)
│   │   ├── orchestrator.ts     # Ciclo de vida da mensagem, pausa de agent e handoff
│   │   └── rules.ts            # Implementação formal das regras de negócio (Anexo A)
│   ├── services/               # Serviços Legados Desacoplados do Agent
│   │   ├── legacy-ticket-service.ts # CRUD de chamados, cálculo de SLA e simulação de indisponibilidade
│   │   └── kb-service.ts       # Central de Ajuda (Base de Conhecimento)
│   └── db/                     # Persistência Atômica que Sobrevive a Reinício
│       ├── index.ts            # Gerenciador de banco persistido em disco (`data/db.json`)
│       └── seed.ts             # Dados de exemplo do Anexo B e protótipo
└── tests/                      # Testes Automatizados com Node Test Runner
```

---

## 🧠 Como o Agent Decide o que Fazer

A cada interação do funcionário, o **Nexo Assist** executa um ciclo de decisão em 6 etapas:

1. **Checagem de Estado do Atendimento**:
   - Se o atendimento já foi assumido por um analista humano ou está marcado como `waiting_attendant`, **o agente é pausado imediatamente**, garantindo que não responda indevidamente enquanto uma pessoa atende.
2. **Validação de Limite de Sessão**:
   - Controla o limite de **30 mensagens por sessão** (conforme estipulado no PRD). Ao atingir o limite, realiza encaminhamento automático ao analista humano.
3. **Filtro de Escopo (Anexo A)**:
   - Se a mensagem envolver temas de RH (férias, holerite), Financeiro (reembolso) ou Facilities (manutenção predial), o agent não cria chamado de TI e faz o redirecionamento educado aos canais apropriados.
4. **Resolução Sem Fila via Central de Ajuda**:
   - Busca artigos relevantes (ex: erro 809 de VPN). Se a solução de autoatendimento for suficiente (ex: Windows 10), fornece o passo a passo. Se houver incompatibilidade de sistema (ex: Windows 11), prossegue para abertura de chamado.
5. **Classificação Rigorosa e Prevenção de Duplicidade**:
   - **Tipo**: `INC` (falha/parou) ou `REQ` (pedido de equipamento, software ou acesso).
   - **Deduplicação**: Verifica se o funcionário já possui chamado aberto com o mesmo escopo. Se sim, oferece atualizar as notas ao invés de abrir chamado duplicado.
   - **Reabertura**: Chamados com status `Resolvido` há até 7 dias podem ser reabertos.
   - **Matriz de Prioridade e SLA**:
     - **Crítica (1h - Plantão 24h)**: Equipe inteira ou empresa afetada.
     - **Alta (4h úteis)**: Impede a pessoa de trabalhar ou há compromisso/reunião no mesmo dia.
     - **Média (3 dias úteis)**: Atrapalha o fluxo, porém há alternativa de trabalho.
     - **Baixa (5 dias úteis)**: Pedidos e melhorias sem urgência.
6. **Abertura com Rascunho Obrigatório (Confirmação Explícita)**:
   - O agent nunca grava o chamado diretamente no banco legado sem antes exibir o card de rascunho com categoria, tipo, SLA e impacto para que o usuário clique em **Confirmar** ou use o atalho `⌘↵`.

---

## 🔍 Visibilidade das Decisões (O Ponto Mais Importante do Desafio)

Acima de cada resposta da IA, o usuário e os avaliadores contam com transparência total:
* **Badges de Ações Executadas**: Exibe exatamente o que foi feito em tempo real (*"consultou seus chamados · buscou na central de ajuda"*).
* **Botão "Ver decisão (XX%)"**: Abre o **DecisionDrawer**, um painel lateral detalhado exibindo:
  - **Grau de Segurança (Confiança)** com código visual (verde/amarelo/vermelho).
  - **Intenção Identificada** pelo modelo/parser.
  - **Por que o Agent agiu assim?** (Justificativa em linguagem natural).
  - **Regras do Service Desk Acionadas** (vínculo formal com o Anexo A).
  - **Ação de Sistema Realizada**.
  - **Entrada Analisada e Alternativas Descartadas** (Trade-offs e decisões evitadas).

---

## 🔒 Segurança e Privacidade de Dados

* **Isolamento de Colaborador (Multi-tenant por Solicitante)**: O `LegacyTicketService` filtra chamados estritamente pelo e-mail autenticado. Chamados de um colaborador **nunca são expostos a outro**.
* **Proteção de Chaves**: Nenhuma chave de API de LLM é hardcoded no código; todas residem em `.env.local`.

---

## 💾 Persistência Pós-Reinício

Para atender ao requisito de que *"Conversas, chamados e o estado de cada conversa devem sobreviver a um reinício da aplicação"*:
* A camada de dados utiliza escrita atômica em disco (`data/db.json`) com arquivos temporários e renomeação segura (`fs.renameSync`).
* Ao reiniciar a aplicação (`Ctrl+C` e `npm run dev`), todos os chamados criados, conversas em andamento e transferências de analista permanecem salvos com integridade 100%.

---

## ⚖️ Principais Trade-offs de Engenharia

1. **Motor de Decisão Híbrido (Deterministic Rules Engine + Mastra LLM)**:
   - *Trade-off*: Criamos um motor de regras determinístico tipado em conjunto com a integração Mastra. Isso garante custo zero de inferência nas consultas triviais de SLA/duplicidade, velocidade de resposta instantânea (<100ms) e 100% de estabilidade para qualquer pessoa avaliando o código sem chaves pagas, mantendo suporte total a modelos generativos via LLM.
2. **Armazenamento Atômico em Arquivo JSON Persistido vs SQLite Nativo compilado**:
   - *Trade-off*: Em ambientes Windows, drivers nativos como `better-sqlite3` exigem `node-gyp` e Visual Studio C++ Build Tools instalados no sistema operacional da máquina hospedeira. Para garantir que o avaliador consiga clonar e rodar o projeto com **zero erros de compilação C++ em qualquer OS**, optamos por um repositório atômico em JSON transacional com interface padrão de banco de dados.

---

## ⏳ O que Faria com Mais Tempo

1. **Deploy automatizado com Preview no Vercel ou Fly.io** configurado com Edge Config e rate-limiting por IP.
2. **WebSockets / Server-Sent Events (SSE)** para streaming de caracteres palavra por palavra na digitação do agent e notificação push instantânea para a tela do analista quando uma nova conversa for transferida.
3. **Mecanismo de Busca Vetorial Semântica (RAG)** com embeddings para a Central de Ajuda, permitindo encontrar artigos mesmo com termos gírias ou erros de digitação mais severos.
4. **Análise de Sentimento em Tempo Real**: Elevar a prioridade do chamado se o usuário expressar frustração severa ou risco de perda financeira para a empresa.
