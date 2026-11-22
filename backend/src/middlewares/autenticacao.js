const jwt = require('jsonwebtoken');
const { jwtSegredo } = require('../config');
const usuarioRepository = require('../repositories/usuarioRepository');
const { naoAutenticado, proibido } = require('../utils/erros');

/** Valida o token JWT e carrega o usuário (ativo) em req.usuario. */
async function autenticar(req, _res, next) {
  try {
    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) throw naoAutenticado('Faça login para continuar.');
    let payload;
    try {
      payload = jwt.verify(token, jwtSegredo);
    } catch {
      throw naoAutenticado('Sessão expirada. Faça login novamente.');
    }
    const usuario = await usuarioRepository.buscarPorId(payload.sub);
    if (!usuario) throw naoAutenticado('Usuário não encontrado.');
    if (!usuario.ativo) throw proibido('Usuário desativado. Procure a administração da biblioteca.'); // RN05
    req.usuario = usuario;
    next();
  } catch (e) {
    next(e);
  }
}

/** Libera a rota apenas para os perfis informados. */
function autorizarPerfil(...perfis) {
  return (req, _res, next) => {
    if (!perfis.includes(req.usuario.perfil)) {
      return next(proibido('Você não tem permissão para acessar esta área.'));
    }
    next();
  };
}

module.exports = { autenticar, autorizarPerfil };
