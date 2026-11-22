import { useEffect, useState } from 'react';
import { Search, Undo2 } from 'lucide-react';
import { api, mensagemErro } from '../services/api';
import { data } from '../utils/formatar';
import { Alerta, Capa, PageHead, StatusBadge, Vazio, useToast } from '../components/ui';

/** UC007 / US7 – registrar devolução, sinalizando atraso e reserva. */
export default function RegistrarDevolucao() {
  const notificar = useToast();
  const [busca, setBusca] = useState('');
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const [devolvendo, setDevolvendo] = useState(null);

  async function carregar(termo = busca) {
    try {
      const { data: d } = await api.get('/emprestimos', { params: { busca: termo } });
      setLista(d); setErro('');
    } catch (err) { setErro(mensagemErro(err)); }
  }
  useEffect(() => {
    const t = setTimeout(() => carregar(busca), 250);
    return () => clearTimeout(t);
  }, [busca]); // eslint-disable-line react-hooks/exhaustive-deps

  async function devolver(e) {
    setDevolvendo(e.id);
    try {
      const { data: r } = await api.post(`/emprestimos/${e.id}/devolucao`);
      setResultado({ ...r, titulo: e.exemplar.livro.titulo, leitor: e.leitor.nome });
      notificar('Devolução registrada', `${e.exemplar.livro.titulo} (${e.exemplar.codigo})`);
      carregar();
    } catch (err) { notificar('Não foi possível registrar', mensagemErro(err), 'erro'); }
    finally { setDevolvendo(null); }
  }

  return (
    <>
      <PageHead titulo="Registrar devolução" subtitulo="Localize o empréstimo pelo leitor, título ou código do exemplar." />

      {resultado && (
        <>
          {resultado.houveAtraso
            ? <Alerta tipo="aviso"><b>Devolução com atraso de {resultado.diasAtraso} {resultado.diasAtraso === 1 ? 'dia' : 'dias'}.</b> {resultado.leitor} já pode pegar novos livros, mas o atraso fica registrado no histórico.</Alerta>
            : <Alerta tipo="ok"><b>Devolução no prazo.</b> {resultado.titulo} foi devolvido por {resultado.leitor}.</Alerta>}
          {resultado.reservadoPara
            ? <Alerta tipo="info"><b>Guarde o exemplar no balcão:</b> ele está reservado para {resultado.reservadoPara.nome} (1º da fila).</Alerta>
            : <Alerta tipo="info">Exemplar disponível: pode voltar para a estante.</Alerta>}
        </>
      )}

      <div className="card pad">
        <div className="input">
          <Search size={18} aria-hidden />
          <input aria-label="Buscar empréstimo" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: Bruno, Os Sertões ou EX-0012" autoFocus />
        </div>
      </div>

      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      <section className="card">
        {lista && lista.length === 0 ? <Vazio titulo="Nenhum empréstimo ativo encontrado">Confira o termo digitado.</Vazio> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Livro</th><th>Leitor</th><th>Exemplar</th><th>Devolver até</th><th>Situação</th><th aria-label="Ações" /></tr></thead>
              <tbody>
                {(lista || []).map((e) => (
                  <tr key={e.id}>
                    <td><div className="row" style={{ gap: 12 }}><Capa livro={e.exemplar.livro} pequena /><b className="btitle" style={{ fontSize: 14 }}>{e.exemplar.livro.titulo}</b></div></td>
                    <td>{e.leitor.nome}<div className="small sec">{e.leitor.matricula}</div></td>
                    <td>{e.exemplar.codigo}</td>
                    <td>{data(e.dataPrevistaDevolucao)}</td>
                    <td>{e.atrasado ? <StatusBadge status="ATRASADO" texto={`Atrasado ${e.diasAtraso} d`} /> : <StatusBadge status="OK" />}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-p btn-sm" disabled={devolvendo === e.id} onClick={() => devolver(e)}><Undo2 size={16} aria-hidden />{devolvendo === e.id ? 'Registrando…' : 'Devolver'}</button>
                    </td>
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
