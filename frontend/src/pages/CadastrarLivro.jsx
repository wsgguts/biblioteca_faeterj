import { useState } from 'react';
import { BookPlus, Hash, MapPin } from 'lucide-react';
import { api, mensagemErro } from '../services/api';
import { Alerta, Campo, PageHead, useToast } from '../components/ui';

const VAZIO = { titulo: '', autor: '', editora: '', ano: '', assunto: '', isbn: '', quantidadeExemplares: 1, localizacao: '' };

function validar(f) {
  const e = {};
  if (!f.titulo.trim()) e.titulo = 'Informe o título.';
  if (!f.autor.trim()) e.autor = 'Informe o autor.';
  if (!f.editora.trim()) e.editora = 'Informe a editora.';
  const ano = Number(f.ano);
  if (!Number.isInteger(ano) || ano < 1500 || ano > new Date().getFullYear() + 1) e.ano = 'Informe um ano válido.';
  const q = Number(f.quantidadeExemplares);
  if (!Number.isInteger(q) || q < 1 || q > 50) e.quantidadeExemplares = 'De 1 a 50 exemplares.';
  if (!f.localizacao.trim()) e.localizacao = 'Informe a estante.';
  return e;
}

/** UC005 / US5 – cadastro de livro com geração dos códigos dos exemplares. */
export default function CadastrarLivro() {
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
      const { data } = await api.post('/livros', f);
      setCriado(data); setF(VAZIO);
      notificar('Livro cadastrado', `${data.titulo} · ${data.totalExemplares} exemplar(es)`);
    } catch (err) { setErro(mensagemErro(err)); }
    finally { setEnviando(false); }
  }

  return (
    <>
      <PageHead titulo="Cadastrar livro" subtitulo="Os códigos dos exemplares são gerados automaticamente para a etiqueta." />
      {criado && (
        <Alerta tipo="ok">
          <b>{criado.titulo} foi cadastrado.</b> Etiquete os exemplares com os códigos: {criado.exemplares.map((x) => x.codigo).join(', ')}.
        </Alerta>
      )}
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      <form className="card pad" onSubmit={enviar} noValidate style={{ maxWidth: 820 }}>
        <div className="form-grid">
          <div style={{ gridColumn: '1 / -1' }}><Campo label="Título" erro={erros.titulo}><input value={f.titulo} onChange={mudar('titulo')} placeholder="Ex.: Vidas Secas" /></Campo></div>
          <Campo label="Autor" erro={erros.autor}><input value={f.autor} onChange={mudar('autor')} placeholder="Ex.: Graciliano Ramos" /></Campo>
          <Campo label="Editora" erro={erros.editora}><input value={f.editora} onChange={mudar('editora')} placeholder="Ex.: Record" /></Campo>
          <Campo label="Ano de publicação" erro={erros.ano}><input inputMode="numeric" value={f.ano} onChange={mudar('ano')} placeholder="Ex.: 1938" /></Campo>
          <Campo label="Assunto" ajuda="Opcional"><input value={f.assunto} onChange={mudar('assunto')} placeholder="Ex.: Literatura brasileira" /></Campo>
          <Campo label="ISBN" icone={Hash} ajuda="Opcional"><input value={f.isbn} onChange={mudar('isbn')} placeholder="978-85-..." /></Campo>
          <Campo label="Quantidade de exemplares" erro={erros.quantidadeExemplares}><input type="number" min="1" max="50" value={f.quantidadeExemplares} onChange={mudar('quantidadeExemplares')} /></Campo>
          <div style={{ gridColumn: '1 / -1' }}><Campo label="Localização na estante" erro={erros.localizacao} icone={MapPin}><input value={f.localizacao} onChange={mudar('localizacao')} placeholder="Ex.: Estante B3 · Literatura" /></Campo></div>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-g" onClick={() => { setF(VAZIO); setErros({}); }}>Limpar</button>
          <button className="btn btn-p" disabled={enviando}><BookPlus size={18} aria-hidden />{enviando ? 'Salvando…' : 'Cadastrar livro'}</button>
        </div>
      </form>
    </>
  );
}
