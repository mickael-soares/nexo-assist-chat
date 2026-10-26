const test = require('node:test');
const assert = require('node:assert');

test('Regra de Reabertura: Permite até 7 dias e rejeita após 7 dias', () => {
  function canReopen(resolvedDateStr) {
    const resolvedDate = new Date(resolvedDateStr);
    const diffDays = (Date.now() - resolvedDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }

  // 4 dias atrás -> Pode reabrir
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  assert.strictEqual(canReopen(fourDaysAgo), true);

  // 10 dias atrás -> Não pode reabrir
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  assert.strictEqual(canReopen(tenDaysAgo), false);
});

test('Cálculo de Prazo Vencido (SLA Overdue)', () => {
  function isOverdue(dueAtStr, status) {
    if (['Resolvido', 'Cancelado'].includes(status)) return false;
    return new Date(dueAtStr).getTime() < Date.now();
  }

  const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

  // Aberto no passado = Vencido
  assert.strictEqual(isOverdue(pastDate, 'Aguardando analista'), true);

  // Aberto com prazo futuro = Não vencido
  assert.strictEqual(isOverdue(futureDate, 'Aberto'), false);

  // Resolvido = Não vencido (mesmo com prazo no passado)
  assert.strictEqual(isOverdue(pastDate, 'Resolvido'), false);
});
