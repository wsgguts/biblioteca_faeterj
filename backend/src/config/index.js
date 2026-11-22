require('dotenv').config();

module.exports = {
  porta: Number(process.env.PORT) || 3000,
  jwtSegredo: process.env.JWT_SECRET || 'chave-de-desenvolvimento',
  jwtExpiraEm: process.env.JWT_EXPIRA_EM || '8h',
  prazoEmprestimoDias: Number(process.env.PRAZO_EMPRESTIMO_DIAS) || 14,
};
