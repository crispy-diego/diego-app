import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, nowIso, reflectionText, uid, type Entry, type Reflection } from '../db';
import { dayKey, formatDay, formatTime } from '../lib/dates';
import { Icon, VoiceField } from '../components/ui';

const STEPS: { key: keyof Reflection; question: string; help: string }[] = [
  { key: 'good', question: '¿Qué salió bien hoy?', help: 'Una cosa basta. Puede ser chica.' },
  { key: 'goodPart', question: '¿Cómo contribuiste a que saliera así?', help: 'Qué hiciste, decidiste o dejaste de hacer.' },
  { key: 'bad', question: '¿Qué no salió como querías?', help: 'Sin juzgarte. Solo nómbralo.' },
  { key: 'badPart', question: '¿Cuál fue tu parte en eso?', help: 'No es culpa: es lo que sí está en tus manos la próxima vez.' },
  {
    key: 'others',
    question: 'Si hubo otras personas involucradas, ¿cuál fue tu parte en crear la situación con ellas?',
    help: 'Si hoy no aplica, déjalo en blanco.',
  },
];

const EMPTY: Reflection = { good: '', goodPart: '', bad: '', badPart: '', others: '' };

export default function ReflectionFlow({ entry, onClose }: { entry?: Entry; onClose: () => void }) {
  const day = entry?.day ?? dayKey();
  const [answers, setAnswers] = useState<Reflection>(entry?.reflection ?? EMPTY);
  const [step, setStep] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [id] = useState(() => entry?.id ?? uid());
  const saving = useRef(false);

  const notes =
    useLiveQuery(
      async () => (await db.entries.where('day').equals(day).sortBy('createdAt')).filter((e) => e.kind === 'nota' && !e.deleted && e.text),
      [day],
    ) ?? [];

  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const hasAnything = Object.values(answers).some((v) => v.trim());

  const save = async () => {
    if (saving.current) return; // un doble toque no debe guardar dos veces
    saving.current = true;
    if (!hasAnything) return onClose();
    const clean = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.trim()])) as unknown as Reflection;
    const now = nowIso();
    await db.entries.put({
      id,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
      day,
      kind: 'reflexion',
      areaId: null,
      text: reflectionText(clean),
      mood: entry?.mood ?? null,
      audioId: null,
      transcription: 'none',
      photoIds: [],
      reflection: clean,
      deleted: 0,
    });
    onClose();
  };

  const close = () => {
    if (hasAnything && !confirm('¿Salir sin guardar la reflexión?')) return;
    onClose();
  };

  return (
    <div className="sheet reflection-sheet">
      <header className="sheet-head">
        <button className="icon-btn" aria-label="Cerrar" onClick={close}>
          <Icon name="x" />
        </button>
        <strong>Reflexión · {formatDay(day)}</strong>
        <span className="dots" aria-label={`Paso ${step + 1} de ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <i key={s.key} className={i <= step ? 'on' : ''} />
          ))}
        </span>
      </header>

      <div className="sheet-body">
        {notes.length > 0 && (
          <section className="day-notes">
            <button className="link" onClick={() => setShowNotes(!showNotes)}>
              {showNotes ? 'Ocultar' : 'Ver'} lo que anotaste este día ({notes.length})
            </button>
            {showNotes && (
              <ul>
                {notes.map((n) => (
                  <li key={n.id}>
                    <time>{formatTime(n.createdAt)}</time> {n.text}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <h1 className="question">{current.question}</h1>
        <p className="muted">{current.help}</p>
        <VoiceField key={current.key} value={answers[current.key]} onChange={(v) => setAnswers((a) => ({ ...a, [current.key]: v }))} placeholder="Escribe o dicta…" autoFocus />
      </div>

      <footer className="sheet-foot">
        <button className="btn" onClick={() => setStep(step - 1)} disabled={step === 0}>
          Atrás
        </button>
        {last ? (
          <button className="btn primary" onClick={save}>
            <Icon name="check" /> Guardar
          </button>
        ) : (
          <button className="btn primary" onClick={() => setStep(step + 1)}>
            Siguiente
          </button>
        )}
      </footer>
    </div>
  );
}
