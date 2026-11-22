export const data = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

export const iniciais = (nome = '') => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const PERFIS = { LEITOR: 'Leitor', BIBLIOTECARIO: 'Bibliotecário', ADMINISTRADOR: 'Administrador' };

const CORES_CAPA = ['#0D6E6E', '#7B3F61', '#9A6B2F', '#35506B', '#5B6B2F', '#8C3B2E', '#3F4C7B', '#2F6B5B'];
/** Cor fixa por livro, usada nas capas ilustrativas. */
export const corCapa = (id = 0) => CORES_CAPA[id % CORES_CAPA.length];

export const hojeISO = () => new Date().toISOString().slice(0, 10);
export const diasAtrasISO = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
