const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSegredo, jwtExpiraEm } = require('../config');
const usuarioRepository = require('../repositories/usuarioRepository');
const { naoAutenticado, proibido } = require('../utils/erros');

function publico(u) {
  const { senhaHash, ...resto } = u;
  return resto;
}

async function login(email, senha) {
  const usuario = await usuarioRepository.buscarPorEmail(email.trim().toLowerCase());
  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    throw naoAutenticado('E-mail ou senha incorretos. Tente novamente.');
  }
  if (!usuario.ativo) throw proibido('Usuário desativado. Procure a administração da biblioteca.'); // RN05
  const token = jwt.sign({ sub: usuario.id, perfil: usuario.perfil }, jwtSegredo, { expiresIn: jwtExpiraEm });
  return { token, usuario: publico(usuario) };
}

module.exports = { login, publico };
