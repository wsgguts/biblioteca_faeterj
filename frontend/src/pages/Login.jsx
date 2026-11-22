import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth, rotaInicial } from '../context/AuthContext';
import { mensagemErro } from '../services/api';
import { Alerta, Campo } from '../components/ui';

/** Login com JWT (US9: funções restritas exigem login e senha). Heurística 9: mensagem de erro clara, sem revelar qual campo errou. */
export default function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ver, setVer] = useState(false);
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const v = {};
    if (!email.trim()) v.email = 'Informe o e-mail.';
    if (!senha) v.senha = 'Informe a senha.';
    setErros(v); setErro('');
    if (Object.keys(v).length) return;
    setEnviando(true);
    try {
      const u = await entrar(email.trim(), senha);
      navigate(rotaInicial(u.perfil), { replace: true });
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <section className="marca">
        <div className="row" style={{ gap: 12 }}>
          <div className="logo" style={{ background: 'rgba(255,255,255,.12)', width: 44, height: 44, borderRadius: 10, display: 'grid', placeItems: 'center' }}><Library size={24} aria-hidden /></div>
          <div><b style={{ fontSize: 17 }}>Biblioteca Digital</b><div style={{ opacity: .75, fontSize: 13 }}>FAETERJ · Barra Mansa</div></div>
        </div>
        <p className="frase">O acervo da faculdade, a um clique de distância.</p>
        <div style={{ opacity: .7, fontSize: 13 }}>Pesquise, reserve e acompanhe seus empréstimos.</div>
        <div className="circulo" aria-hidden />
      </section>
      <section className="form">
        <form className="card pad" style={{ width: '100%', maxWidth: 400 }} onSubmit={enviar} noValidate>
          <h1 style={{ marginBottom: 4 }}>Entrar</h1>
          <p className="sec" style={{ marginBottom: 20 }}>Use o e-mail institucional e a sua senha.</p>
          {erro && <Alerta tipo="erro">{erro}</Alerta>}
          <Campo label="E-mail" erro={erros.email} icone={Mail}>
            <input type="email" autoComplete="username" placeholder="nome@aluno.faeterj.edu.br" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Campo>
          <Campo label="Senha" erro={erros.senha} icone={Lock}>
            <input type={ver ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
            <button type="button" className="btn-g" style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}>
              {ver ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </Campo>
          <button className="btn btn-p btn-full" disabled={enviando} style={{ marginTop: 8 }}><LogIn size={18} aria-hidden />{enviando ? 'Entrando…' : 'Entrar'}</button>
          <p className="small sec" style={{ marginTop: 16, textAlign: 'center' }}>Esqueceu a senha? Procure o balcão da biblioteca.</p>
        </form>
      </section>
    </div>
  );
}
