import axios from 'axios';

const TOKEN = 'biblioteca.token';

export const api = axios.create({ baseURL: '/api' });

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN),
  set: (t) => localStorage.setItem(TOKEN, t),
  clear: () => localStorage.removeItem(TOKEN),
};

// Anexa o token JWT em todas as requisições.
api.interceptors.request.use((config) => {
  const t = tokenStorage.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Sessão expirada: limpa o token e volta para o login.
api.interceptors.response.use(
  (r) => r,
  (erro) => {
    if (erro.response?.status === 401 && !erro.config.url.includes('/auth/login')) {
      tokenStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(erro);
  },
);

/** Mensagem amigável a partir de um erro do Axios. */
export const mensagemErro = (e) =>
  e.response?.data?.mensagem || (e.response ? 'Não foi possível concluir a operação.' : 'Sem conexão com o servidor. Verifique se a API está rodando.');
