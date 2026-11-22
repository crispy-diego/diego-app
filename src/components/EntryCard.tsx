import { useState } from 'react';
import { deleteEntry, type Entry } from '../db';
import { formatTime } from '../lib/dates';
import { processPending } from '../lib/transcribe';
import { useApp } from '../App';
import { AreaChip, AudioPlayer, Icon, MOODS, Photo } from './ui';

export const REFLECTION_LABELS = {
  good: 'Salió bien',
  goodPart: 'Cómo contribuí',
  bad: 'No salió como quería',
  badPart: 'Mi parte en eso',
  others: 'Con otras personas',
} as const;

export default function EntryCard({ entry, showDay }: { entry: Entry; showDay?: string }) {
  const { settings, open } = useApp();
  const [expanded, setExpanded] = useState(false);
  const area = settings.areas.find((a) => a.id === entry.areaId);
  const isReflection = entry.kind === 'reflexion';

  const remove = () => {
    if (confirm('¿Borrar esta entrada? No se puede deshacer.')) void deleteEntry(entry);
  };

  // Lo que se ve con la tarjeta cerrada: el primer renglón de lo que escribiste.
  const r = entry.reflection;
  const summary = (isReflection && r ? [r.good, r.bad, r.goodPart, r.badPart, r.others].find((t) => t?.trim()) : entry.text)?.trim() ?? '';
  const photos = entry.photoIds.length;

  return (
    <article className={`card entry ${isReflection ? 'reflection' : ''} ${expanded ? 'open' : ''}`}>
      <button className="entry-summary" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
        <span className="entry-badge">{entry.mood ? MOODS[entry.mood - 1] : <Icon name={isReflection ? 'moon' : 'pencil'} />}</span>
        <span className="entry-main">
          <span className="entry-title">
            <b>{isReflection ? 'Reflexión' : 'Diario'}</b>
            <span>
              {showDay ? `${showDay} · ` : ''}
              {formatTime(entry.createdAt)}
            </span>
          </span>
          {!expanded && (summary || photos > 0) && (
            <span className="entry-preview">{summary || (photos === 1 ? '1 foto' : `${photos} fotos`)}</span>
          )}
        </span>
        <svg className="entry-chevron" viewBox="0 0 18 18" aria-hidden>
          <path d="M5 7l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="entry-body">
          {area && <AreaChip area={area} />}

          {isReflection && entry.reflection ? (
            <dl className="reflection-list">
              {(Object.keys(REFLECTION_LABELS) as (keyof typeof REFLECTION_LABELS)[]).map((k) =>
                entry.reflection![k] ? (
                  <div key={k}>
                    <dt>{REFLECTION_LABELS[k]}</dt>
                    <dd>{entry.reflection![k]}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          ) : (
            entry.text && <p className="entry-text">{entry.text}</p>
          )}

          {photos > 0 && (
            <div className="photos">
              {entry.photoIds.map((id) => (
                <Photo key={id} id={id} />
              ))}
            </div>
          )}

          {entry.audioId && <AudioPlayer id={entry.audioId} />}
          {entry.transcription === 'pending' && <p className="hint">Audio guardado. Se transcribe cuando haya conexión y llave configurada.</p>}
          {entry.transcription === 'error' && (
            <p className="hint error">
              No se pudo transcribir este audio.{' '}
              <button className="link" onClick={() => void processPending(true)}>
                Reintentar
              </button>
            </p>
          )}

          <div className="entry-actions">
            <button className="btn" onClick={() => open(isReflection ? { type: 'reflection', entry } : { type: 'capture', entry })}>
              <Icon name="pencil" /> Editar
            </button>
            <button className="btn" onClick={remove}>
              <Icon name="trash" /> Borrar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
