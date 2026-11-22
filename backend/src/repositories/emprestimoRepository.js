const prisma = require('../config/db');

const incluir = {
  exemplar: { include: { livro: true } },
  leitor: { select: { id: true, nome: true, matricula: true, email: true } },
  bibliotecario: { select: { id: true, nome: true } },
};

module.exports = {
  buscarPorId: (id) => prisma.emprestimo.findUnique({ where: { id: Number(id) }, include: incluir }),

  listarAtivosDoLeitor: (leitorId) => prisma.emprestimo.findMany({
    where: { leitorId, status: 'ATIVO' }, include: incluir, orderBy: { dataPrevistaDevolucao: 'asc' },
  }),

  listarAtivos: (busca) => prisma.emprestimo.findMany({
    where: {
      status: 'ATIVO',
      ...(busca ? {
        OR: [
          { leitor: { nome: { contains: busca } } },
          { leitor: { matricula: { contains: busca } } },
          { exemplar: { codigo: { contains: busca } } },
          { exemplar: { livro: { titulo: { contains: busca } } } },
        ],
      } : {}),
    },
    include: incluir,
    orderBy: { dataPrevistaDevolucao: 'asc' },
  }),

  contarAtrasadosDoLeitor: (leitorId, hoje) => prisma.emprestimo.count({
    where: { leitorId, status: 'ATIVO', dataPrevistaDevolucao: { lt: hoje } },
  }),

  leitorPossuiLivro: (leitorId, livroId) => prisma.emprestimo.count({
    where: { leitorId, status: 'ATIVO', exemplar: { livroId } },
  }),

  listarPorPeriodo: (inicio, fim) => prisma.emprestimo.findMany({
    where: { dataEmprestimo: { gte: inicio, lte: fim } }, include: incluir,
  }),

  listarAtrasados: (hoje) => prisma.emprestimo.findMany({
    where: { status: 'ATIVO', dataPrevistaDevolucao: { lt: hoje } },
    include: incluir,
    orderBy: { dataPrevistaDevolucao: 'asc' },
  }),
};
