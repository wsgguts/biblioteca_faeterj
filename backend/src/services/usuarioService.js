const bcrypt = require('bcryptjs');
const usuarioRepository = require('../repositories/usuarioRepository');
const { conflito, naoEncontrado, requisicaoInvalida } = require('../utils/erros');

/** US4 / UC004 – cadastro de leitor (RN03 e RN04). A senha inicial é a matrícula. */
async function cadastrarLeitor({ nome, matricula, email, telefone }) {
  email = email.trim().toLowerCase();
  if (await usuarioRepository.buscarPorMatricula(matricula)) throw conflito('Matrícula já cadastrada.');
  if (await usuarioRepository.buscarPorEmail(email)) throw conflito('E-mail já cadastrado.');
  return usuarioRepository.criar({
    nome, matricula, email, telefone, perfil: 'LEITOR', senhaHash: await bcrypt.hash(matricula, 10),
  });
}

const pesquisarLeitores = (busca) => usuarioRepository.pesquisarLeitores(busca?.trim());

/** US9 / UC009 – funcionários (bibliotecários e administradores). */
const listarFuncionarios = () => usuarioRepository.listarFuncionarios();

async function cadastrarFuncionario({ nome, email, telefone, perfil, senha }) {
  email = email.trim().toLowerCase();
  if (await usuarioRepository.buscarPorEmail(email)) throw conflito('E-mail já cadastrado.');
  return usuarioRepository.criar({ nome, email, telefone, perfil, senhaHash: await bcrypt.hash(senha, 10) });
}

async function atualizarFuncionario(id, { perfil, ativo }, adminLogado) {
  const alvo = await usuarioRepository.buscarPorId(id);
  if (!alvo || alvo.perfil === 'LEITOR') throw naoEncontrado('Usuário não encontrado.');
  if (alvo.id === adminLogado.id && (ativo === false || (perfil && perfil !== alvo.perfil))) {
    throw requisicaoInvalida('Você não pode desativar ou alterar o perfil do seu próprio usuário.');
  }
  // RN05: desativar não apaga o histórico, apenas bloqueia o acesso
  return usuarioRepository.atualizar(id, { ...(perfil ? { perfil } : {}), ...(ativo !== undefined ? { ativo } : {}) });
}

module.exports = { cadastrarLeitor, pesquisarLeitores, listarFuncionarios, cadastrarFuncionario, atualizarFuncionario };
