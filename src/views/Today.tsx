import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { dayKey, formatLongDate, greeting, shiftDay } from '../lib/dates';
import { useApp } from '../App';
import EntryCard from '../components/EntryCard';
import { agendaForToday } from '../lib/agenda';
import { sceneForDay, sceneMarkup } from '../scenes';

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function Scene() {
  const scene = sceneForDay();
  // El SVG viene de nuestro propio archivo de paisajes, no de datos externos.
  return <div className="scene" style={{ background: scene.sky }} dangerouslySetInnerHTML={{ __html: sceneMarkup(scene) }} />;
}

function Leaf() {
  return (
    <svg viewBox="0 0 34 34" aria-hidden>
      <path d="M17 3c9 5 12 14 0 28C5 17 8 8 17 3z" fill="var(--green-light)" />
      <path d="M17 9v20M17 16l-5-4M17 21l5-4" fill="none" stroke="var(--green-dark)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ReflectCard({ onClick }: { onClick: () => void }) {
  return (
    <button className="reflect-card" onClick={onClick}>
      <svg className="night" viewBox="0 0 300 130" preserveAspectRatio="xMaxYMax slice" aria-hidden>
        <circle cx="238" cy="38" r="20" fill="var(--accent)" />
        <circle cx="229" cy="32" r="17" fill="var(--green-dark)" />
        <g fill="var(--cream)">
          <circle cx="196" cy="22" r="1.8" />
          <circle cx="272" cy="64" r="1.5" />
          <circle cx="214" cy="72" r="1.4" />
          <circle cx="284" cy="20" r="1.6" />
        </g>
        <path d="M120 130q40-44 76-30q30-34 60-18q26-8 44 8v40z" fill="var(--green)" />
        <path d="M170 130q40-26 70-14t60-6v20z" fill="var(--green-light)" opacity=".55" />
      </svg>
      <b>Reflexión del día</b>
      <span className="go">
        <svg viewBox="0 0 18 18" aria-hidden>
          <path d="M4 9h10M10 5l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

export default function Today() {
  const { open, go } = useApp();
  const today = dayKey();

  const data = useLiveQuery(async () => {
    const lookbacks = [
      { label: 'Hace una semana', day: shiftDay(today, { days: -7 }) },
      { label: 'Hace un mes', day: shiftDay(today, { months: -1 }) },
      { label: 'Hace un año', day: shiftDay(today, { years: -1 }) },
    ];
    const [todays, principles, memories] = await Promise.all([
      db.entries.where('day').equals(today).sortBy('createdAt'),
      db.principles.orderBy('createdAt').toArray(),
      Promise.all(
        lookbacks.map(async (l) => ({
          ...l,
          entries: (await db.entries.where('day').equals(l.day).sortBy('createdAt')).filter((e) => !e.deleted),
        })),
      ),
    ]);
    return { todays: todays.filter((e) => !e.deleted), principles, memories };
  }, [today]);

  if (!data) return null;

  const notes = data.todays.filter((e) => e.kind === 'nota').reverse();
  const reflection = data.todays.find((e) => e.kind === 'reflexion');
  const principle = data.principles.length ? data.principles[hash(today) % data.principles.length] : null;
  const memories = data.memories.filter((m) => m.entries.length);

  return (
    <>
      <Scene />
      <header className="page-head">
        <p className="eyebrow">{formatLongDate()}</p>
        <h1>{greeting()}, Diego</h1>
      </header>

      <ul className="agenda">
        {agendaForToday().map((e) => (
          <li key={e.id}>
            <button onClick={() => open({ type: 'event', event: e })}>
              <i style={{ background: e.color }} />
              <span>{e.title}</span>
              <time>{e.start}</time>
            </button>
          </li>
        ))}
      </ul>
      <p className="example-tag">Agenda de ejemplo</p>

      {principle ? (
        <button className="principle-card" onClick={() => go('principios')}>
          <Leaf />
          {principle.text}
          {principle.source && <cite>{principle.source}</cite>}
        </button>
      ) : (
        <button className="principle-card empty-state" onClick={() => go('principios')}>
          <Leaf />
          Agrega tu primer principio
        </button>
      )}

      {notes.map((e) => (
        <EntryCard key={e.id} entry={e} />
      ))}

      {reflection ? <EntryCard entry={reflection} /> : <ReflectCard onClick={() => open({ type: 'reflection' })} />}

      {memories.map((m) => (
        <section key={m.label}>
          <h2>{m.label}</h2>
          {m.entries.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </section>
      ))}
    </>
  );
}
