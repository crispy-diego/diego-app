import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '../db';
import { formatDay } from '../lib/dates';
import EntryCard from '../components/EntryCard';

const PAGE = 40;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function Journal() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const all = useLiveQuery(async () => (await db.entries.orderBy('createdAt').reverse().toArray()).filter((e) => !e.deleted), []);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return (all ?? []).filter((e) => !q || normalize(e.text).includes(q));
  }, [all, query]);

  const groups = useMemo(() => {
    const byDay = new Map<string, Entry[]>();
    for (const e of filtered.slice(0, limit)) byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
    return [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered, limit]);

  if (!all) return null;

  return (
    <>
      <header className="page-head">
        <h1>Diario</h1>
      </header>

      <input className="search" type="search" placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} />

      {groups.length === 0 && <p className="empty">{all.length ? 'Nada coincide con esa búsqueda.' : 'Aquí vas a ver todo lo que guardes con el +.'}</p>}

      {groups.map(([day, entries]) => (
        <section key={day}>
          <h2>{formatDay(day)}</h2>
          {entries.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </section>
      ))}

      {filtered.length > limit && (
        <button className="btn block" onClick={() => setLimit(limit + PAGE)}>
          Ver más
        </button>
      )}
    </>
  );
}
