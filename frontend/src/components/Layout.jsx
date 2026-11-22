import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Library, Search, BookOpen, ArrowLeftRight, Undo2, UserPlus, BookPlus, ChartColumn, Users, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { iniciais, PERFIS } from '../utils/formatar';

/** Menu lateral por perfil (Heurística 6: ícones sempre com rótulo). */
const MENUS = {
  LEITOR: [
    ['Acervo', [['/pesquisa', Search, 'Pesquisar livros'], ['/meus-emprestimos', BookOpen, 'Meus empréstimos']]],
  ],
  BIBLIOTECARIO: [
    ['Atendimento', [['/emprestimos/novo', ArrowLeftRight, 'Registrar empréstimo'], ['/devolucoes', Undo2, 'Registrar devolução'], ['/leitores/novo', UserPlus, 'Cadastrar leitor']]],
    ['Acervo', [['/pesquisa', Search, 'Pesquisar livros'], ['/livros/novo', BookPlus, 'Cadastrar livro']]],
    ['Gestão', [['/relatorios', ChartColumn, 'Relatórios']]],
  ],
  ADMINISTRADOR: [
    ['Gestão', [['/usuarios', Users, 'Usuários do sistema']]],
    ['Acervo', [['/pesquisa', Search, 'Pesquisar livros']]],
  ],
};

export default function Layout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  useEffect(() => setMenuAberto(false), [pathname]); // fecha o menu do celular ao navegar
  const grupos = MENUS[usuario.perfil];
  let trilha = ['', ''];
  grupos.forEach(([g, itens]) => itens.forEach(([to, , rot]) => { if (pathname.startsWith(to)) trilha = [g, rot]; }));

  return (
    <div className="app">
      {menuAberto && <div className="fundo-menu" onClick={() => setMenuAberto(false)} aria-hidden />}
      <aside id="menu-principal" className={`side${menuAberto ? ' aberta' : ''}`} aria-label="Menu principal">
        <div className="brand">
          <div className="logo"><Library size={22} aria-hidden /></div>
          <div><b>Biblioteca Digital</b><span>FAETERJ · Barra Mansa</span></div>
        </div>
        <nav>
          {grupos.map(([grupo, itens]) => (
            <div key={grupo}>
              <div className="menu-t">{grupo}</div>
              {itens.map(([to, Icone, rotulo]) => (
                <NavLink key={to} to={to} className="mi"><Icone size={18} aria-hidden />{rotulo}</NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="foot">
          <button className="mi" onClick={() => { sair(); navigate('/login'); }}><LogOut size={18} aria-hidden />Sair</button>
        </div>
      </aside>
      <div className="main">
        <header className="top">
          <button className="menu-btn" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto} aria-controls="menu-principal" onClick={() => setMenuAberto(!menuAberto)}>
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="crumb">{trilha[0]} / <b>{trilha[1]}</b></div>
          <div className="user">
            <div><b>{usuario.nome}</b><span className="small sec">{PERFIS[usuario.perfil]}</span></div>
            <div className="avatar" aria-hidden>{iniciais(usuario.nome)}</div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
