# Prompt Mestre – Biblioteca Digital FAETERJ

> Prompt principal usado no Encontro 6 (Desenvolvimento Auxiliado por IA). Ele foi montado a partir do Product Backlog e da ERS (Encontro 2), do Documento de Arquitetura de Software (Encontro 4) e do Product Design (Encontro 5). Depois dele vieram prompts menores de refinamento, listados em `docs/PROMPTS_DE_REFINAMENTO.md`.

---

## 1. Papel e objetivo

Você é um desenvolvedor full stack sênior. Gere o código-fonte completo e executável do **Sistema de Gerenciamento de Biblioteca – Biblioteca Digital FAETERJ**, um sistema web para informatizar a consulta ao acervo, o cadastro de leitores e livros, os empréstimos, as devoluções, as reservas e os relatórios da biblioteca da FAETERJ Barra Mansa. Todo o texto da interface, as mensagens de erro e os comentários devem estar em **português do Brasil**, com linguagem simples (sem jargão de biblioteconomia).

## 2. Contexto do projeto

- Atores e perfis de acesso: **Leitor** (pesquisa livros, consulta seus empréstimos, reserva livros), **Bibliotecário** (cadastra leitores e livros, registra empréstimos e devoluções, gera relatórios) e **Administrador** (gerencia usuários funcionários e perfis).
- O sistema será apresentado como incremento funcional ao final do semestre, rodando localmente com poucos comandos.

## 3. Tecnologias escolhidas (obrigatórias, conforme o DAS)

- **Front-end:** React 18 + Vite, React Router, Axios, ícones `lucide-react`, fontes `@fontsource/inter` e `@fontsource/merriweather`. CSS puro com variáveis (sem framework de CSS).
- **Back-end:** Node.js 20+ com Express, arquitetura em camadas **routes → middlewares → controllers → services → repositories**, ORM **Prisma** com **SQLite** (arquivo local), autenticação **JWT** (`jsonwebtoken`) e senhas com **bcrypt** (`bcryptjs`), validação com **Zod**.
- **Testes:** Jest + Supertest para a API.
- Monorepo com as pastas `backend/` e `frontend/` e um `README.md` com o guia de execução.

## 4. Modelo de dados (schema Prisma)

- `Usuario`: id, nome, email (único), telefone, matricula (única, obrigatória para LEITOR), senhaHash, perfil (`LEITOR` | `BIBLIOTECARIO` | `ADMINISTRADOR`), ativo (boolean), criadoEm.
- `Livro`: id, isbn (único, opcional), titulo, autor, editora, ano, assunto, criadoEm. Um livro possui 1..N `Exemplar`.
- `Exemplar`: id, livroId, codigo (único, ex.: `EX-0388`), localizacao (ex.: `Estante B3`), status (`DISPONIVEL` | `EMPRESTADO` | `RESERVADO` | `MANUTENCAO`).
- `Emprestimo`: id, leitorId, exemplarId, bibliotecarioId, dataEmprestimo, dataPrevistaDevolucao, dataDevolucao (nula até devolver), status (`ATIVO` | `DEVOLVIDO`). “Atrasado” é calculado: ativo com data prevista menor que hoje.
- `Reserva`: id, leitorId, livroId, dataReserva, posicaoFila, ativa.
- `Relatorio`: id, geradoPorId, tipo, periodoInicio, periodoFim, dataGeracao (histórico de relatórios gerados).

## 5. Histórias de usuário e critérios de aceitação (Product Backlog)

| US | História | Critérios de aceitação |
|----|----------|------------------------|
| US1 | Como leitor, quero pesquisar um livro por título, autor ou assunto, para encontrar rapidamente a obra. | Busca por título, autor ou assunto; exibir título, autor, localização e disponibilidade; avisar quando nada for encontrado. |
| US2 | Como leitor, quero consultar meus empréstimos, para lembrar as datas de devolução. | Mostrar livros emprestados; exibir data prevista; destacar atrasados. |
| US3 | Como leitor, quero reservar um livro indisponível, para ser avisado quando ele voltar. | Reserva só quando não houver exemplar disponível; registrar a ordem da fila; exibir confirmação. |
| US4 | Como bibliotecário, quero cadastrar um leitor. | Pedir nome, matrícula, e-mail e telefone; impedir cadastro sem obrigatórios; avisar matrícula já cadastrada. |
| US5 | Como bibliotecário, quero cadastrar um livro no acervo. | Pedir título, autor, editora, ano e quantidade de exemplares; gerar identificador; confirmar inclusão. |
| US6 | Como bibliotecário, quero registrar a retirada de um livro. | Selecionar leitor e exemplar; só emprestar se houver exemplar disponível; registrar data do empréstimo e data prevista. |
| US7 | Como bibliotecário, quero registrar a devolução. | Localizar o empréstimo em aberto; registrar data real; atualizar exemplar e sinalizar atraso. |
| US8 | Como bibliotecário, quero gerar relatório de empréstimos e atrasos. | Escolher período; mostrar ativos, devolvidos e atrasados. |
| US9 | Como administrador, quero cadastrar e desativar usuários funcionários. | Cadastrar com perfil; desativar sem apagar histórico; exigir login e senha nas funções restritas. |

## 6. Regras de negócio (validar sempre no back-end)

- **RN01:** só empresta se o exemplar estiver `DISPONIVEL` (ou `RESERVADO` para o primeiro leitor da fila daquele livro).
- **RN02:** só reserva se nenhum exemplar do livro estiver disponível; o mesmo leitor não pode ter duas reservas ativas do mesmo livro, nem reservar um livro que já está com ele.
- **RN03:** leitor exige nome, matrícula, e-mail e telefone.
- **RN04:** matrícula e e-mail não podem se repetir.
- **RN05:** usuário desativado não faz login, mas o histórico é mantido (nunca apagar).
- Prazo do empréstimo: variável `PRAZO_EMPRESTIMO_DIAS` (padrão 14). Leitor com empréstimo atrasado não pode pegar novo empréstimo.
- Devolução: se houver reserva ativa do livro, o exemplar fica `RESERVADO` para o 1º da fila; senão volta a `DISPONIVEL`. Empréstimo e devolução devem rodar em **transação**.

## 7. API REST (prefixo `/api`, JSON, token `Authorization: Bearer`)

`POST /auth/login` (público) · `GET /auth/me` · `GET /livros?busca=&campo=titulo|autor|assunto` · `GET /livros/:id` · `POST /livros` (bib) · `GET /emprestimos/meus` (leitor) · `GET /emprestimos?status=ativos` (bib) · `POST /emprestimos` (bib) · `POST /emprestimos/:id/devolucao` (bib) · `GET /reservas/minhas` · `POST /reservas` (leitor) · `DELETE /reservas/:id` (leitor) · `GET /leitores?busca=` (bib) · `POST /leitores` (bib) · `GET /relatorios/emprestimos?inicio=&fim=` (bib) · `GET /usuarios`, `POST /usuarios`, `PATCH /usuarios/:id` (admin).
Códigos: 200, 201, 400 (validação), 401, 403 (perfil), 404, 409 (regra de negócio). Mensagens de erro em português no campo `mensagem`.

## 8. Design System (Encontro 5) – siga exatamente

```css
:root{
  --cor-primaria:#0D6E6E; --cor-primaria-escura:#0A5454; --cor-primaria-clara:#E3F1F1;
  --cor-destaque:#C8913A; --cor-destaque-clara:#FBF3E6;
  --cor-texto:#1F2933; --cor-texto-sec:#52606D; --cor-borda:#D9DEE3;
  --cor-fundo:#F5F7F6; --cor-superficie:#FFFFFF;
  --cor-sucesso:#1E7B34; --cor-sucesso-bg:#E6F4EA; --cor-alerta:#8A5A00; --cor-alerta-bg:#FFF4DB;
  --cor-erro:#B42318; --cor-erro-bg:#FDECEA; --cor-info:#175CD3; --cor-info-bg:#E8F0FD;
  --fonte-ui:'Inter',system-ui,sans-serif; --fonte-titulo-livro:'Merriweather',Georgia,serif;
  --raio:8px; --raio-lg:12px;
}
```

- Tipografia: H1 Inter 700 26px; H2 Inter 600 19px; corpo Inter 400 15px; legenda 13px; **títulos de livros em Merriweather 700**.
- Layout: menu lateral fixo verde-petróleo escuro (`--cor-primaria-escura`) com logo âmbar, itens com ícone + rótulo, item ativo com barra âmbar à esquerda; menu muda conforme o perfil. Cabeçalho branco com trilha (ex.: “Acervo / Pesquisar livros”) e nome + perfil do usuário. Conteúdo em cartões brancos com borda `--cor-borda` sobre fundo `--cor-fundo`.
- Badges de situação com ícone + texto: Disponível (verde), Emprestado (azul), Reservado (âmbar), Atrasado (vermelho), Manutenção (cinza). Nunca indicar estado só pela cor.
- Um único botão primário (preenchido) por tela/cartão; secundário contornado; terciário só texto.
- Telas: Login (painel de marca à esquerda + cartão de formulário), Pesquisar livros (cartões de livro com capa colorida, badge e botão Reservar só quando indisponível, toast de confirmação), Meus empréstimos (alerta de atraso no topo, 3 indicadores, tabela com badges “Atrasado há N dias / Vence em N dias / No prazo”, reservas com cancelar), Registrar empréstimo (etapas Leitor → Exemplar → Confirmar, resumo com data prevista), Registrar devolução, Cadastrar leitor, Cadastrar livro, Relatórios (filtros de período, 4 indicadores, gráfico de barras por mês, tabela de atrasados), Gestão de usuários (admin).

## 9. Entregáveis esperados

1. Estrutura de pastas completa e todos os arquivos, sem trechos omitidos.
2. `prisma/seed.js` com dados de teste: um usuário de cada perfil, leitores, livros brasileiros clássicos com exemplares em situações variadas (disponível, emprestado, reservado e um empréstimo atrasado).
3. `README.md` com pré-requisitos, instalação, execução e credenciais de teste.
4. Testes de integração da API para login, permissões por perfil, RN01 e RN02.
