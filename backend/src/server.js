const app = require('./app');
const { porta } = require('./config');

app.listen(porta, () => {
  console.log(`API da Biblioteca Digital FAETERJ rodando em http://localhost:${porta}/api`);
});
