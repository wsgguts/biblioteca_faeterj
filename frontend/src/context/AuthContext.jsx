import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStorage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(tokenStorage.get()));

  // Recupera a sessão ao recarregar a página.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    api.get('/auth/me')
      .then((r) => setUsuario(r.data))
      .catch(() => tokenStorage.clear())
      .finally(() => setCarregando(false));
  }, []);

  async function entrar(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha });
    tokenStorage.set(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  function sair() {
    tokenStorage.clear();
    setUsuario(null);
  }

  return <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Tela inicial de cada perfil após o login. */
export const rotaInicial = (perfil) => ({
  LEITOR: '/pesquisa',
  BIBLIOTECARIO: '/emprestimos/novo',
  ADMINISTRADOR: '/usuarios',
}[perfil] || '/login');
