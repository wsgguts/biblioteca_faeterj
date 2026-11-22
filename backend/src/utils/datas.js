const DIA_MS = 24 * 60 * 60 * 1000;

/** Início do dia (00:00) da data informada. */
function inicioDoDia(data = new Date()) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function somarDias(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

/** Diferença em dias inteiros entre duas datas (b - a), ignorando o horário. */
function diasEntre(a, b) {
  return Math.round((inicioDoDia(b) - inicioDoDia(a)) / DIA_MS);
}

/** Empréstimo ativo cuja data prevista já passou. */
function estaAtrasado(emprestimo, hoje = new Date()) {
  return emprestimo.status === 'ATIVO' && diasEntre(emprestimo.dataPrevistaDevolucao, hoje) > 0;
}

module.exports = { inicioDoDia, somarDias, diasEntre, estaAtrasado };
