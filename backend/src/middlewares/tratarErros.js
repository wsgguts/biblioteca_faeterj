const { ErroApp } = require('../utils/erros');

// eslint-disable-next-line no-unused-vars
function tratarErros(err, _req, res, _next) {
  if (err instanceof ErroApp) {
    return res.status(err.status).json({ mensagem: err.message });
  }
  if (err.code === 'P2002') {
    // violação de campo único do Prisma
    return res.status(409).json({ mensagem: 'Já existe um registro com estes dados.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'JSON inválido na requisição.' });
  }
  console.error(err);
  return res.status(500).json({ mensagem: 'Erro interno. Tente novamente em instantes.' });
}

module.exports = tratarErros;
