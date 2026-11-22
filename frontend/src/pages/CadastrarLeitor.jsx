import { useState } from 'react';
import { UserRound, IdCard, Mail, Phone, UserPlus } from 'lucide-react';
import { api, mensagemErro } from '../services/api';
import { Alerta, Campo, PageHead, useToast } from '../components/ui';

const VAZIO = { nome: '', matricula: '', email: '', telefone: '' };

function validar(f) {
  const e = {};
  if (f.nome.trim().length < 3) e.nome = 'Informe o nome completo.';
  if (f.matricula.trim().length < 3) e.matricula = 'Informe a matrícula.';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Informe um e-mail válido.';
  if (!/^[\d\s()+-]{8,20}$/.test(f.telefone.trim())) e.telefone = 'Informe um telefone válido, com DDD.';
  return e;
}

/** UC004 / US4 – cadastro de leitor (RN03: matrícula e e-mail únicos). */
export default function CadastrarLeitor() {
  const notificar = useToast();
  const [f, setF] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState('');
  const [criado, setCriado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const mudar = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const v = validar(f);
    setErros(v); setErro('');
    if (Object.keys(v).length) return;
    setEnviando(true);
    try {
      const { data } = await api.post('/leitores', f);
      setCriado(data); setF(VAZIO);
      notificar('Leitor cadastrado', data.nome);
    } catch (err) { setErro(mensagemErro(err)); }
    finally { setEnviando(false); }
  }

  return (
    <>
      <PageHead titulo="Cadastrar leitor" subtitulo="Alunos, professores e funcionários que podem pegar livros emprestados." />
      {criado && <Alerta tipo="ok"><b>{criado.nome} foi cadastrado.</b> O acesso é pelo e-mail {criado.email} e a senha inicial é a matrícula ({criado.matricula}).</Alerta>}
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      <form className="card pad" onSubmit={enviar} noValidate style={{ maxWidth: 820 }}>
        <div className="form-grid">
          <Campo label="Nome completo" erro={erros.nome} icone={UserRound}><input value={f.nome} onChange={mudar('nome')} placeholder="Ex.: Maria da Silva" /></Campo>
          <Campo label="Matrícula" erro={erros.matricula} icone={IdCard} ajuda="Também será a senha inicial."><input value={f.matricula} onChange={mudar('matricula')} placeholder="Ex.: 2024105" /></Campo>
          <Campo label="E-mail" erro={erros.email} icone={Mail}><input type="email" value={f.email} onChange={mudar('email')} placeholder="nome@aluno.faeterj.edu.br" /></Campo>
          <Campo label="Telefone" erro={erros.telefone} icone={Phone}><input value={f.telefone} onChange={mudar('telefone')} placeholder="(24) 99999-0000" /></Campo>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-g" onClick={() => { setF(VAZIO); setErros({}); }}>Limpar</button>
          <button className="btn btn-p" disabled={enviando}><UserPlus size={18} aria-hidden />{enviando ? 'Salvando…' : 'Cadastrar leitor'}</button>
        </div>
      </form>
    </>
  );
}
