import { useEffect, useState } from 'react';
import { Search, Barcode, CircleCheck, ArrowRight, RotateCcw, UserRound } from 'lucide-react';
import { api, mensagemErro } from '../services/api';
import { data } from '../utils/formatar';
import { Alerta, Campo, Capa, PageHead, StatusBadge, useToast } from '../components/ui';

function Passos({ atual }) {
  const passos = ['Leitor', 'Exemplar', 'Confirmação'];
  return (
    <div className="steps card pad" aria-label="Etapas do empréstimo">
      {passos.map((p, i) => (
        <div key={p} style={{ display: 'contents' }}>
          {i > 0 && <div className={`step-line${atual > i ? ' done' : ''}`} />}
          <div className={`step${atual > i + 1 ? ' done' : atual === i + 1 ? ' on' : ' off'}`} aria-current={atual === i + 1 ? 'step' : undefined}>
            <span className="n">{atual > i + 1 ? <CircleCheck size={16} /> : i + 1}</span>{p}
          </div>
        </div>
      ))}
    </div>
  );
}

/** UC006 / US6 – registrar empréstimo em três passos (Heurística 1: visibilidade do estado). */
export default function RegistrarEmprestimo() {
  const notificar = useToast();
  const [busca, setBusca] = useState('');
  const [opcoes, setOpcoes] = useState([]);
  const [leitor, setLeitor] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [previa, setPrevia] = useState(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(null);

  // busca de leitores com pequeno atraso para não disparar a cada tecla
  useEffect(() => {
    if (leitor || busca.trim().length < 2) { setOpcoes([]); return undefined; }
    const t = setTimeout(() => api.get('/leitores', { params: { busca } }).then((r) => setOpcoes(r.data)).catch(() => setOpcoes([])), 250);
    return () => clearTimeout(t);
  }, [busca, leitor]);

  async function verificar(e) {
    e.preventDefault();
    setErro(''); setPrevia(null);
    if (!codigo.trim()) { setErro('Informe o código do exemplar (etiqueta na contracapa).'); return; }
    try {
      const { data: v } = await api.post('/emprestimos/verificar', { leitorId: leitor.id, codigoExemplar: codigo });
      setPrevia(v);
    } catch (err) { setErro(mensagemErro(err)); }
  }

  async function confirmar() {
    setEnviando(true);
    try {
      const { data: emp } = await api.post('/emprestimos', { leitorId: leitor.id, exemplarId: previa.exemplar.id });
      setConcluido(emp);
      notificar('Empréstimo registrado', `${emp.exemplar.livro.titulo} para ${emp.leitor.nome}. Devolução até ${data(emp.dataPrevistaDevolucao)}.`);
    } catch (err) { setErro(mensagemErro(err)); }
    finally { setEnviando(false); }
  }

  function reiniciar() {
    setBusca(''); setLeitor(null); setCodigo(''); setPrevia(null); setErro(''); setConcluido(null);
  }

  const passo = !leitor ? 1 : !previa ? 2 : concluido ? 4 : 3;

  return (
    <>
      <PageHead titulo="Registrar empréstimo" subtitulo="Identifique o leitor, leia o código do exemplar e confirme." />
      <Passos atual={passo} />
      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      {concluido ? (
        <div className="card pad">
          <Alerta tipo="ok"><b>Empréstimo registrado com sucesso.</b> Informe ao leitor a data de devolução: <b>{data(concluido.dataPrevistaDevolucao)}</b>.</Alerta>
          <button className="btn btn-p" onClick={reiniciar}><RotateCcw size={18} aria-hidden />Novo empréstimo</button>
        </div>
      ) : (
        <div className="grid duas-col">
          <section className="card pad">
            <h2>1. Leitor</h2>
            {leitor ? (
              <div className="found">
                <div className="avatar"><UserRound size={18} /></div>
                <div style={{ flex: 1 }}><b>{leitor.nome}</b><div className="small sec">Matrícula {leitor.matricula} · {leitor.email}</div></div>
                <button className="btn btn-g btn-sm" onClick={() => { setLeitor(null); setPrevia(null); }}>Trocar</button>
              </div>
            ) : (
              <>
                <Campo label="Nome ou matrícula" icone={Search} ajuda="Digite ao menos 2 letras.">
                  <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: Ana Souza ou 2023101" autoFocus />
                </Campo>
                {opcoes.length > 0 && (
                  <div className="lista-opcoes" role="listbox">
                    {opcoes.map((o) => (
                      <button key={o.id} type="button" role="option" aria-selected="false" disabled={!o.ativo} onClick={() => setLeitor(o)}>
                        <span><b>{o.nome}</b> <span className="small sec">· {o.matricula}</span></span>
                        {!o.ativo && <span className="small sec">desativado</span>}
                      </button>
                    ))}
                  </div>
                )}
                {busca.trim().length >= 2 && opcoes.length === 0 && <p className="small sec" style={{ marginTop: 8 }}>Nenhum leitor encontrado.</p>}
              </>
            )}
          </section>

          <section className="card pad" style={!leitor ? { opacity: .55 } : undefined}>
            <h2>2. Exemplar</h2>
            <form onSubmit={verificar}>
              <Campo label="Código do exemplar" icone={Barcode} ajuda="Ex.: EX-0005. Use o leitor de código de barras ou digite.">
                <input disabled={!leitor} value={codigo} onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setPrevia(null); }} placeholder="EX-0000" />
              </Campo>
              <button className="btn btn-s" disabled={!leitor}>Verificar exemplar<ArrowRight size={18} aria-hidden /></button>
            </form>
          </section>
        </div>
      )}

      {previa && !concluido && (
        <section className="card pad">
          <h2>3. Confirme os dados</h2>
          <div className="row" style={{ gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 12 }}>
            <Capa livro={previa.exemplar.livro} />
            <div className="resumo" style={{ flex: 1 }}>
              <span className="sec">Livro</span><b className="btitle">{previa.exemplar.livro.titulo}</b>
              <span className="sec">Exemplar</span><span>{previa.exemplar.codigo} · {previa.exemplar.localizacao} <StatusBadge status={previa.exemplar.status} /></span>
              <span className="sec">Leitor</span><span>{previa.leitor.nome} ({previa.leitor.matricula})</span>
              <span className="sec">Retirada</span><span>{data(previa.dataEmprestimo)}</span>
              <span className="sec">Devolver até</span><b>{data(previa.dataPrevistaDevolucao)} ({previa.prazoDias} dias)</b>
            </div>
          </div>
          {previa.atendeReserva && <Alerta tipo="info">Este empréstimo atende a reserva do leitor, que sairá da fila.</Alerta>}
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-g" onClick={() => setPrevia(null)}>Cancelar</button>
            <button className="btn btn-p" disabled={enviando} onClick={confirmar}><CircleCheck size={18} aria-hidden />{enviando ? 'Registrando…' : 'Confirmar empréstimo'}</button>
          </div>
        </section>
      )}
    </>
  );
}
