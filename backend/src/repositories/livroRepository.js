const prisma = require('../config/db');

const incluirDetalhes = {
  exemplares: { orderBy: { codigo: 'asc' } },
  reservas: { where: { ativa: true }, orderBy: { posicaoFila: 'asc' } },
};

module.exports = {
  pesquisar(busca, campo) {
    let where = {};
    if (busca) {
      const campos = campo && campo !== 'todos' ? [campo] : ['titulo', 'autor', 'assunto'];
      where = { OR: campos.map((c) => ({ [c]: { contains: busca } })) };
    }
    return prisma.livro.findMany({ where, include: incluirDetalhes, orderBy: { titulo: 'asc' }, take: 50 });
  },

  buscarPorId: (id) => prisma.livro.findUnique({ where: { id: Number(id) }, include: incluirDetalhes }),

  /** Cria o livro e seus exemplares numa única operação. */
  criarComExemplares(dados, exemplares) {
    return prisma.livro.create({
      data: { ...dados, exemplares: { create: exemplares } },
      include: incluirDetalhes,
    });
  },

  async proximoCodigoExemplar() {
    const ultimo = await prisma.exemplar.findFirst({ orderBy: { id: 'desc' } });
    let n = ultimo ? Number(String(ultimo.codigo).replace(/\D/g, '')) || ultimo.id : 0;
    return () => `EX-${String(++n).padStart(4, '0')}`;
  },
};
