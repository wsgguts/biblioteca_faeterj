import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, rotaInicial } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import PesquisaLivros from './pages/PesquisaLivros';
import MeusEmprestimos from './pages/MeusEmprestimos';
import RegistrarEmprestimo from './pages/RegistrarEmprestimo';
import RegistrarDevolucao from './pages/RegistrarDevolucao';
import CadastrarLeitor from './pages/CadastrarLeitor';
import CadastrarLivro from './pages/CadastrarLivro';
import Relatorios from './pages/Relatorios';
import GestaoUsuarios from './pages/GestaoUsuarios';

/** Protege a rota por login e, opcionalmente, por perfil. */
function Protegida({ perfis, children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <p className="vazio">Carregando…</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (perfis && !perfis.includes(usuario.perfil)) return <Navigate to={rotaInicial(usuario.perfil)} replace />;
  return children;
}

const BIB = ['BIBLIOTECARIO'];

export default function App() {
  const { usuario } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to={rotaInicial(usuario.perfil)} replace /> : <Login />} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route path="/pesquisa" element={<PesquisaLivros />} />
        <Route path="/meus-emprestimos" element={<Protegida perfis={['LEITOR']}><MeusEmprestimos /></Protegida>} />
        <Route path="/emprestimos/novo" element={<Protegida perfis={BIB}><RegistrarEmprestimo /></Protegida>} />
        <Route path="/devolucoes" element={<Protegida perfis={BIB}><RegistrarDevolucao /></Protegida>} />
        <Route path="/leitores/novo" element={<Protegida perfis={BIB}><CadastrarLeitor /></Protegida>} />
        <Route path="/livros/novo" element={<Protegida perfis={BIB}><CadastrarLivro /></Protegida>} />
        <Route path="/relatorios" element={<Protegida perfis={BIB}><Relatorios /></Protegida>} />
        <Route path="/usuarios" element={<Protegida perfis={['ADMINISTRADOR']}><GestaoUsuarios /></Protegida>} />
      </Route>
      <Route path="*" element={<Navigate to={usuario ? rotaInicial(usuario.perfil) : '/login'} replace />} />
    </Routes>
  );
}
