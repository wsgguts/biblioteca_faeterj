# Prompts de refinamento

Depois do [Prompt Mestre](PROMPT_MESTRE.md), o código foi gerado em partes e ajustado com os prompts abaixo, todos enviados ao **Claude (Anthropic)**. Cada prompt traz o problema encontrado no teste e o resultado esperado, em vez de pedir "conserte".

## 1. Divisão da geração em partes

> Gere apenas o back-end primeiro: `schema.prisma`, seed com os dados de exemplo da seção 4 e a API completa da seção 7, organizada em routes, middlewares, controllers, services e repositories, como no DAS. Não gere o front-end ainda. No fim, escreva testes Jest + Supertest para cada história (US1 a US9) cobrindo pelo menos um caminho feliz e uma regra de negócio violada.

> Agora gere o front-end React + Vite. Use exatamente as variáveis CSS e os componentes da seção 8 (badge sempre com ícone e texto, botões primário/secundário/fantasma, alerta, toast). Uma página por caso de uso, rotas protegidas por perfil e menu lateral agrupado por Atendimento, Acervo e Gestão.

## 2. Banco de dados

> O Prisma com SQLite não aceita `enum`. Troque os enums de perfil e situação por `String` com valor padrão e documente os valores permitidos em comentário. A validação dos valores deve ficar no Zod e nos services.

> O `Usuario` tem duas relações com `Emprestimo` (como leitor e como bibliotecário que registrou). Nomeie as relações para o Prisma não acusar ambiguidade.

## 3. Regras de negócio

> Na devolução, se houver reserva ativa para o livro, o exemplar não pode voltar para Disponível: ele deve ficar Reservado para o 1º da fila, e a tela precisa avisar o bibliotecário para guardar o livro no balcão. No empréstimo, um exemplar Reservado só pode sair para o leitor que está em 1º lugar.

> Calcule o atraso por dia de calendário, não por horas. Um livro com devolução prevista para hoje ainda está no prazo.

> Entre a verificação do exemplar e a gravação do empréstimo outro bibliotecário pode emprestar o mesmo exemplar. Faça o registro dentro de uma transação e confira de novo a situação do exemplar.

## 4. Interface

> Na pesquisa, o botão "Reservar" só deve aparecer para o perfil Leitor e apenas quando não houver exemplar disponível. Se o leitor já tiver reserva ou já estiver com o livro, mostre isso no lugar do botão.

> O selo "Vencendo" só aparece com 3 dias ou menos, e o empréstimo com vencimento em 4 dias aparece como "No prazo". Use 5 dias como limite, para o leitor ser avisado com antecedência.

> Os avisos (toasts) se acumulam quando o bibliotecário faz várias operações seguidas e cobrem os cartões de resumo. Mostre no máximo 3 ao mesmo tempo.

> Em telas menores que 900 px o menu lateral some e o usuário fica sem navegação e sem o botão Sair. Adicione um botão de menu no cabeçalho que abre o menu sobre a página e fecha ao escolher uma opção.

> O formulário de empréstimo em duas colunas fica espremido no celular. Use a classe `duas-col`, que vira uma coluna na quebra de 900 px, em vez de `gridTemplateColumns` direto no `style`.

## 5. Documentação e execução

> Crie um script `npm run setup` que copie o `.env.example` para `.env`, crie o banco SQLite e rode o seed, para quem for avaliar o projeto não precisar executar comandos do Prisma.

> Escreva o README com pré-requisitos, passo a passo de instalação, credenciais de teste por perfil e um roteiro de teste por história de usuário.
