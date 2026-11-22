const livroRepository = require('../repositories/livroRepository');
const prisma = require('../config/db');
const { naoEncontrado } = require('../utils/erros');

/**
 * Monta a visão do livro para a interface: disponibilidade (RN01),
 * fila de reservas e a situação do leitor logado em relação à obra.
 */
async function formatar(livro, usuario) {
  const total = livro.exemplares.length;
  const disponiveis = livro.exemplares.filter((e) => e.status === 'DISPONIVEL').length;
  const localizacao = livro.exemplares[0]?.localizacao || '—';
  let minhaReserva = null;
  let comigo = false;
  if (usuario?.perfil === 'LEITOR') {
    const r = livro.reservas.find((x) => x.leitorId === usuario.id);
    if (r) minhaReserva = { id: r.id, posicaoFila: r.posicaoFila };
    comigo = (await prisma.emprestimo.count({
      where: { leitorId: usuario.id, status: 'ATIVO', exemplar: { livroId: livro.id } },
    })) > 0;
  }
  return {
    id: livro.id,
    isbn: livro.isbn,
    titulo: livro.titulo,
    autor: livro.autor,
    editora: livro.editora,
    ano: livro.ano,
    assunto: livro.assunto,
    localizacao,
    totalExemplares: total,
    disponiveis,
    filaReservas: livro.reservas.length,
    minhaReserva,
    comigo,
    exemplares: livro.exemplares.map(({ id, codigo, localizacao: loc, status }) => ({ id, codigo, localizacao: loc, status })),
  };
}

async function pesquisar({ busca, campo }, usuario) {
  const livros = await livroRepository.pesquisar(busca?.trim(), campo);
  return Promise.all(livros.map((l) => formatar(l, usuario)));
}

async function detalhar(id, usuario) {
  const livro = await livroRepository.buscarPorId(id);
  if (!livro) throw naoEncontrado('Livro não encontrado.');
  return formatar(livro, usuario);
}

/** US5: cadastra o livro e gera os códigos dos exemplares. */
async function cadastrar({ quantidadeExemplares, localizacao, ...dados }) {
  const proximo = await livroRepository.proximoCodigoExemplar();
  const exemplares = Array.from({ length: quantidadeExemplares }, () => ({ codigo: proximo(), localizacao }));
  const livro = await livroRepository.criarComExemplares(dados, exemplares);
  return formatar(livro);
}

module.exports = { pesquisar, detalhar, cadastrar };
