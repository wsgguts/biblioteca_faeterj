const prisma = require('../config/db');
const { prazoEmprestimoDias } = require('../config');
const emprestimoRepository = require('../repositories/emprestimoRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const reservaRepository = require('../repositories/reservaRepository');
const { naoEncontrado, conflito } = require('../utils/erros');
const { inicioDoDia, somarDias, diasEntre, estaAtrasado } = require('../utils/datas');

/** Acrescenta a situação calculada (atraso, dias restantes) ao empréstimo. */
function comSituacao(e) {
  const hoje = new Date();
  const atrasado = estaAtrasado(e, hoje);
  return {
    ...e,
    atrasado,
    diasAtraso: atrasado ? diasEntre(e.dataPrevistaDevolucao, hoje) : 0,
    diasRestantes: e.status === 'ATIVO' ? diasEntre(hoje, e.dataPrevistaDevolucao) : null,
  };
}

async function buscarExemplar(exemplarId, codigo) {
  const where = exemplarId ? { id: Number(exemplarId) } : { codigo: String(codigo).trim().toUpperCase() };
  const exemplar = await prisma.exemplar.findUnique({ where, include: { livro: true } });
  if (!exemplar) throw naoEncontrado('Exemplar não encontrado. Confira o código informado.');
  return exemplar;
}

/** Verificações do UC006 antes de gravar (usadas também na pré-visualização da tela). */
async function verificar({ leitorId, exemplarId, codigoExemplar }) {
  const leitor = await usuarioRepository.buscarPorId(leitorId);
  if (!leitor || leitor.perfil !== 'LEITOR') throw naoEncontrado('Leitor não encontrado.');
  if (!leitor.ativo) throw conflito('Este leitor está desativado.');
  const atrasados = await emprestimoRepository.contarAtrasadosDoLeitor(leitor.id, inicioDoDia());
  if (atrasados > 0) throw conflito('O leitor possui empréstimo em atraso. Registre a devolução antes de um novo empréstimo.');

  const exemplar = await buscarExemplar(exemplarId, codigoExemplar);
  let reservaUsada = null;
  if (exemplar.status === 'RESERVADO') {
    const primeira = await reservaRepository.primeiraDaFila(exemplar.livroId);
    if (!primeira || primeira.leitorId !== leitor.id) {
      throw conflito('Este exemplar está reservado para outro leitor.');
    }
    reservaUsada = primeira;
  } else if (exemplar.status !== 'DISPONIVEL') {
    throw conflito('Exemplar indisponível para empréstimo.'); // RN01
  } else {
    // se o próprio leitor estava na fila deste livro, a reserva é atendida
    reservaUsada = await reservaRepository.buscarAtivaDoLeitor(leitor.id, exemplar.livroId);
  }

  const hoje = new Date();
  return {
    leitor: { id: leitor.id, nome: leitor.nome, matricula: leitor.matricula, email: leitor.email },
    exemplar: { id: exemplar.id, codigo: exemplar.codigo, localizacao: exemplar.localizacao, status: exemplar.status, livro: exemplar.livro },
    dataEmprestimo: hoje,
    dataPrevistaDevolucao: somarDias(hoje, prazoEmprestimoDias),
    prazoDias: prazoEmprestimoDias,
    reservaUsada,
  };
}

/** Reordena a fila depois que uma reserva sai dela. */
async function reordenarFila(tx, livroId) {
  const ativas = await tx.reserva.findMany({ where: { livroId, ativa: true }, orderBy: { posicaoFila: 'asc' } });
  for (let i = 0; i < ativas.length; i++) {
    if (ativas[i].posicaoFila !== i + 1) {
      await tx.reserva.update({ where: { id: ativas[i].id }, data: { posicaoFila: i + 1 } });
    }
  }
}

/** UC006 / US6 – registra o empréstimo em transação. */
async function registrar(dados, bibliotecarioId) {
  const v = await verificar(dados);
  const emprestimo = await prisma.$transaction(async (tx) => {
    // garante que ninguém pegou o exemplar entre a verificação e a gravação
    const atual = await tx.exemplar.findUnique({ where: { id: v.exemplar.id } });
    if (atual.status !== v.exemplar.status) throw conflito('A situação do exemplar mudou. Tente novamente.');
    const criado = await tx.emprestimo.create({
      data: {
        leitorId: v.leitor.id,
        exemplarId: v.exemplar.id,
        bibliotecarioId,
        dataEmprestimo: v.dataEmprestimo,
        dataPrevistaDevolucao: v.dataPrevistaDevolucao,
      },
    });
    await tx.exemplar.update({ where: { id: v.exemplar.id }, data: { status: 'EMPRESTADO' } });
    if (v.reservaUsada) {
      await tx.reserva.update({ where: { id: v.reservaUsada.id }, data: { ativa: false } });
      await reordenarFila(tx, v.exemplar.livroId ?? v.exemplar.livro.id);
    }
    return criado;
  });
  return comSituacao(await emprestimoRepository.buscarPorId(emprestimo.id));
}

/** UC007 / US7 – registra a devolução, sinaliza atraso e atende a fila de reservas. */
async function devolver(id) {
  const emp = await emprestimoRepository.buscarPorId(id);
  if (!emp) throw naoEncontrado('Empréstimo não encontrado.');
  if (emp.status !== 'ATIVO') throw conflito('Este empréstimo já foi devolvido.');
  const situacao = comSituacao(emp);
  const resultado = await prisma.$transaction(async (tx) => {
    await tx.emprestimo.update({ where: { id: emp.id }, data: { status: 'DEVOLVIDO', dataDevolucao: new Date() } });
    const proxima = await reservaRepository.primeiraDaFila(emp.exemplar.livroId, tx);
    const novoStatus = proxima ? 'RESERVADO' : 'DISPONIVEL';
    await tx.exemplar.update({ where: { id: emp.exemplarId }, data: { status: novoStatus } });
    let reservadoPara = null;
    if (proxima) {
      const u = await tx.usuario.findUnique({ where: { id: proxima.leitorId }, select: { id: true, nome: true } });
      reservadoPara = u;
    }
    return { novoStatus, reservadoPara };
  });
  return {
    emprestimo: comSituacao(await emprestimoRepository.buscarPorId(emp.id)),
    houveAtraso: situacao.atrasado,
    diasAtraso: situacao.diasAtraso,
    statusExemplar: resultado.novoStatus,
    reservadoPara: resultado.reservadoPara,
  };
}

async function meus(leitorId) {
  const lista = await emprestimoRepository.listarAtivosDoLeitor(leitorId);
  return lista.map(comSituacao);
}

async function ativos(busca) {
  const lista = await emprestimoRepository.listarAtivos(busca?.trim());
  return lista.map(comSituacao);
}

module.exports = { verificar, registrar, devolver, meus, ativos, comSituacao, reordenarFila };
