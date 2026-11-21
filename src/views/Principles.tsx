import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, nowIso, uid, type Principle } from '../db';
import { AutoTextarea, Icon } from '../components/ui';

export default function Principles() {
  const principles = useLiveQuery(() => db.principles.orderBy('createdAt').reverse().toArray(), []);
  const [editing, setEditing] = useState<Principle | null>(null);
  const [text, setText] = useState('');
  const [source, setSource] = useState('');

  const reset = () => {
    setEditing(null);
    setText('');
    setSource('');
  };

  const save = async () => {
    if (!text.trim()) return;
    const now = nowIso();
    await db.principles.put({
      id: editing?.id ?? uid(),
      text: text.trim(),
      source: source.trim(),
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    // Conserva el libro para capturar varias ideas seguidas del mismo.
    setEditing(null);
    setText('');
  };

  const edit = (p: Principle) => {
    setEditing(p);
    setText(p.text);
    setSource(p.source);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = (p: Principle) => {
    if (confirm('¿Borrar este principio?')) void db.principles.delete(p.id);
    if (editing?.id === p.id) reset();
  };

  return (
    <>
      <header className="page-head">
        <h1>Principios</h1>
        <p className="muted">Ideas de tus libros que quieres vivir, no solo leer. Cada día aparece una en Hoy.</p>
      </header>

      <section className="card form">
        <AutoTextarea value={text} onChange={(e) => setText(e.target.value)} placeholder="La idea, en tus palabras…" rows={3} />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Libro o autor (opcional)" />
        <div className="row">
          {editing && (
            <button className="btn" onClick={reset}>
              Cancelar
            </button>
          )}
          <button className="btn primary" onClick={save} disabled={!text.trim()}>
            {editing ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </section>

      {principles?.length === 0 && <p className="empty">Aún no hay principios. Empieza con el que más te pegó esta semana.</p>}

      {principles?.map((p) => (
        <article className="card principle" key={p.id}>
          <blockquote>{p.text}</blockquote>
          <footer>
            <cite>{p.source}</cite>
            <span className="spacer" />
            <button className="icon-btn" aria-label="Editar" onClick={() => edit(p)}>
              <Icon name="pencil" />
            </button>
            <button className="icon-btn" aria-label="Borrar" onClick={() => remove(p)}>
              <Icon name="trash" />
            </button>
          </footer>
        </article>
      ))}
    </>
  );
}
