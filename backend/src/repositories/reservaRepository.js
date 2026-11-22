const prisma = require('../config/db');

module.exports = {
  buscarPorId: (id) => prisma.reserva.findUnique({ where: { id: Number(id) }, include: { livro: true } }),

  listarAtivasDoLeitor: (leitorId) => prisma.reserva.findMany({
    where: { leitorId, ativa: true }, include: { livro: true }, orderBy: { dataReserva: 'asc' },
  }),

  buscarAtivaDoLeitor: (leitorId, livroId) => prisma.reserva.findFirst({ where: { leitorId, livroId, ativa: true } }),

  contarAtivasDoLivro: (livroId) => prisma.reserva.count({ where: { livroId, ativa: true } }),

  primeiraDaFila: (livroId, tx = prisma) => tx.reserva.findFirst({
    where: { livroId, ativa: true }, orderBy: { posicaoFila: 'asc' },
  }),

  criar: (dados) => prisma.reserva.create({ data: dados, include: { livro: true } }),
};
