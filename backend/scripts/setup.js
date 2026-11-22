/* Prepara o back-end com um único comando: cria o .env, o banco SQLite e os dados de teste. */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const env = path.join(raiz, '.env');
if (!fs.existsSync(env)) {
  fs.copyFileSync(path.join(raiz, '.env.example'), env);
  console.log('Arquivo .env criado a partir de .env.example');
}
const rodar = (cmd) => execSync(cmd, { cwd: raiz, stdio: 'inherit' });
rodar('npx prisma db push --force-reset --accept-data-loss');
rodar('node prisma/seed.js');
console.log('\nPronto! Rode "npm run dev" para iniciar a API.');
