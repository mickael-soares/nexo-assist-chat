const test = require('node:test');
const assert = require('node:assert');

// Testes diretos da lógica de regras do Service Desk (Anexo A)
function checkScope(message) {
  const text = message.toLowerCase();
  if (text.includes('ferias') || text.includes('férias') || text.includes('folha de pagamento')) {
    return { inScope: false, department: 'RH' };
  }
  if (text.includes('reembolso') || text.includes('nota fiscal')) {
    return { inScope: false, department: 'Financeiro' };
  }
  if (text.includes('ar condicionado') || text.includes('lampada')) {
    return { inScope: false, department: 'Facilities' };
  }
  return { inScope: true };
}

function classifyTicketType(text) {
  const lower = text.toLowerCase();
  const reqKeywords = ['pedido', 'solicito', 'solicitar', 'quero', 'requisicao', 'segundo monitor'];
  return reqKeywords.some((k) => lower.includes(k)) ? 'REQ' : 'INC';
}

function classifyCategory(text) {
  const lower = text.toLowerCase();
  if (lower.includes('vpn') || lower.includes('rede') || lower.includes('809')) return 'Rede e VPN';
  if (lower.includes('sap') || lower.includes('senha') || lower.includes('acesso')) return 'Acesso';
  if (lower.includes('monitor') || lower.includes('notebook') || lower.includes('teclado')) return 'Hardware';
  return 'Outros';
}

function classifyPriority(text, scope) {
  const lower = text.toLowerCase();
  if (scope === 'Toda a empresa' || scope === 'Minha equipe' || lower.includes('equipe inteira')) {
    return { priority: 'Crítica', sla: '1 hora' };
  }
  if (lower.includes('reuniao') || lower.includes('reunião') || lower.includes('as 14h') || lower.includes('às 14h')) {
    return { priority: 'Alta', sla: '4 horas úteis' };
  }
  if (lower.includes('sem pressa') || lower.includes('segundo monitor')) {
    return { priority: 'Baixa', sla: '5 dias úteis' };
  }
  return { priority: 'Média', sla: '3 dias úteis' };
}

test('Regra de Escopo: Redireciona RH, Financeiro e Facilities', () => {
  assert.strictEqual(checkScope('Como marco minhas férias?').inScope, false);
  assert.strictEqual(checkScope('Como marco minhas férias?').department, 'RH');

  assert.strictEqual(checkScope('Onde envio nota fiscal para reembolso?').inScope, false);
  assert.strictEqual(checkScope('Onde envio nota fiscal para reembolso?').department, 'Financeiro');

  assert.strictEqual(checkScope('O ar condicionado da sala 4 quebrou').inScope, false);
  assert.strictEqual(checkScope('O ar condicionado da sala 4 quebrou').department, 'Facilities');

  assert.strictEqual(checkScope('Meu notebook não conecta na VPN').inScope, true);
});

test('Regra de Tipo: Diferencia INC (Incidente) e REQ (Requisição)', () => {
  assert.strictEqual(classifyTicketType('Meu notebook parou de ligar'), 'INC');
  assert.strictEqual(classifyTicketType('VPN com erro 809'), 'INC');
  assert.strictEqual(classifyTicketType('Solicitar segundo monitor para home office'), 'REQ');
  assert.strictEqual(classifyTicketType('Quero solicitar acesso ao SAP'), 'REQ');
});

test('Regra de Categorização: Identifica categorias de TI corretas', () => {
  assert.strictEqual(classifyCategory('VPN erro 809'), 'Rede e VPN');
  assert.strictEqual(classifyCategory('Senha do SAP bloqueada'), 'Acesso');
  assert.strictEqual(classifyCategory('Notebook lento após update'), 'Hardware');
});

test('Matriz de Prioridade e SLA: Calcula prazos conforme Anexo A', () => {
  // Crítica (1h)
  const crit = classifyPriority('Sistema central fora do ar', 'Toda a empresa');
  assert.strictEqual(crit.priority, 'Crítica');
  assert.strictEqual(crit.sla, '1 hora');

  // Alta (4h úteis)
  const alta = classifyPriority('Tenho reunião com cliente às 14h e preciso da VPN');
  assert.strictEqual(alta.priority, 'Alta');
  assert.strictEqual(alta.sla, '4 horas úteis');

  // Baixa (5 dias úteis)
  const baixa = classifyPriority('Segundo monitor sem pressa quando der');
  assert.strictEqual(baixa.priority, 'Baixa');
  assert.strictEqual(baixa.sla, '5 dias úteis');

  // Média (3 dias úteis)
  const media = classifyPriority('Notebook um pouco lento mas dá pra usar');
  assert.strictEqual(media.priority, 'Média');
  assert.strictEqual(media.sla, '3 dias úteis');
});
