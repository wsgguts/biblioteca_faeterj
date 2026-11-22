import { useEffect, useState } from 'react';
import { Search, MapPin, Bookmark, BookCheck } from 'lucide-react';
import { api, mensagemErro } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Alerta, Capa, PageHead, StatusBadge, Vazio, useToast } from '../components/ui';

const CAMPOS = [['todos', 'Todos os campos'], ['titulo', 'Título'], ['autor', 'Autor'], ['assunto', 'Assunto']];
const FILTROS = [['todos', 'Todos'], ['disp', 'Disponíveis'], ['indisp', 'Indisponíveis']];

/** UC001 / US1 – pesquisa do acervo; UC003 / US3 – reserva de livro indisponível. */
export default function PesquisaLivros() {
  const { usuario } = useAuth();
  const notificar = useToast();
  const [busca, setBusca] = useState('');
  const [campo, setCampo] = useState('todos');
  const [filtro, setFiltro] = useState('todos');
  const [livros, setLivros] = useState(null);
  const [erro, setErro] = useState('');
  const [reservando, setReservando] = useState(null);

  async function carregar(e) {
    e?.preventDefault();
    setErro('');
    try {
      const { data } = await api.get('/livros', { params: { busca, campo } });
      setLivros(data);
    } catch (err) { setErro(mensagemErro(err)); }
  }
  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function reservar(livro) {
    setReservando(livro.id);
    try {
      const { data } = await api.post('/reservas', { livroId: livro.id });
      notificar('Reserva confirmada', `${livro.titulo}: você é o ${data.posicaoFila}º da fila. Avisaremos no balcão quando o exemplar voltar.`);
      await carregar();
    } catch (err) { notificar('Não foi possível reservar', mensagemErro(err), 'erro'); }
    finally { setReservando(null); }
  }

  const visiveis = (livros || []).filter((l) => filtro === 'todos' || (filtro === 'disp' ? l.disponiveis > 0 : l.disponiveis === 0));
  const leitor = usuario.perfil === 'LEITOR';

  return (
    <>
      <PageHead titulo="Pesquisar livros" subtitulo="Busque no acervo por título, autor ou assunto." />
      <form className="card pad row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 16 }} onSubmit={carregar} role="search">
        <div className="input" style={{ flex: '1 1 320px' }}>
          <Search size={18} aria-hidden />
          <input aria-label="Termo de busca" placeholder="Ex.: Machado de Assis, Dom Casmurro, Engenharia…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="input" style={{ flex: '0 0 190px' }}>
          <select aria-label="Pesquisar em" value={campo} onChange={(e) => setCampo(e.target.value)}>
            {CAMPOS.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
        </div>
        <button className="btn btn-p"><Search size={18} aria-hidden />Pesquisar</button>
      </form>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div className="row" style={{ gap: 8 }}>
          {FILTROS.map(([v, r]) => <button key={v} type="button" className={`chip${filtro === v ? ' on' : ''}`} aria-pressed={filtro === v} onClick={() => setFiltro(v)}>{r}</button>)}
        </div>
        {livros && <span className="small sec">{visiveis.length} {visiveis.length === 1 ? 'resultado' : 'resultados'}</span>}
      </div>

      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {livros && visiveis.length === 0 && <div className="card"><Vazio titulo="Nenhum livro encontrado">Tente outro termo ou pesquise em “Todos os campos”.</Vazio></div>}

      <div className="grid" style={{ gap: 12 }}>
        {visiveis.map((l) => (
          <article key={l.id} className="card livro-card">
            <Capa livro={l} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 className="btitle">{l.titulo}</h3>
              <div className="sec" style={{ marginTop: 2 }}>{l.autor} · {l.editora}, {l.ano}</div>
              <div className="small sec row" style={{ gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                {l.assunto && <span>Assunto: {l.assunto}</span>}
                <span className="row" style={{ gap: 4 }}><MapPin size={14} aria-hidden />{l.localizacao}</span>
                {l.isbn && <span>ISBN {l.isbn}</span>}
              </div>
            </div>
            <div className="acoes">
              {l.disponiveis > 0
                ? <StatusBadge status="DISPONIVEL" texto={`${l.disponiveis} de ${l.totalExemplares} disponíveis`} />
                : <StatusBadge status="INDISPONIVEL" texto={l.filaReservas ? `Indisponível · ${l.filaReservas} na fila` : 'Indisponível'} />}
              {leitor && l.comigo && <span className="small sec row" style={{ gap: 4 }}><BookCheck size={14} aria-hidden />Emprestado para você</span>}
              {leitor && l.minhaReserva && <StatusBadge status="RESERVADO" texto={`Sua reserva · ${l.minhaReserva.posicaoFila}º da fila`} />}
              {leitor && l.disponiveis === 0 && !l.minhaReserva && !l.comigo && (
                <button className="btn btn-s btn-sm" disabled={reservando === l.id} onClick={() => reservar(l)}>
                  <Bookmark size={16} aria-hidden />{reservando === l.id ? 'Reservando…' : 'Reservar'}
                </button>
              )}
              {leitor && l.disponiveis > 0 && !l.comigo && <span className="small sec">Retire no balcão</span>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
