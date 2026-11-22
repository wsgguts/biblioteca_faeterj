// Schemas de validação (Zod) com mensagens em português.
const { z } = require('zod');

const texto = (nome, min = 1) => z.string({ required_error: `Informe ${nome}.` }).trim().min(min, `Informe ${nome}.`);
const email = z.string({ required_error: 'Informe o e-mail.' }).trim().email('Informe um e-mail válido.');
const telefone = z.string({ required_error: 'Informe o telefone.' }).trim().regex(/^[\d\s()+-]{8,20}$/, 'Informe um telefone válido.');
const data = (nome) => z.string({ required_error: `Informe ${nome}.` }).refine((v) => !Number.isNaN(Date.parse(v)), `Informe ${nome} válida.`);

module.exports = {
  login: z.object({ email, senha: texto('a senha') }),

  pesquisaLivro: z.object({
    busca: z.string().optional(),
    campo: z.enum(['todos', 'titulo', 'autor', 'assunto']).optional(),
  }),

  livro: z.object({
    titulo: texto('o título'),
    autor: texto('o autor'),
    editora: texto('a editora'),
    ano: z.coerce.number({ invalid_type_error: 'Informe o ano.' }).int().min(1500, 'Ano inválido.').max(new Date().getFullYear() + 1, 'Ano inválido.'),
    assunto: z.string().trim().optional(),
    isbn: z.string().trim().optional().transform((v) => v || undefined),
    quantidadeExemplares: z.coerce.number().int().min(1, 'Informe ao menos 1 exemplar.').max(50, 'Máximo de 50 exemplares por cadastro.'),
    localizacao: texto('a localização na estante'),
  }),

  leitor: z.object({
    nome: texto('o nome', 3),
    matricula: texto('a matrícula', 3),
    email,
    telefone,
  }),

  emprestimo: z.object({
    leitorId: z.coerce.number({ invalid_type_error: 'Selecione o leitor.' }).int().positive('Selecione o leitor.'),
    exemplarId: z.coerce.number().int().positive().optional(),
    codigoExemplar: z.string().trim().min(1).optional(),
  }).refine((v) => v.exemplarId || v.codigoExemplar, { message: 'Informe o código do exemplar.' }),

  reserva: z.object({ livroId: z.coerce.number().int().positive('Livro inválido.') }),

  relatorio: z.object({ inicio: data('a data inicial'), fim: data('a data final') }),

  funcionario: z.object({
    nome: texto('o nome', 3),
    email,
    telefone,
    perfil: z.enum(['BIBLIOTECARIO', 'ADMINISTRADOR'], { errorMap: () => ({ message: 'Perfil inválido.' }) }),
    senha: z.string({ required_error: 'Informe a senha.' }).min(6, 'A senha deve ter ao menos 6 caracteres.'),
  }),

  atualizarFuncionario: z.object({
    perfil: z.enum(['BIBLIOTECARIO', 'ADMINISTRADOR'], { errorMap: () => ({ message: 'Perfil inválido.' }) }).optional(),
    ativo: z.boolean().optional(),
  }),
};
