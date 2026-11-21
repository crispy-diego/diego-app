import { useEffect, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from 'react';
import type { Area } from '../db';
import { formatSeconds, useBlobUrl, useRecorder } from '../lib/media';
import { canTranscribe, transcribe } from '../lib/transcribe';

const ICONS = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13" />,
  plus: <path d="M12 5v14M5 12h14" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  sliders: (
    <>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  mic: <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />,
  camera: (
    <>
      <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  pencil: <path d="M4 20l1-4L16 5l3 3L8 19z" />,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  check: <path d="M5 12l5 5 9-10" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

/** Textarea que crece con el contenido. */
export function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return <textarea ref={ref} {...props} />;
}

export function AreaChip({ area, active, onClick }: { area: Area; active?: boolean; onClick?: () => void }) {
  const style = { '--chip': area.color } as React.CSSProperties;
  return onClick ? (
    <button type="button" className={`chip ${active ? 'active' : ''}`} style={style} onClick={onClick}>
      {area.name}
    </button>
  ) : (
    <span className="chip active small" style={style}>
      {area.name}
    </span>
  );
}

export const MOODS = ['😞', '😕', '😐', '🙂', '😄'];

export function Photo({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const url = useBlobUrl(id);
  const [open, setOpen] = useState(false);
  if (!url) return <div className="photo placeholder" />;
  return (
    <>
      <div className="photo">
        <img src={url} alt="" onClick={() => setOpen(true)} />
        {onRemove && (
          <button type="button" className="photo-x" aria-label="Quitar foto" onClick={onRemove}>
            <Icon name="x" />
          </button>
        )}
      </div>
      {open && (
        <div className="lightbox" onClick={() => setOpen(false)}>
          <img src={url} alt="" />
        </div>
      )}
    </>
  );
}

export function AudioPlayer({ id }: { id: string }) {
  const url = useBlobUrl(id);
  return url ? <audio className="audio" controls preload="metadata" src={url} /> : null;
}

/**
 * Campo de texto con botón de dictado: graba, transcribe y agrega el texto.
 * Si no hay transcripción disponible, el botón no aparece (queda el dictado del teclado).
 */
export function VoiceField({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const rec = useRecorder();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    void canTranscribe().then(setAvailable);
  }, []);

  const toggle = async () => {
    setError('');
    if (!rec.recording) {
      try {
        await rec.start();
      } catch {
        setError('No pude usar el micrófono. Revisa el permiso.');
      }
      return;
    }
    const audio = await rec.stop();
    if (!audio) return;
    setBusy(true);
    try {
      const text = await transcribe(audio.data, audio.mime);
      onChange([latest.current.trim(), text].filter(Boolean).join(' '));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo transcribir.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="voice-field">
      <AutoTextarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} autoFocus={autoFocus} />
      {available && (
        <button type="button" className={`mic-small ${rec.recording ? 'recording' : ''}`} onClick={toggle} disabled={busy}>
          <Icon name={rec.recording ? 'stop' : 'mic'} />
          {busy ? 'Transcribiendo…' : rec.recording ? `Detener · ${formatSeconds(rec.seconds)}` : 'Dictar'}
        </button>
      )}
      {error && <p className="hint error">{error}</p>}
    </div>
  );
}
