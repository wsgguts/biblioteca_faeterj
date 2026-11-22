import { useEffect, useState } from 'react';
import { UserPlus, UserRound, Mail, Phone, Lock, Ban, CircleCheck, X } from 'lucide-react';
import { api, mensagemErro } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { data, iniciais, PERFIS } from '../utils/formatar';
import { Alerta, Campo, PageHead, useToast } from '../components/ui';

const VAZIO = { nome: '', email: '', telefone: '', perfil: 'BIBLIOTECARIO', senha: '' };

/** UC009 / US9 – gestão de usuários do sistema (RN05: desativar sem apagar o histórico). */
export default function GestaoUsuarios() {
  const { usuario } = useAuth();
  const notificar = useToast();
  const [lista, setLista] = useState([]);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState(null);
  const [erros, setErros] = useState({});

  const carregar = () => api.get('/usuarios').then((r) => setLista(r.data)).catch((e) => setErro(mensagemErro(e)));
  useEffect(() => { carregar(); }, []);

  async function atualizar(u, dados, msg) {
    try {
      await api.patch(`/usuarios/${u.id}`, dados);
      notificar(msg, u.nome);
      carregar();
    } catch (err) { notificar('Não foi possível alterar', mensagemErro(err), 'erro'); }
  }

  async function criar(e) {
    e.preventDefault();
    const v = {};
    if (form.nome.trim().length < 3) v.nome = 'Informe o nome completo.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) v.email = 'Informe um e-mail válido.';
    if (!/^[\d\s()+-]{8,20}$/.test(form.telefone.trim())) v.telefone = 'Informe um telefone válido.';
    if (form.senha.length < 6) v.senha = 'Mínimo de 6 caracteres.';
    setErros(v);
    if (Object.keys(v).length) return;
    try {
      const { data: d } = await api.post('/usuarios', form);
      notificar('Usuário criado', `${d.nome} · ${PERFIS[d.perfil]}`);
      setForm(null); carregar();
    } catch (err) { setErros({ geral: mensagemErro(err) }); }
  }

  const mudar = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHead titulo="Usuários do sistema" subtitulo="Bibliotecários e administradores com acesso ao painel.">
        {!form && <button className="btn btn-p" onClick={() => { setForm(VAZIO); setErros({}); }}><UserPlus size={18} aria-hidden />Novo usuário</button>}
      </PageHead>
      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      {form && (
        <form className="card pad" onSubmit={criar} noValidate>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>Novo usuário</h2>
            <button type="button" className="btn btn-g btn-sm" onClick={() => setForm(null)}><X size={16} aria-hidden />Fechar</button>
          </div>
          {erros.geral && <Alerta tipo="erro">{erros.geral}</Alerta>}
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Campo label="Nome completo" erro={erros.nome} icone={UserRound}><input value={form.nome} onChange={mudar('nome')} /></Campo>
            <Campo label="E-mail" erro={erros.email} icone={Mail}><input type="email" value={form.email} onChange={mudar('email')} placeholder="nome@biblioteca.faeterj.edu.br" /></Campo>
            <Campo label="Telefone" erro={erros.telefone} icone={Phone}><input value={form.telefone} onChange={mudar('telefone')} placeholder="(24) 3322-0000" /></Campo>
            <Campo label="Perfil">
              <select value={form.perfil} onChange={mudar('perfil')}>
                <option value="BIBLIOTECARIO">Bibliotecário</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </Campo>
            <Campo label="Senha inicial" erro={erros.senha} icone={Lock} ajuda="O usuário deve trocá-la no primeiro acesso."><input type="password" value={form.senha} onChange={mudar('senha')} /></Campo>
          </div>
          <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-p"><UserPlus size={18} aria-hidden />Criar usuário</button></div>
        </form>
      )}

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Usuário</th><th>Perfil</th><th>Situação</th><th>Criado em</th><th aria-label="Ações" /></tr></thead>
            <tbody>
              {lista.map((u) => {
                const proprio = u.id === usuario.id;
                return (
                  <tr key={u.id} style={!u.ativo ? { opacity: .6 } : undefined}>
                    <td><div className="row" style={{ gap: 12 }}><div className="avatar">{iniciais(u.nome)}</div><div><b>{u.nome}{proprio && ' (você)'}</b><div className="small sec">{u.email}</div></div></div></td>
                    <td>
                      <div className="input" style={{ height: 34, width: 170 }}>
                        <select aria-label={`Perfil de ${u.nome}`} value={u.perfil} disabled={proprio || !u.ativo} onChange={(e) => atualizar(u, { perfil: e.target.value }, 'Perfil alterado')}>
                          <option value="BIBLIOTECARIO">Bibliotecário</option>
                          <option value="ADMINISTRADOR">Administrador</option>
                        </select>
                      </div>
                    </td>
                    <td>{u.ativo ? <span className="badge b-ok"><CircleCheck size={14} aria-hidden />Ativo</span> : <span className="badge b-neu"><Ban size={14} aria-hidden />Desativado</span>}</td>
                    <td>{data(u.criadoEm)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {!proprio && (u.ativo
                        ? <button className="btn btn-g btn-sm" onClick={() => atualizar(u, { ativo: false }, 'Usuário desativado')}><Ban size={16} aria-hidden />Desativar</button>
                        : <button className="btn btn-s btn-sm" onClick={() => atualizar(u, { ativo: true }, 'Usuário reativado')}><CircleCheck size={16} aria-hidden />Reativar</button>)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="small sec">Desativar bloqueia o acesso, mas mantém o histórico de empréstimos registrados pelo usuário.</p>
    </>
  );
}
