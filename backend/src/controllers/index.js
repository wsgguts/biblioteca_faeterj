// Controllers: recebem a requisição, chamam o service e devolvem JSON (padrão MVC do DAS).
const authService = require('../services/authService');
const livroService = require('../services/livroService');
const emprestimoService = require('../services/emprestimoService');
const reservaService = require('../services/reservaService');
const usuarioService = require('../services/usuarioService');
const relatorioService = require('../services/relatorioService');

/** Encaminha erros de funções assíncronas para o middleware tratarErros. */
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const authController = {
  login: h(async (req, res) => res.json(await authService.login(req.body.email, req.body.senha))),
  eu: h(async (req, res) => res.json(authService.publico(req.usuario))),
};

const livroController = {
  pesquisar: h(async (req, res) => res.json(await livroService.pesquisar(req.query, req.usuario))),
  detalhar: h(async (req, res) => res.json(await livroService.detalhar(req.params.id, req.usuario))),
  cadastrar: h(async (req, res) => res.status(201).json(await livroService.cadastrar(req.body))),
};

const emprestimoController = {
  meus: h(async (req, res) => res.json(await emprestimoService.meus(req.usuario.id))),
  ativos: h(async (req, res) => res.json(await emprestimoService.ativos(req.query.busca))),
  verificar: h(async (req, res) => {
    const { reservaUsada, ...v } = await emprestimoService.verificar(req.body);
    res.json({ ...v, atendeReserva: Boolean(reservaUsada) });
  }),
  registrar: h(async (req, res) => res.status(201).json(await emprestimoService.registrar(req.body, req.usuario.id))),
  devolver: h(async (req, res) => res.json(await emprestimoService.devolver(req.params.id))),
};

const reservaController = {
  minhas: h(async (req, res) => res.json(await reservaService.minhas(req.usuario.id))),
  reservar: h(async (req, res) => res.status(201).json(await reservaService.reservar(req.usuario.id, req.body.livroId))),
  cancelar: h(async (req, res) => {
    await reservaService.cancelar(req.usuario.id, req.params.id);
    res.status(204).end();
  }),
};

const usuarioController = {
  pesquisarLeitores: h(async (req, res) => res.json(await usuarioService.pesquisarLeitores(req.query.busca))),
  cadastrarLeitor: h(async (req, res) => res.status(201).json(await usuarioService.cadastrarLeitor(req.body))),
  listarFuncionarios: h(async (_req, res) => res.json(await usuarioService.listarFuncionarios())),
  cadastrarFuncionario: h(async (req, res) => res.status(201).json(await usuarioService.cadastrarFuncionario(req.body))),
  atualizarFuncionario: h(async (req, res) => res.json(await usuarioService.atualizarFuncionario(req.params.id, req.body, req.usuario))),
};

const relatorioController = {
  emprestimos: h(async (req, res) => res.json(await relatorioService.emprestimos(req.query, req.usuario))),
};

module.exports = {
  authController, livroController, emprestimoController, reservaController, usuarioController, relatorioController,
};
