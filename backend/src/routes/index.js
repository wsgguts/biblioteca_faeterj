const { Router } = require('express');
const { autenticar, autorizarPerfil } = require('../middlewares/autenticacao');
const validar = require('../middlewares/validar');
const s = require('./schemas');
const {
  authController, livroController, emprestimoController, reservaController, usuarioController, relatorioController,
} = require('../controllers');

const LEITOR = 'LEITOR';
const BIB = 'BIBLIOTECARIO';
const ADMIN = 'ADMINISTRADOR';

const r = Router();

// Autenticação
r.post('/auth/login', validar(s.login), authController.login);
r.use(autenticar); // todas as rotas abaixo exigem token
r.get('/auth/me', authController.eu);

// Acervo (RF001, RF005)
r.get('/livros', validar(s.pesquisaLivro, 'query'), livroController.pesquisar);
r.get('/livros/:id', livroController.detalhar);
r.post('/livros', autorizarPerfil(BIB), validar(s.livro), livroController.cadastrar);

// Empréstimos (RF002, RF006, RF007)
r.get('/emprestimos/meus', autorizarPerfil(LEITOR), emprestimoController.meus);
r.get('/emprestimos', autorizarPerfil(BIB), emprestimoController.ativos);
r.post('/emprestimos/verificar', autorizarPerfil(BIB), validar(s.emprestimo), emprestimoController.verificar);
r.post('/emprestimos', autorizarPerfil(BIB), validar(s.emprestimo), emprestimoController.registrar);
r.post('/emprestimos/:id/devolucao', autorizarPerfil(BIB), emprestimoController.devolver);

// Reservas (RF003)
r.get('/reservas/minhas', autorizarPerfil(LEITOR), reservaController.minhas);
r.post('/reservas', autorizarPerfil(LEITOR), validar(s.reserva), reservaController.reservar);
r.delete('/reservas/:id', autorizarPerfil(LEITOR), reservaController.cancelar);

// Leitores (RF004)
r.get('/leitores', autorizarPerfil(BIB), usuarioController.pesquisarLeitores);
r.post('/leitores', autorizarPerfil(BIB), validar(s.leitor), usuarioController.cadastrarLeitor);

// Relatórios (RF008)
r.get('/relatorios/emprestimos', autorizarPerfil(BIB), validar(s.relatorio, 'query'), relatorioController.emprestimos);

// Usuários do sistema (RF009)
r.get('/usuarios', autorizarPerfil(ADMIN), usuarioController.listarFuncionarios);
r.post('/usuarios', autorizarPerfil(ADMIN), validar(s.funcionario), usuarioController.cadastrarFuncionario);
r.patch('/usuarios/:id', autorizarPerfil(ADMIN), validar(s.atualizarFuncionario), usuarioController.atualizarFuncionario);

module.exports = r;
