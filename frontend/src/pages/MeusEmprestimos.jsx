import { useEffect, useState } from 'react';
import { BookOpen, TriangleAlert, Bookmark, X } from 'lucide-react';
import { api, mensagemErro } from '../services/api';
import { data } from '../utils/formatar';
import { Alerta, Capa, Kpi, PageHead, StatusBadge, Vazio, useToast } from '../components/ui';

function situacao(e) {
  if (e.atrasado) return <StatusBadge status="ATRASADO" texto={`Atrasado ${e.diasAtraso} ${e.diasAtraso === 1 ? 'dia' : 'dias'}`} />;
  if (e.diasRestantes <= 5) return <StatusBadge status="VENCENDO" texto={e.diasRestantes === 0 ? 'Vence hoje' : `Vence em ${e.diasRestantes} ${e.diasRestantes === 1 ? 'dia' : 'dias'}`} />;
  return <StatusBadge status="OK" />;
}

/** UC002 / US2 – empréstimos ativos e reservas. */
export default function MeusEmprestimos() {
  const notificar = useToast();
  const [emp, setEmp] = useState(null);
  const [res, setRes] = useState([]);
  const [erro, setErro] = useState('');

  async function carregar() {
    try {
      const [a, b] = await Promise.all([api.get('/emprestimos/meus'), api.get('/reservas/minhas')]);
      setEmp(a.data); setRes(b.data);
    } catch (err) { setErro(mensagemErro(err)); }
  }
  useEffect(() => { carregar(); }, []);

  async function cancelar(r) {
    try {
      await api.delete(`/reservas/${r.id}`);
      notificar('Reserva cancelada', r.livro.titulo);
      carregar();
    } catch (err) { notificar('Não foi possível cancelar', mensagemErro(err), 'erro'); }
  }

  if (erro) return <Alerta tipo="erro">{erro}</Alerta>;
  if (!emp) return <p className="vazio">Carregando…</p>;
  const atrasados = emp.filter((e) => e.atrasado);

  return (
    <>
      <PageHead titulo="Meus empréstimos" subtitulo="Acompanhe os prazos de devolução e as suas reservas." />
      {atrasados.length > 0 && (
        <Alerta tipo="erro">
          <b>Você tem {atrasados.length} {atrasados.length === 1 ? 'livro em atraso' : 'livros em atraso'}.</b> Devolva no balcão para voltar a pegar livros emprestados.
        </Alerta>
      )}
      <div className="grid g3" style={{ marginBottom: 18 }}>
        <Kpi icone={BookOpen} cor="var(--cor-primaria)" fundo="var(--cor-primaria-clara)" valor={emp.length} rotulo="Empréstimos ativos" />
        <Kpi icone={TriangleAlert} cor="var(--cor-erro)" fundo="#FDECEA" valor={atrasados.length} rotulo="Em atraso" />
        <Kpi icone={Bookmark} cor="#9A6B2F" fundo="#FBF3E6" valor={res.length} rotulo="Reservas ativas" />
      </div>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="pad" style={{ paddingBottom: 0 }}><h2>Empréstimos ativos</h2></div>
        {emp.length === 0 ? <Vazio titulo="Nenhum empréstimo ativo">Pesquise no acervo e retire um livro no balcão.</Vazio> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Livro</th><th>Exemplar</th><th>Retirada</th><th>Devolver até</th><th>Situação</th></tr></thead>
              <tbody>
                {emp.map((e) => (
                  <tr key={e.id}>
                    <td><div className="row" style={{ gap: 12 }}><Capa livro={e.exemplar.livro} pequena /><div><b className="btitle" style={{ fontSize: 14 }}>{e.exemplar.livro.titulo}</b><div className="small sec">{e.exemplar.livro.autor}</div></div></div></td>
                    <td>{e.exemplar.codigo}</td>
                    <td>{data(e.dataEmprestimo)}</td>
                    <td><b>{data(e.dataPrevistaDevolucao)}</b></td>
                    <td>{situacao(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <div className="pad" style={{ paddingBottom: 0 }}><h2>Minhas reservas</h2></div>
        {res.length === 0 ? <Vazio titulo="Nenhuma reserva">Livros indisponíveis podem ser reservados na pesquisa.</Vazio> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Livro</th><th>Reservado em</th><th>Posição na fila</th><th aria-label="Ações" /></tr></thead>
              <tbody>
                {res.map((r) => (
                  <tr key={r.id}>
                    <td><div className="row" style={{ gap: 12 }}><Capa livro={r.livro} pequena /><b className="btitle" style={{ fontSize: 14 }}>{r.livro.titulo}</b></div></td>
                    <td>{data(r.dataReserva)}</td>
                    <td><StatusBadge status="RESERVADO" texto={`${r.posicaoFila}º da fila`} /></td>
                    <td style={{ textAlign: 'right' }}><button className="btn btn-g btn-sm" onClick={() => cancelar(r)}><X size={16} aria-hidden />Cancelar reserva</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
