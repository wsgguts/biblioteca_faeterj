# Biblioteca Digital FAETERJ

Sistema de Gerenciamento de Biblioteca da FAETERJ Barra Mansa. Trabalho da disciplina **T303 – Análise e Projeto de Sistemas** (Prof. Paulo Cesar Madeira de Oliveira), entregue como incremento do **Encontro 6 – Sprint de Desenvolvimento Auxiliado por IA**.

**Equipe:** Willian (Scrum Master), Euripedes, Daniel e Simone.

O código foi gerado com o Claude (Anthropic) a partir do [Prompt Mestre](docs/PROMPT_MESTRE.md), que reúne o Product Backlog, as regras de negócio, a arquitetura do DAS (Encontro 4) e o Design System do Encontro 5. Os prompts de ajuste estão em [docs/PROMPTS_DE_REFINAMENTO.md](docs/PROMPTS_DE_REFINAMENTO.md).

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | React 18 + Vite, React Router, Axios, ícones Lucide, fontes Inter e Merriweather |
| Back-end | Node.js + Express em camadas (rotas → middlewares → controllers → services → repositories) |
| Dados | SQLite com Prisma ORM |
| Segurança | Login com JWT, senhas com bcrypt, controle de acesso por perfil |
| Validação | Zod, com mensagens em português |
| Testes | Jest + Supertest (API) e Playwright (fluxos no navegador) |

## Pré-requisitos

- **Node.js 20 ou superior** (inclui o npm). Confira com `node -v`.
- Git, para clonar o repositório.
- Não é preciso instalar banco de dados: o SQLite é um arquivo criado automaticamente.

## Como executar

Use dois terminais, um para a API e outro para a interface.

**Terminal 1 – API (porta 3000)**

```bash
git clone https://github.com/wsgguts/biblioteca_faeterj.git
cd biblioteca_faeterj/backend
npm install
npm run setup     # cria o .env, o banco SQLite e carrega os dados de exemplo
npm run dev
```

**Terminal 2 – Interface (porta 5173)**

```bash
cd biblioteca_faeterj/frontend
npm install
npm run dev
```

Abra **http://localhost:5173** no navegador.

> `npm run setup` apaga e recria o banco. Rode de novo sempre que quiser voltar aos dados iniciais.

## Credenciais de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@biblioteca.faeterj.edu.br | admin123 |
| Bibliotecário | bibliotecaria@biblioteca.faeterj.edu.br | biblio123 |
| Leitor (com atraso) | ana.souza@aluno.faeterj.edu.br | leitor123 |
| Leitor (sem pendências) | carlos.lima@aluno.faeterj.edu.br | leitor123 |

O usuário `joao.pereira@biblioteca.faeterj.edu.br` está desativado de propósito, para testar o bloqueio de acesso (RN05).

## O que testar

| História | Onde | Roteiro sugerido |
|---|---|---|
| US1 Login | /login | Entrar com cada perfil; errar a senha; tentar com o usuário desativado |
| US2 Pesquisar livros | Pesquisar livros | Buscar "Machado" no campo Autor; usar os filtros Disponíveis/Indisponíveis |
| US3 Reservar | Pesquisar livros (Leitor) | Com a Ana, reservar "Memórias Póstumas" (entra em 2º na fila) |
| US2 Meus empréstimos | Meus empréstimos (Leitor) | Ver o alerta de atraso, o prazo vencendo e cancelar uma reserva |
| US6 Empréstimo | Registrar empréstimo | Ana é bloqueada por atraso; Carlos + exemplar EX-0019 é aceito com prazo de 14 dias |
| US7 Devolução | Registrar devolução | Devolver "Os Sertões" (32 dias de atraso) e "Memórias Póstumas" (fica reservado para Paula) |
| US4 Cadastrar leitor | Cadastrar leitor | Tentar um e-mail repetido; cadastrar um leitor novo (senha inicial = matrícula) |
| US5 Cadastrar livro | Cadastrar livro | Cadastrar com 2 exemplares e conferir os códigos gerados |
| US8 Relatórios | Relatórios | Ver totais, gráfico por mês e atrasos; tentar um período invertido |
| US9 Usuários | Usuários do sistema (Admin) | Criar um bibliotecário, desativar e reativar |

## Testes automatizados

```bash
cd backend
npm test                 # 18 testes de API (Jest + Supertest), em banco separado test.db
```

O roteiro de testes no navegador fica em `docs/testes/fluxos.js` (Playwright, 24 casos). Ele altera os dados, então rode `npm run setup` no back-end antes. Com a API e a interface rodando:

```bash
cd docs/testes
npm install
npx playwright install chromium
npm test                 # salva as capturas em docs/prints
```

## Regras de negócio

- **RN01** Só é possível emprestar exemplar com situação Disponível (ou Reservado para o próprio leitor, 1º da fila).
- **RN02** Reserva só para livro sem exemplar disponível; a fila é por ordem de chegada.
- **RN03** Matrícula e e-mail são únicos.
- **RN04** Leitor com empréstimo em atraso não pode pegar novo livro.
- **RN05** Usuários são desativados, nunca apagados, para manter o histórico.
- Prazo de empréstimo: **14 dias** (ajustável em `PRAZO_EMPRESTIMO_DIAS` no `.env`).

## Estrutura

```
backend/
  prisma/schema.prisma   modelo de dados (Usuario, Livro, Exemplar, Emprestimo, Reserva, Relatorio)
  prisma/seed.js         dados de exemplo
  src/routes             rotas e schemas de validação
  src/middlewares        autenticação JWT, perfil, validação, erros
  src/controllers        recebem a requisição e devolvem JSON
  src/services           regras de negócio (RN01 a RN05)
  src/repositories       acesso ao banco via Prisma
  tests/                 testes de API
frontend/
  src/pages              uma tela por caso de uso
  src/components         layout, menu por perfil e componentes do Design System
  src/styles/global.css  tokens de cor, tipografia e componentes
docs/
  PROMPT_MESTRE.md       prompt principal usado na IA
  PROMPTS_DE_REFINAMENTO.md
  testes/ e prints/      roteiro de testes funcionais e capturas
```

## API (resumo)

Todas as rotas ficam em `/api` e, exceto o login, exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Perfil |
|---|---|---|
| POST | /auth/login | público |
| GET | /auth/me | todos |
| GET | /livros?busca=&campo= | todos |
| POST | /livros | Bibliotecário |
| GET | /emprestimos/meus | Leitor |
| GET | /emprestimos?busca= | Bibliotecário |
| POST | /emprestimos/verificar · /emprestimos | Bibliotecário |
| POST | /emprestimos/:id/devolucao | Bibliotecário |
| GET · POST · DELETE | /reservas/minhas · /reservas · /reservas/:id | Leitor |
| GET · POST | /leitores | Bibliotecário |
| GET | /relatorios/emprestimos?inicio=&fim= | Bibliotecário |
| GET · POST · PATCH | /usuarios · /usuarios/:id | Administrador |
