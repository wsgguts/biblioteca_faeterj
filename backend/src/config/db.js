const { PrismaClient } = require('@prisma/client');

// Uma única instância do Prisma Client para toda a aplicação.
const prisma = new PrismaClient();

module.exports = prisma;
