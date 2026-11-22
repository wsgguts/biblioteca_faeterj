import { createContext, useCallback, useContext, useState } from 'react';
import {
  CircleCheck, BookOpen, Bookmark, TriangleAlert, Wrench, Clock, Info, CircleAlert, X, Inbox,
} from 'lucide-react';
import { corCapa } from '../utils/formatar';

/** Badge de situação: sempre cor + ícone + texto (nunca só cor). */
const ESTILOS = {
  DISPONIVEL: ['b-ok', CircleCheck, 'Disponível'],
  EMPRESTADO: ['b-info', BookOpen, 'Emprestado'],
  RESERVADO: ['b-warn', Bookmark, 'Reservado'],
  MANUTENCAO: ['b-neu', Wrench, 'Manutenção'],
  ATRASADO: ['b-err', TriangleAlert, 'Atrasado'],
  VENCENDO: ['b-warn', Clock, 'Vencendo'],
  OK: ['b-ok', CircleCheck, 'No prazo'],
  INDISPONIVEL: ['b-err', Clock, 'Indisponível'],
};
export function StatusBadge({ status, texto }) {
  const [cls, Icone, padrao] = ESTILOS[status] || ESTILOS.MANUTENCAO;
  return <span className={`badge ${cls}`}><Icone size={14} aria-hidden />{texto || padrao}</span>;
}

const ALERTAS = { erro: ['a-err', TriangleAlert], ok: ['a-ok', CircleCheck], info: ['a-info', Info], aviso: ['a-warn', CircleAlert] };
export function Alerta({ tipo = 'info', children }) {
  const [cls, Icone] = ALERTAS[tipo];
  return <div className={`alert ${cls}`} role={tipo === 'erro' ? 'alert' : 'status'}><Icone size={18} aria-hidden /><div>{children}</div></div>;
}

export function Capa({ livro, pequena }) {
  return <div className={`cover${pequena ? ' sm' : ''}`} style={{ background: corCapa(livro.id) }} aria-hidden>{livro.titulo}</div>;
}

export function Vazio({ titulo, children }) {
  return (
    <div className="vazio">
      <Inbox size={36} aria-hidden />
      <h3 style={{ color: 'var(--cor-texto)' }}>{titulo}</h3>
      {children && <p className="small">{children}</p>}
    </div>
  );
}

export function Campo({ label, erro, icone: Icone, children, ajuda }) {
  return (
    <div className="field">
      <label>{label}
        <div className={`input${erro ? ' err' : ''}`} style={{ marginTop: 6 }}>
          {Icone && <Icone size={18} aria-hidden />}
          {children}
        </div>
      </label>
      {erro ? <div className="help err"><CircleAlert size={14} aria-hidden />{erro}</div> : ajuda && <div className="help">{ajuda}</div>}
    </div>
  );
}

export function PageHead({ titulo, subtitulo, children }) {
  return (
    <div className="page-head">
      <div><h1>{titulo}</h1>{subtitulo && <p className="sec">{subtitulo}</p>}</div>
      {children}
    </div>
  );
}

export function Kpi({ icone: Icone, cor, fundo, valor, rotulo }) {
  return (
    <div className="card kpi">
      <div className="ico" style={{ background: fundo, color: cor }}><Icone size={22} aria-hidden /></div>
      <div><b>{valor}</b><span className="small sec">{rotulo}</span></div>
    </div>
  );
}

/* ---------- notificações (toast) ---------- */
const ToastContext = createContext(() => {});
export function ToastProvider({ children }) {
  const [itens, setItens] = useState([]);
  const notificar = useCallback((titulo, texto, tipo = 'ok') => {
    const id = Math.random();
    setItens((l) => [...l.slice(-2), { id, titulo, texto, tipo }]); // no máximo 3 na tela
    setTimeout(() => setItens((l) => l.filter((i) => i.id !== id)), 5000);
  }, []);
  return (
    <ToastContext.Provider value={notificar}>
      {children}
      <div className="toast-area" aria-live="polite">
        {itens.map((t) => (
          <div key={t.id} className={`toast${t.tipo === 'erro' ? ' erro' : ''}`}>
            {t.tipo === 'erro' ? <TriangleAlert size={22} color="var(--cor-erro)" /> : <CircleCheck size={22} color="var(--cor-sucesso)" />}
            <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>{t.titulo}</b>{t.texto && <div className="small sec">{t.texto}</div>}</div>
            <button className="btn-g" style={{ border: 0, cursor: 'pointer', height: 24 }} aria-label="Fechar" onClick={() => setItens((l) => l.filter((i) => i.id !== t.id))}><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
