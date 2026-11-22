/** Erro esperado (regra de negócio, validação, permissão) com código HTTP. */
class ErroApp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

const naoEncontrado = (msg) => new ErroApp(404, msg);
const conflito = (msg) => new ErroApp(409, msg);
const requisicaoInvalida = (msg) => new ErroApp(400, msg);
const proibido = (msg) => new ErroApp(403, msg);
const naoAutenticado = (msg) => new ErroApp(401, msg);

module.exports = { ErroApp, naoEncontrado, conflito, requisicaoInvalida, proibido, naoAutenticado };
