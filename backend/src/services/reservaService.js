const prisma = require('../config/db');
const reservaRepository = require('../repositories/reservaRepository');
const emprestimoRepository = require('../repositories/emprestimoRepository');
const { reordenarFila } = require('./emprestimoService');
const { naoEncontrado, conflito, proibido } = require('../utils/erros');

/** US3 / UC003 – reserva um livro indisponível (RN02). */
async function reservar(leitorId, livroId) {
  const livro = await prisma.livro.findUnique({ where: { id: livroId }, include: { exemplares: true } });
  if (!livro) throw naoEncontrado('Livro não encontrado.');
  if (livro.exemplares.some((e) => e.status === 'DISPONIVEL')) {
    throw conflito('Há exemplar disponível. Não é necessário reservar: retire o livro no balcão.');
  }
  if (await reservaRepository.buscarAtivaDoLeitor(leitorId, livroId)) {
    throw conflito('Você já possui uma reserva ativa para este livro.');
  }
  if (await emprestimoRepository.leitorPossuiLivro(leitorId, livroId)) {
    throw conflito('Este livro já está emprestado para você.');
  }
  const posicaoFila = (await reservaRepository.contarAtivasDoLivro(livroId)) + 1;
  return reservaRepository.criar({ leitorId, livroId, posicaoFila });
}

async function minhas(leitorId) {
  return reservaRepository.listarAtivasDoLeitor(leitorId);
}

/** Cancela a reserva, reordena a fila e libera o exemplar se ele estava guardado para o leitor. */
async function cancelar(leitorId, id) {
  const reserva = await reservaRepository.buscarPorId(id);
  if (!reserva || !reserva.ativa) throw naoEncontrado('Reserva não encontrada.');
  if (reserva.leitorId !== leitorId) throw proibido('Você só pode cancelar as suas reservas.');
  await prisma.$transaction(async (tx) => {
    await tx.reserva.update({ where: { id: reserva.id }, data: { ativa: false } });
    await reordenarFila(tx, reserva.livroId);
    const restantes = await tx.reserva.count({ where: { livroId: reserva.livroId, ativa: true } });
    if (restantes === 0) {
      await tx.exemplar.updateMany({ where: { livroId: reserva.livroId, status: 'RESERVADO' }, data: { status: 'DISPONIVEL' } });
    }
  });
}

module.exports = { reservar, minhas, cancelar };
