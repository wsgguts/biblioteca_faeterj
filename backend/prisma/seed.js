/* Dados de teste da Biblioteca Digital FAETERJ.
   Recria o banco do zero com usuários de todos os perfis, acervo e empréstimos
   em situações variadas (no prazo, vencendo, atrasado, devolvido e reservado). */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const hoje = new Date();
const dias = (n) => { const d = new Date(hoje); d.setDate(d.getDate() + n); d.setHours(10, 0, 0, 0); return d; };

async function main() {
  // limpa na ordem das dependências
  await prisma.relatorio.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.emprestimo.deleteMany();
  await prisma.exemplar.deleteMany();
  await prisma.livro.deleteMany();
  await prisma.usuario.deleteMany();

  const hash = (s) => bcrypt.hashSync(s, 10);
  const u = async (nome, email, perfil, senha, extra = {}) => prisma.usuario.create({
    data: { nome, email, perfil, telefone: '(24) 99999-0000', senhaHash: hash(senha), ...extra },
  });

  const admin = await u('Carla Mendes', 'admin@biblioteca.faeterj.edu.br', 'ADMINISTRADOR', 'admin123');
  const marta = await u('Marta Reis', 'bibliotecaria@biblioteca.faeterj.edu.br', 'BIBLIOTECARIO', 'biblio123');
  await u('João Pereira', 'joao.pereira@biblioteca.faeterj.edu.br', 'BIBLIOTECARIO', 'biblio123', { ativo: false });
  const ana = await u('Ana Souza', 'ana.souza@aluno.faeterj.edu.br', 'LEITOR', 'leitor123', { matricula: '2024100123', telefone: '(24) 98811-2233' });
  const carlos = await u('Carlos Lima', 'carlos.lima@aluno.faeterj.edu.br', 'LEITOR', 'leitor123', { matricula: '2024100587', telefone: '(24) 98822-4455' });
  const bruno = await u('Bruno Alves', 'bruno.alves@aluno.faeterj.edu.br', 'LEITOR', 'leitor123', { matricula: '2023200341' });
  const paula = await u('Paula Nunes', 'paula.nunes@aluno.faeterj.edu.br', 'LEITOR', 'leitor123', { matricula: '2023200518' });
  const rafael = await u('Rafael Dias', 'rafael.dias@aluno.faeterj.edu.br', 'LEITOR', 'leitor123', { matricula: '2025100077' });
  const leitores = [ana, carlos, bruno, paula, rafael];

  let n = 0;
  const codigo = () => `EX-${String(++n).padStart(4, '0')}`;
  const livro = (titulo, autor, editora, ano, assunto, qtd, estante, isbn) => prisma.livro.create({
    data: {
      titulo, autor, editora, ano, assunto, isbn,
      exemplares: { create: Array.from({ length: qtd }, () => ({ codigo: codigo(), localizacao: estante })) },
    },
    include: { exemplares: true },
  });

  const L = {
    domCasmurro: await livro('Dom Casmurro', 'Machado de Assis', 'Ática', 2019, 'Romance brasileiro', 3, 'Estante B3', '9788508133659'),
    memorias: await livro('Memórias Póstumas de Brás Cubas', 'Machado de Assis', 'Penguin', 2014, 'Romance brasileiro', 1, 'Estante B3'),
    quincas: await livro('Quincas Borba', 'Machado de Assis', 'Martin Claret', 2012, 'Romance brasileiro', 1, 'Estante B3'),
    contos: await livro('Contos Fluminenses', 'Machado de Assis', 'Nova Fronteira', 2016, 'Contos', 1, 'Estante B4'),
    cortico: await livro('O Cortiço', 'Aluísio Azevedo', 'Ática', 2011, 'Romance brasileiro', 1, 'Estante B2'),
    iracema: await livro('Iracema', 'José de Alencar', 'Ática', 2010, 'Romance brasileiro', 2, 'Estante B1'),
    guarani: await livro('O Guarani', 'José de Alencar', 'Ática', 2009, 'Romance brasileiro', 1, 'Estante B1'),
    sertoes: await livro('Os Sertões', 'Euclides da Cunha', 'Ubu', 2019, 'História do Brasil', 1, 'Estante C2'),
    vidasSecas: await livro('Vidas Secas', 'Graciliano Ramos', 'Record', 2019, 'Romance brasileiro', 2, 'Estante B5'),
    engSoft: await livro('Engenharia de Software', 'Ian Sommerville', 'Pearson', 2019, 'Engenharia de software', 2, 'Estante T1', '9788543024974'),
    pressman: await livro('Engenharia de Software: uma abordagem profissional', 'Roger S. Pressman', 'AMGH', 2021, 'Engenharia de software', 1, 'Estante T1'),
    calculo: await livro('Cálculo – Volume 1', 'James Stewart', 'Cengage', 2017, 'Matemática', 2, 'Estante M1'),
    algoritmos: await livro('Algoritmos: Teoria e Prática', 'Thomas H. Cormen', 'GEN LTC', 2012, 'Programação', 2, 'Estante T2'),
    redes: await livro('Redes de Computadores e a Internet', 'James F. Kurose', 'Pearson', 2021, 'Redes', 1, 'Estante T3'),
  };

  // empréstimo ativo: marca o exemplar como EMPRESTADO
  const emprestar = async (leitor, l, idx, retirada, prevista) => {
    const ex = l.exemplares[idx];
    await prisma.emprestimo.create({
      data: { leitorId: leitor.id, exemplarId: ex.id, bibliotecarioId: marta.id, dataEmprestimo: dias(retirada), dataPrevistaDevolucao: dias(prevista) },
    });
    await prisma.exemplar.update({ where: { id: ex.id }, data: { status: 'EMPRESTADO' } });
  };

  await emprestar(ana, L.cortico, 0, -20, -6);      // atrasado há 6 dias
  await emprestar(ana, L.iracema, 0, -10, 4);       // vence em 4 dias
  await emprestar(ana, L.engSoft, 0, -2, 12);       // no prazo
  await emprestar(bruno, L.sertoes, 0, -46, -32);   // atrasado há 32 dias
  await emprestar(paula, L.calculo, 0, -37, -23);   // atrasado há 23 dias
  await emprestar(bruno, L.memorias, 0, -5, 9);     // único exemplar, com fila de reserva
  await emprestar(carlos, L.redes, 0, -3, 11);

  // fila de reservas de "Memórias Póstumas": Paula é a 1ª
  await prisma.reserva.create({ data: { leitorId: paula.id, livroId: L.memorias.id, posicaoFila: 1, dataReserva: dias(-4) } });
  // "Contos Fluminenses" foi devolvido e está guardado para Ana (1ª da fila)
  await prisma.exemplar.update({ where: { id: L.contos.exemplares[0].id }, data: { status: 'RESERVADO' } });
  await prisma.reserva.create({ data: { leitorId: ana.id, livroId: L.contos.id, posicaoFila: 1, dataReserva: dias(-8) } });
  // um exemplar em manutenção
  await prisma.exemplar.update({ where: { id: L.domCasmurro.exemplares[2].id }, data: { status: 'MANUTENCAO' } });

  // histórico de empréstimos devolvidos nos últimos 6 meses (alimenta os relatórios)
  const historico = [L.domCasmurro, L.quincas, L.vidasSecas, L.guarani, L.algoritmos, L.pressman, L.engSoft, L.iracema];
  let k = 0;
  for (let d = -175; d <= -8; d += 4) {
    const l = historico[k % historico.length];
    const leitor = leitores[k % leitores.length];
    const atraso = k % 7 === 0 ? 3 : 0;
    await prisma.emprestimo.create({
      data: {
        leitorId: leitor.id, exemplarId: l.exemplares[0].id, bibliotecarioId: marta.id,
        dataEmprestimo: dias(d), dataPrevistaDevolucao: dias(d + 14), dataDevolucao: dias(d + 10 + atraso),
        status: 'DEVOLVIDO',
      },
    });
    k++;
  }

  console.log('Banco populado com sucesso.');
  console.log('  Administrador: admin@biblioteca.faeterj.edu.br / admin123');
  console.log('  Bibliotecária: bibliotecaria@biblioteca.faeterj.edu.br / biblio123');
  console.log('  Leitora:       ana.souza@aluno.faeterj.edu.br / leitor123');
  console.log('  Leitor:        carlos.lima@aluno.faeterj.edu.br / leitor123');
  return { admin };
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
