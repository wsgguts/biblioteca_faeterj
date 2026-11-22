const { requisicaoInvalida } = require('../utils/erros');

/** Valida req[origem] com um schema Zod e substitui pelos dados já convertidos. */
function validar(schema, origem = 'body') {
  return (req, _res, next) => {
    const resultado = schema.safeParse(req[origem]);
    if (!resultado.success) {
      const primeiro = resultado.error.issues[0];
      return next(requisicaoInvalida(primeiro.message));
    }
    req[origem] = resultado.data;
    next();
  };
}

module.exports = validar;
