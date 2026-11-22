// Testes funcionais (Etapa 2) – percorre os fluxos principais no navegador e salva capturas.
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:5173';
const OUT = process.argv[2] || path.join(__dirname, 'prints');
const resultados = [];
const errosConsole = [];

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 }, deviceScaleFactor: 2, locale: 'pt-BR' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errosConsole.push(m.text()); });
  page.on('pageerror', (e) => errosConsole.push(e.message));

  async function shot(nome, full = false) {
    // página inteira: aumenta a janela para o menu lateral acompanhar a altura
    if (full) {
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewportSize({ width: 1366, height: Math.max(860, h) });
    }
    await page.screenshot({ path: path.join(OUT, `${nome}.png`) });
    if (full) await page.setViewportSize({ width: 1366, height: 860 });
  }
  const fecharAvisos = async () => { for (const b of await page.getByRole('button', { name: 'Fechar' }).all()) await b.click().catch(() => {}); };
  async function caso(nome, fn) {
    try { await fn(); resultados.push(['OK', nome]); } catch (e) { resultados.push(['FALHOU', nome, e.message.split('\n')[0]]); }
  }
  const esperarTexto = (t) => page.getByText(t, { exact: false }).first().waitFor({ timeout: 5000 });

  async function login(email, senha) {
    await page.goto(`${BASE}/login`);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(senha);
    await page.getByRole('button', { name: 'Entrar' }).click();
  }
  async function sair() { await page.getByRole('button', { name: 'Sair' }).click(); await page.waitForURL('**/login'); }

  // Login (US9: acesso com e-mail e senha)
  await caso('Login: campos vazios mostram validação', async () => {
    await page.goto(`${BASE}/login`);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await esperarTexto('Informe o e-mail.');
  });
  await caso('Login: senha errada mostra mensagem genérica', async () => {
    await login('ana.souza@aluno.faeterj.edu.br', 'errada');
    await esperarTexto('E-mail ou senha');
    await page.waitForTimeout(400); // espera a transição do botão terminar
    await shot('01-login-erro');
  });
  await caso('Login: usuário desativado (RN05) é bloqueado', async () => {
    await login('joao.pereira@biblioteca.faeterj.edu.br', 'biblio123');
    await page.getByRole('alert').waitFor();
  });

  // Leitor
  await caso('Login: leitor entra e cai na pesquisa', async () => {
    await login('ana.souza@aluno.faeterj.edu.br', 'leitor123');
    await page.waitForURL('**/pesquisa');
    await esperarTexto('resultados');
    await shot('02-pesquisa-livros');
  });
  await caso('US1: pesquisa por autor filtra o acervo', async () => {
    await page.getByLabel('Pesquisar em').selectOption('autor');
    await page.getByLabel('Termo de busca').fill('Machado');
    await page.getByRole('button', { name: 'Pesquisar' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.livro-card').length > 0
      && [...document.querySelectorAll('.livro-card')].every((c) => c.textContent.includes('Machado')));
    await shot('03-pesquisa-autor');
  });
  await caso('US1: chip Indisponíveis mostra só livros sem exemplar', async () => {
    await page.getByRole('button', { name: 'Indisponíveis' }).click();
    await esperarTexto('Memórias Póstumas');
  });
  await caso('US3: reservar livro indisponível entra na fila (2º)', async () => {
    const card = page.locator('.livro-card', { hasText: 'Memórias Póstumas' });
    await card.getByRole('button', { name: 'Reservar' }).click();
    await esperarTexto('Reserva confirmada');
    await esperarTexto('2º da fila');
    await shot('04-reserva-confirmada');
  });
  await caso('US2: meus empréstimos mostra atraso e prazos', async () => {
    await page.getByRole('link', { name: 'Meus empréstimos' }).click();
    await esperarTexto('livro em atraso');
    await esperarTexto('Vence em 4 dias');
    await shot('05-meus-emprestimos', true);
  });
  await caso('Perfil: leitor não acessa tela de bibliotecário', async () => {
    await page.goto(`${BASE}/relatorios`);
    await page.waitForURL('**/pesquisa');
  });
  await sair();

  // Bibliotecário
  await caso('US6: leitor com atraso é impedido de novo empréstimo', async () => {
    await login('bibliotecaria@biblioteca.faeterj.edu.br', 'biblio123');
    await page.waitForURL('**/emprestimos/novo');
    await page.getByLabel('Nome ou matrícula').fill('Ana');
    await page.getByRole('option', { name: /Ana Souza/ }).click();
    await page.getByLabel('Código do exemplar').fill('EX-0019');
    await page.getByRole('button', { name: 'Verificar exemplar' }).click();
    await esperarTexto('empréstimo em atraso');
    await shot('06-emprestimo-bloqueado');
  });
  await caso('US6: exemplar inexistente é informado', async () => {
    await page.getByRole('button', { name: 'Trocar' }).click();
    await page.getByLabel('Nome ou matrícula').fill('Carlos');
    await page.getByRole('option', { name: /Carlos Lima/ }).click();
    await page.getByLabel('Código do exemplar').fill('EX-9999');
    await page.getByRole('button', { name: 'Verificar exemplar' }).click();
    await esperarTexto('Exemplar não encontrado');
  });
  await caso('US6: exemplar emprestado é recusado (RN01)', async () => {
    await page.getByLabel('Código do exemplar').fill('EX-0011');
    await page.getByRole('button', { name: 'Verificar exemplar' }).click();
    await esperarTexto('indisponível para empréstimo');
  });
  await caso('US6: empréstimo válido mostra resumo e é registrado', async () => {
    await page.getByLabel('Código do exemplar').fill('EX-0019');
    await page.getByRole('button', { name: 'Verificar exemplar' }).click();
    await esperarTexto('Confirme os dados');
    await esperarTexto('14 dias');
    await shot('07-emprestimo-confirmacao', true);
    await page.getByRole('button', { name: 'Confirmar empréstimo' }).click();
    await esperarTexto('Empréstimo registrado com sucesso');
    await shot('08-emprestimo-sucesso');
  });
  await caso('US7: devolução com atraso e reserva na fila', async () => {
    await page.getByRole('link', { name: 'Registrar devolução' }).click();
    await page.getByLabel('Buscar empréstimo').fill('Memórias');
    const linha = page.locator('tr', { hasText: 'Memórias Póstumas' });
    await linha.getByRole('button', { name: 'Devolver' }).click();
    await esperarTexto('reservado para Paula');
    await shot('09-devolucao-reserva');
  });
  await caso('US7: devolução atrasada sinaliza os dias', async () => {
    await page.getByLabel('Buscar empréstimo').fill('Sertões');
    await page.locator('tr', { hasText: 'Os Sertões' }).getByRole('button', { name: 'Devolver' }).click();
    await esperarTexto('Devolução com atraso de 32 dias');
    await shot('10-devolucao-atraso');
  });
  await caso('US4: e-mail repetido é recusado (RN04)', async () => {
    await page.getByRole('link', { name: 'Cadastrar leitor' }).click();
    await page.getByRole('button', { name: 'Cadastrar leitor' }).click();
    await esperarTexto('Informe o nome completo.');
    await shot('11-cadastro-leitor-validacao');
    await page.getByLabel('Nome completo').fill('Maria da Silva');
    await page.getByLabel(/^Matrícula/).fill('2024105');
    await page.getByLabel('E-mail').fill('ana.souza@aluno.faeterj.edu.br');
    await page.getByLabel('Telefone').fill('(24) 99999-0000');
    await page.getByRole('button', { name: 'Cadastrar leitor' }).click();
    await esperarTexto('E-mail já cadastrado');
  });
  await caso('US4: leitor válido é cadastrado', async () => {
    await page.getByLabel('E-mail').fill('maria.silva@aluno.faeterj.edu.br');
    await page.getByRole('button', { name: 'Cadastrar leitor' }).click();
    await esperarTexto('Maria da Silva foi cadastrado');
    await shot('12-cadastro-leitor-ok');
  });
  await caso('US5: livro cadastrado gera códigos dos exemplares', async () => {
    await page.getByRole('link', { name: 'Cadastrar livro' }).click();
    await page.getByLabel('Título').fill('Capitães da Areia');
    await page.getByLabel('Autor').fill('Jorge Amado');
    await page.getByLabel('Editora').fill('Companhia das Letras');
    await page.getByLabel('Ano de publicação').fill('1937');
    await page.getByLabel(/^Assunto/).fill('Literatura brasileira');
    await page.getByLabel('Quantidade de exemplares').fill('2');
    await page.getByLabel('Localização na estante').fill('Estante B4 · Literatura');
    await page.getByRole('button', { name: 'Cadastrar livro' }).click();
    await esperarTexto('EX-0022, EX-0023');
    await shot('13-cadastro-livro-ok');
  });
  await caso('US8: relatório mostra totais, gráfico e atrasos', async () => {
    await page.getByRole('link', { name: 'Relatórios' }).click();
    await esperarTexto('Empréstimos por mês');
    await esperarTexto('Empréstimos em atraso hoje');
    await fecharAvisos();
    await shot('14-relatorios', true);
  });
  await caso('US8: período invertido é recusado', async () => {
    await page.getByLabel('De').fill('2026-12-01');
    await page.getByLabel('Até').fill('2026-01-01');
    await page.getByRole('button', { name: 'Gerar relatório' }).click();
    await esperarTexto('data inicial deve ser anterior');
  });
  await sair();

  // Administrador
  await caso('US9: admin lista e cria usuário', async () => {
    await login('admin@biblioteca.faeterj.edu.br', 'admin123');
    await page.waitForURL('**/usuarios');
    await page.getByRole('button', { name: 'Novo usuário' }).click();
    await page.getByLabel('Nome completo').fill('Rita Campos');
    await page.getByLabel('E-mail').fill('rita.campos@biblioteca.faeterj.edu.br');
    await page.getByLabel('Telefone').fill('(24) 3322-1010');
    await page.getByLabel('Senha inicial').fill('rita2024');
    await page.getByRole('button', { name: 'Criar usuário' }).click();
    await esperarTexto('Usuário criado');
    await page.locator('tr', { hasText: 'Rita Campos' }).waitFor();
  });
  await caso('US9: desativar usuário (RN05) e reativar', async () => {
    await page.locator('tr', { hasText: 'Rita Campos' }).getByRole('button', { name: 'Desativar' }).click();
    await page.locator('tr', { hasText: 'Rita Campos' }).getByText('Desativado').waitFor();
    await shot('15-gestao-usuarios');
    await page.locator('tr', { hasText: 'Rita Campos' }).getByRole('button', { name: 'Reativar' }).click();
    await page.locator('tr', { hasText: 'Rita Campos' }).getByText('Ativo').waitFor();
  });
  await caso('Perfil: admin vê a pesquisa sem botão Reservar', async () => {
    await page.getByRole('link', { name: 'Pesquisar livros' }).click();
    await esperarTexto('resultados');
    if (await page.getByRole('button', { name: 'Reservar' }).count()) throw new Error('botão Reservar visível');
  });

  // Responsivo
  await caso('Layout em celular (390 px) com menu recolhível', async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR' });
    const p = await m.newPage();
    await p.goto(`${BASE}/login`);
    await p.screenshot({ path: path.join(OUT, '16-celular-login.png') });
    await p.getByLabel('E-mail').fill('carlos.lima@aluno.faeterj.edu.br');
    await p.getByLabel('Senha', { exact: true }).fill('leitor123');
    await p.getByRole('button', { name: 'Entrar' }).click();
    await p.waitForURL('**/pesquisa');
    await p.getByText('resultados').first().waitFor();
    const largura = await p.evaluate(() => document.documentElement.scrollWidth);
    await p.screenshot({ path: path.join(OUT, '17-celular-pesquisa.png') });
    await p.getByRole('button', { name: 'Abrir menu' }).click();
    await p.getByRole('link', { name: 'Meus empréstimos' }).waitFor();
    await p.screenshot({ path: path.join(OUT, '18-celular-menu.png') });
    await p.getByRole('link', { name: 'Meus empréstimos' }).click();
    await p.waitForURL('**/meus-emprestimos');
    await p.locator('.side.aberta').waitFor({ state: 'detached', timeout: 3000 }).catch(() => { throw new Error('menu não fechou após navegar'); });
    await m.close();
    if (largura > 390) throw new Error(`rolagem horizontal: ${largura}px`);
  });

  await browser.close();
  for (const r of resultados) console.log(r.join(' | '));
  console.log(`\n${resultados.filter((r) => r[0] === 'OK').length}/${resultados.length} casos OK`);
  console.log('Erros no console:', errosConsole.length ? errosConsole : 'nenhum');
}

main().catch((e) => { console.error(e); process.exit(1); });
