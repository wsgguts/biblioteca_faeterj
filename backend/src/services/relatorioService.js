const prisma = require('../config/db');
const emprestimoRepository = require('../repositories/emprestimoRepository');
const { comSituacao } = require('./emprestimoService');
const { inicioDoDia } = require('../utils/datas');
const { requisicaoInvalida } = require('../utils/erros');

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** US8 / UC008 – empréstimos ativos, devolvidos e atrasados por período. */
async function emprestimos({ inicio, fim }, usuario) {
  const dIni = inicioDoDia(inicio);
  const dFim = new Date(fim); dFim.setHours(23, 59, 59, 999);
  if (dIni > dFim) throw requisicaoInvalida('A data inicial deve ser anterior à data final.');

  const lista = (await emprestimoRepository.listarPorPeriodo(dIni, dFim)).map(comSituacao);
  const porMes = new Map();
  for (let d = new Date(dIni.getFullYear(), dIni.getMonth(), 1); d <= dFim; d.setMonth(d.getMonth() + 1)) {
    porMes.set(`${d.getFullYear()}-${d.getMonth()}`, { mes: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, total: 0, atrasados: 0 });
  }
  for (const e of lista) {
    const m = porMes.get(`${e.dataEmprestimo.getFullYear()}-${e.dataEmprestimo.getMonth()}`);
    if (m) { m.total++; if (e.atrasado) m.atrasados++; }
  }
  const atrasados = (await emprestimoRepository.listarAtrasados(inicioDoDia())).map(comSituacao);

  await prisma.relatorio.create({
    data: { geradoPorId: usuario.id, tipo: 'EMPRESTIMOS', periodoInicio: dIni, periodoFim: dFim },
  });

  return {
    periodo: { inicio: dIni, fim: dFim },
    totais: {
      emprestimos: lista.length,
      ativos: lista.filter((e) => e.status === 'ATIVO').length,
      devolvidos: lista.filter((e) => e.status === 'DEVOLVIDO').length,
      atrasados: lista.filter((e) => e.atrasado).length,
    },
    porMes: [...porMes.values()].slice(-12),
    atrasadosAgora: atrasados,
  };
}

module.exports = { emprestimos };
