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
  const area = settings.areas.find((a) => a.id === entry.areaId);
  const isReflection = entry.kind === 'reflexion';

  const remove = () => {
    if (confirm('¿Borrar esta entrada? No se puede deshacer.')) void deleteEntry(entry);
  };

  return (
    <article className={`card entry ${isReflection ? 'reflection' : ''}`}>
      <header className="entry-head">
        <span className="entry-time">
          {isReflection && <Icon name="moon" />}
          {showDay ? `${showDay} · ` : ''}
          {isReflection ? 'Reflexión' : formatTime(entry.createdAt)}
        </span>
        {area && <AreaChip area={area} />}
        {entry.mood && <span className="entry-mood">{MOODS[entry.mood - 1]}</span>}
        <span className="spacer" />
        <button
          className="icon-btn"
          aria-label="Editar"
          onClick={() => open(isReflection ? { type: 'reflection', entry } : { type: 'capture', entry })}
        >
          <Icon name="pencil" />
        </button>
        <button className="icon-btn" aria-label="Borrar" onClick={remove}>
          <Icon name="trash" />
        </button>
      </header>

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

      {entry.photoIds.length > 0 && (
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
    </article>
  );
}
