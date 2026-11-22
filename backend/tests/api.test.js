process.env.DATABASE_URL = 'file:./test.db';
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

const login = async (email, senha) => (await request(app).post('/api/auth/login').send({ email, senha })).body.token;
const auth = (t) => ({ Authorization: `Bearer ${t}` });

let tLeitora; let tBib; let tAdmin; let tCarlos;

beforeAll(async () => {
  tLeitora = await login('ana.souza@aluno.faeterj.edu.br', 'leitor123');
  tCarlos = await login('carlos.lima@aluno.faeterj.edu.br', 'leitor123');
  tBib = await login('bibliotecaria@biblioteca.faeterj.edu.br', 'biblio123');
  tAdmin = await login('admin@biblioteca.faeterj.edu.br', 'admin123');
});
afterAll(() => prisma.$disconnect());

describe('Autenticação e perfis (RNF Segurança, CA003, RN05)', () => {
  test('login com senha errada retorna 401 com mensagem em português', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'ana.souza@aluno.faeterj.edu.br', senha: 'errada' });
    expect(r.status).toBe(401);
    expect(r.body.mensagem).toMatch(/incorretos/);
  });
  test('usuário desativado não faz login (RN05)', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'joao.pereira@biblioteca.faeterj.edu.br', senha: 'biblio123' });
    expect(r.status).toBe(403);
  });
  test('rota protegida sem token retorna 401', async () => {
    expect((await request(app).get('/api/livros')).status).toBe(401);
  });
  test('leitor não acessa função de bibliotecário (403)', async () => {
    const r = await request(app).post('/api/leitores').set(auth(tLeitora)).send({});
    expect(r.status).toBe(403);
  });
  test('bibliotecário não acessa gestão de usuários (403)', async () => {
    expect((await request(app).get('/api/usuarios').set(auth(tBib))).status).toBe(403);
  });
});

describe('US1 – Pesquisar livros', () => {
  test('busca por autor traz disponibilidade e localização', async () => {
    const r = await request(app).get('/api/livros?busca=Machado&campo=autor').set(auth(tLeitora));
    expect(r.status).toBe(200);
    const dom = r.body.find((l) => l.titulo === 'Dom Casmurro');
    expect(dom).toMatchObject({ disponiveis: 2, totalExemplares: 3, localizacao: 'Estante B3' });
  });
  test('busca sem resultado devolve lista vazia', async () => {
    const r = await request(app).get('/api/livros?busca=xyzinexistente').set(auth(tLeitora));
    expect(r.body).toEqual([]);
  });
});

describe('US4 – Cadastrar leitor (RN03, RN04)', () => {
  test('impede matrícula duplicada', async () => {
    const r = await request(app).post('/api/leitores').set(auth(tBib))
      .send({ nome: 'Outra Pessoa', matricula: '2024100123', email: 'outra@aluno.faeterj.edu.br', telefone: '(24) 99999-1111' });
    expect(r.status).toBe(409);
    expect(r.body.mensagem).toBe('Matrícula já cadastrada.');
  });
  test('impede cadastro sem campo obrigatório', async () => {
    const r = await request(app).post('/api/leitores').set(auth(tBib)).send({ nome: 'Sem Matrícula', email: 'x@y.com', telefone: '24999990000' });
    expect(r.status).toBe(400);
  });
});

describe('US6/US7 – Empréstimo e devolução (RN01)', () => {
  test('não empresta exemplar já emprestado', async () => {
    const carlos = await prisma.usuario.findUnique({ where: { email: 'carlos.lima@aluno.faeterj.edu.br' } });
    const ex = await prisma.exemplar.findFirst({ where: { status: 'EMPRESTADO' } });
    const r = await request(app).post('/api/emprestimos').set(auth(tBib)).send({ leitorId: carlos.id, exemplarId: ex.id });
    expect(r.status).toBe(409);
  });
  test('leitor com atraso não pode pegar novo empréstimo', async () => {
    const ana = await prisma.usuario.findUnique({ where: { email: 'ana.souza@aluno.faeterj.edu.br' } });
    const ex = await prisma.exemplar.findFirst({ where: { status: 'DISPONIVEL' } });
    const r = await request(app).post('/api/emprestimos').set(auth(tBib)).send({ leitorId: ana.id, exemplarId: ex.id });
    expect(r.status).toBe(409);
    expect(r.body.mensagem).toMatch(/atraso/);
  });
  test('empresta exemplar disponível e calcula a data prevista (14 dias)', async () => {
    const carlos = await prisma.usuario.findUnique({ where: { email: 'carlos.lima@aluno.faeterj.edu.br' } });
    const livro = await prisma.livro.findFirst({ where: { titulo: 'Vidas Secas' }, include: { exemplares: true } });
    const ex = livro.exemplares.find((e) => e.status === 'DISPONIVEL');
    const r = await request(app).post('/api/emprestimos').set(auth(tBib)).send({ leitorId: carlos.id, codigoExemplar: ex.codigo });
    expect(r.status).toBe(201);
    expect(r.body.diasRestantes).toBe(14);
    const depois = await prisma.exemplar.findUnique({ where: { id: ex.id } });
    expect(depois.status).toBe('EMPRESTADO');
  });
  test('devolução com fila de reserva deixa o exemplar RESERVADO para o 1º da fila', async () => {
    const emp = await prisma.emprestimo.findFirst({ where: { status: 'ATIVO', exemplar: { livro: { titulo: 'Memórias Póstumas de Brás Cubas' } } } });
    const r = await request(app).post(`/api/emprestimos/${emp.id}/devolucao`).set(auth(tBib));
    expect(r.status).toBe(200);
    expect(r.body.statusExemplar).toBe('RESERVADO');
    expect(r.body.reservadoPara.nome).toBe('Paula Nunes');
  });
  test('devolução atrasada é sinalizada', async () => {
    const emp = await prisma.emprestimo.findFirst({ where: { status: 'ATIVO', exemplar: { livro: { titulo: 'Os Sertões' } } } });
    const r = await request(app).post(`/api/emprestimos/${emp.id}/devolucao`).set(auth(tBib));
    expect(r.body.houveAtraso).toBe(true);
    expect(r.body.diasAtraso).toBe(32);
  });
});

describe('US3 – Reservar livro (RN02)', () => {
  test('não permite reservar livro com exemplar disponível', async () => {
    const livro = await prisma.livro.findFirst({ where: { titulo: 'Dom Casmurro' } });
    const r = await request(app).post('/api/reservas').set(auth(tCarlos)).send({ livroId: livro.id });
    expect(r.status).toBe(409);
  });
  test('reserva livro indisponível e informa a posição na fila', async () => {
    const livro = await prisma.livro.findFirst({ where: { titulo: 'O Cortiço' } });
    const r = await request(app).post('/api/reservas').set(auth(tCarlos)).send({ livroId: livro.id });
    expect(r.status).toBe(201);
    expect(r.body.posicaoFila).toBe(1);
    const dup = await request(app).post('/api/reservas').set(auth(tCarlos)).send({ livroId: livro.id });
    expect(dup.status).toBe(409);
  });
});

describe('US8 e US9 – Relatórios e gestão de usuários', () => {
  test('relatório traz totais do período', async () => {
    const r = await request(app).get('/api/relatorios/emprestimos?inicio=2000-01-01&fim=2100-01-01').set(auth(tBib));
    expect(r.status).toBe(200);
    expect(r.body.totais.emprestimos).toBeGreaterThan(40);
  });
  test('administrador desativa funcionário sem apagar o histórico', async () => {
    const marta = await prisma.usuario.findUnique({ where: { email: 'bibliotecaria@biblioteca.faeterj.edu.br' } });
    const r = await request(app).patch(`/api/usuarios/${marta.id}`).set(auth(tAdmin)).send({ ativo: false });
    expect(r.body.ativo).toBe(false);
    expect(await prisma.emprestimo.count({ where: { bibliotecarioId: marta.id } })).toBeGreaterThan(0);
    await request(app).patch(`/api/usuarios/${marta.id}`).set(auth(tAdmin)).send({ ativo: true });
  });
});
