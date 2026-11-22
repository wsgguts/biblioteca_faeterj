const { execSync } = require('child_process');
const path = require('path');

// Banco separado para os testes, recriado a cada execução.
module.exports = async () => {
  process.env.DATABASE_URL = 'file:./test.db';
  const opts = { cwd: path.join(__dirname, '..'), stdio: 'ignore', env: { ...process.env } };
  execSync('npx prisma db push --force-reset --accept-data-loss --skip-generate', opts);
  execSync('node prisma/seed.js', opts);
};
