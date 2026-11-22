import { useEffect, useState } from 'react';
import { ArrowLeftRight, BookOpen, Undo2, TriangleAlert, Filter } from 'lucide-react';
import { api, mensagemErro } from '../services/api';
import { data, diasAtrasISO, hojeISO } from '../utils/formatar';
import { Alerta, Campo, Kpi, PageHead, StatusBadge, Vazio } from '../components/ui';

/** UC008 / US8 – relatório de empréstimos por período. */
export default function Relatorios() {
  const [inicio, setInicio] = useState(diasAtrasISO(180));
  const [fim, setFim] = useState(hojeISO());
  const [r, setR] = useState(null);
  const [erro, setErro] = useState('');

  async function gerar(e) {
    e?.preventDefault();
    setErro('');
    try {
      const { data: d } = await api.get('/relatorios/emprestimos', { params: { inicio, fim } });
      setR(d);
    } catch (err) { setErro(mensagemErro(err)); }
  }
  useEffect(() => { gerar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const max = Math.max(1, ...(r?.porMes || []).map((m) => m.total));

  return (
    <>
      <PageHead titulo="Relatórios" subtitulo="Movimento de empréstimos no período e pendências em aberto." />
      <form className="card pad row" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }} onSubmit={gerar}>
        <div style={{ flex: '0 1 200px' }}><Campo label="De"><input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></Campo></div>
        <div style={{ flex: '0 1 200px' }}><Campo label="Até"><input type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></Campo></div>
        <button className="btn btn-p" style={{ marginBottom: 14 }}><Filter size={18} aria-hidden />Gerar relatório</button>
      </form>
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {r && (
        <>
          <div className="grid g4">
            <Kpi icone={ArrowLeftRight} cor="var(--cor-primaria)" fundo="var(--cor-primaria-clara)" valor={r.totais.emprestimos} rotulo="Empréstimos no período" />
            <Kpi icone={BookOpen} cor="var(--cor-info)" fundo="var(--cor-info-bg)" valor={r.totais.ativos} rotulo="Ainda ativos" />
            <Kpi icone={Undo2} cor="var(--cor-sucesso)" fundo="var(--cor-sucesso-bg)" valor={r.totais.devolvidos} rotulo="Devolvidos" />
            <Kpi icone={TriangleAlert} cor="var(--cor-erro)" fundo="var(--cor-erro-bg)" valor={r.totais.atrasados} rotulo="Em atraso" />
          </div>

          <section className="card pad">
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <h2>Empréstimos por mês</h2>
              <div className="small sec row" style={{ gap: 14 }}>
                <span className="row" style={{ gap: 6 }}><i className="legenda-cor" style={{ background: 'var(--cor-primaria)' }} />Total</span>
                <span className="row" style={{ gap: 6 }}><i className="legenda-cor" style={{ background: 'var(--cor-destaque)' }} />Em atraso</span>
              </div>
            </div>
            <div className="barras" role="img" aria-label={r.porMes.map((m) => `${m.mes}: ${m.total}`).join(', ')}>
              {r.porMes.map((m) => (
                <div key={m.mes} className="barra">
                  <span className="small"><b>{m.total}</b></span>
                  <div className="b" style={{ height: `${(m.total / max) * 150}px` }}>
                    <i style={{ height: m.total ? `${(m.atrasados / m.total) * 100}%` : 0 }} />
                  </div>
                  <span className="small sec">{m.mes}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="pad" style={{ paddingBottom: 0 }}><h2>Empréstimos em atraso hoje</h2></div>
            {r.atrasadosAgora.length === 0 ? <Vazio titulo="Nenhum atraso">Todos os empréstimos estão no prazo.</Vazio> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Leitor</th><th>Livro</th><th>Exemplar</th><th>Venceu em</th><th>Atraso</th></tr></thead>
                  <tbody>
                    {r.atrasadosAgora.map((e) => (
                      <tr key={e.id}>
                        <td>{e.leitor.nome}<div className="small sec">{e.leitor.email}</div></td>
                        <td className="btitle" style={{ fontSize: 14 }}>{e.exemplar.livro.titulo}</td>
                        <td>{e.exemplar.codigo}</td>
                        <td>{data(e.dataPrevistaDevolucao)}</td>
                        <td><StatusBadge status="ATRASADO" texto={`${e.diasAtraso} dias`} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
