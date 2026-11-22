const prisma = require('../config/db');

const camposPublicos = {
  id: true, nome: true, email: true, telefone: true, matricula: true, perfil: true, ativo: true, criadoEm: true,
};

module.exports = {
  camposPublicos,
  buscarPorId: (id) => prisma.usuario.findUnique({ where: { id: Number(id) } }),
  buscarPorEmail: (email) => prisma.usuario.findUnique({ where: { email } }),
  buscarPorMatricula: (matricula) => prisma.usuario.findUnique({ where: { matricula } }),
  criar: (dados) => prisma.usuario.create({ data: dados, select: camposPublicos }),
  atualizar: (id, dados) => prisma.usuario.update({ where: { id: Number(id) }, data: dados, select: camposPublicos }),

  listarFuncionarios: () => prisma.usuario.findMany({
    where: { perfil: { in: ['BIBLIOTECARIO', 'ADMINISTRADOR'] } },
    select: camposPublicos,
    orderBy: { nome: 'asc' },
  }),

  pesquisarLeitores: (busca) => prisma.usuario.findMany({
    where: {
      perfil: 'LEITOR',
      ...(busca ? { OR: [{ nome: { contains: busca } }, { matricula: { contains: busca } }] } : {}),
    },
    select: camposPublicos,
    orderBy: { nome: 'asc' },
    take: 20,
  }),
};
