import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, nowIso, putBlob, uid, type Entry, type TranscriptionState } from '../db';
import { dayKey } from '../lib/dates';
import { compressImage, formatSeconds, useRecorder, type Recording } from '../lib/media';
import { canTranscribe, processPending, transcribe, TranscribeError } from '../lib/transcribe';
import { AudioPlayer, AutoTextarea, Icon, MOODS, Photo } from '../components/ui';

const PHOTOS_PER_DAY = 3;

interface NewPhoto {
  key: string;
  data: ArrayBuffer;
  mime: string;
  url: string;
}

export default function Capture({ entry, initialText, onClose }: { entry?: Entry; initialText?: string; onClose: () => void }) {
  const day = entry?.day ?? dayKey();

  const [text, setText] = useState(entry?.text ?? initialText ?? '');
  // Las categorías ya no se eligen a mano: las pondrá la IA. Se conserva la que la nota ya tuviera.
  const areaId = entry?.areaId ?? null;
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [keptPhotos, setKeptPhotos] = useState<string[]>(entry?.photoIds ?? []);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [audio, setAudio] = useState<Recording | null>(null);
  const [audioState, setAudioState] = useState<TranscriptionState>(entry?.transcription ?? 'none');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const rec = useRecorder();
  const saving = useRef(false);

  // Fotos ya usadas hoy en otras entradas, para respetar el máximo diario.
  const usedElsewhere =
    useLiveQuery(async () => {
      const sameDay = await db.entries.where('day').equals(day).toArray();
      return sameDay.filter((e) => e.id !== entry?.id).reduce((n, e) => n + e.photoIds.length, 0);
    }, [day]) ?? 0;
  const photosLeft = Math.max(0, PHOTOS_PER_DAY - usedElsewhere - keptPhotos.length - newPhotos.length);

  const hasUnsavedPendingAudio = audio !== null && audioState === 'pending';

  const toggleRecording = async () => {
    setMessage('');
    if (!rec.recording) {
      try {
        await rec.start();
      } catch {
        setMessage('No pude usar el micrófono. Revisa el permiso en tu teléfono.');
      }
      return;
    }
    const recording = await rec.stop();
    if (!recording) return;
    setAudio(recording);
    if (!(await canTranscribe())) {
      setAudioState('pending');
      setMessage(
        navigator.onLine
          ? 'Audio guardado. Para transcribirlo, configura la transcripción en Ajustes.'
          : 'Sin conexión: el audio se guarda y se transcribe solo cuando vuelva el internet.',
      );
      return;
    }
    setBusy(true);
    try {
      const transcript = await transcribe(recording.data, recording.mime);
      setText((t) => [t.trim(), transcript].filter(Boolean).join('\n\n'));
      setAudioState('done');
    } catch (e) {
      setAudioState(e instanceof TranscribeError && e.permanent ? 'error' : 'pending');
      setMessage(e instanceof Error ? e.message : 'No se pudo transcribir.');
    } finally {
      setBusy(false);
    }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).slice(0, photosLeft);
    if (files.length > picked.length) setMessage(`Máximo ${PHOTOS_PER_DAY} fotos por día: elige las que mejor cuenten tu día.`);
    for (const f of picked) {
      try {
        const { data, mime } = await compressImage(f);
        const url = URL.createObjectURL(new Blob([data], { type: mime }));
        setNewPhotos((p) => [...p, { key: uid(), data, mime, url }]);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'No se pudo agregar la foto.');
      }
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const hasContent = (text.trim() && text !== initialText) || audio || entry?.audioId || keptPhotos.length || newPhotos.length;

  const save = async () => {
    if (!hasContent || busy || rec.recording || saving.current) return;
    saving.current = true; // un doble toque no debe guardar dos veces
    setBusy(true);
    try {
      const photoIds = [...keptPhotos];
      for (const p of newPhotos) photoIds.push(await putBlob('photo', p.mime, p.data));
      const removedPhotos = (entry?.photoIds ?? []).filter((id) => !keptPhotos.includes(id));

      let audioId = entry?.audioId ?? null;
      if (audio) {
        if (audioId) await db.blobs.delete(audioId);
        audioId = await putBlob('audio', audio.mime, audio.data);
      }

      const now = nowIso();
      await db.entries.put({
        id: entry?.id ?? uid(),
        createdAt: entry?.createdAt ?? now,
        updatedAt: now,
        day,
        kind: 'nota',
        areaId,
        text: text.trim(),
        mood,
        audioId,
        transcription: audioId ? audioState : 'none',
        photoIds,
        reflection: null,
        deleted: 0,
      });
      await db.blobs.bulkDelete(removedPhotos);
      newPhotos.forEach((p) => URL.revokeObjectURL(p.url));
      void processPending();
      onClose();
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const close = () => {
    if (hasContent && !entry && !confirm('¿Descartar esta nota?')) return;
    onClose();
  };

  return (
    <div className="sheet">
      <header className="sheet-head">
        <button className="icon-btn" aria-label="Cerrar" onClick={close}>
          <Icon name="x" />
        </button>
        <strong>{entry ? 'Editar nota' : 'Nueva nota'}</strong>
        <button className="btn primary" onClick={save} disabled={!hasContent || busy || rec.recording}>
          Guardar
        </button>
      </header>

      <div className="sheet-body">
        <AutoTextarea
          className="capture-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="¿Qué pasó? ¿Qué traes en la cabeza?"
          rows={5}
          autoFocus={!entry}
        />

        <div className="recorder">
          <button
            type="button"
            className={`mic-big ${rec.recording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={busy || hasUnsavedPendingAudio}
            aria-label={rec.recording ? 'Detener grabación' : 'Grabar nota de voz'}
          >
            <Icon name={rec.recording ? 'stop' : 'mic'} />
          </button>
          <p className="recorder-status">
            {busy
              ? 'Transcribiendo…'
              : rec.recording
                ? `Grabando · ${formatSeconds(rec.seconds)} · toca para terminar`
                : hasUnsavedPendingAudio
                  ? `Nota de voz lista (${formatSeconds(audio.seconds)}). Guarda para conservarla.`
                  : audioState === 'done' && audio
                    ? 'Transcrito. Revisa el texto o graba más.'
                    : 'Toca para dictar'}
          </p>
        </div>
        {entry?.audioId && !audio && <AudioPlayer id={entry.audioId} />}
        {message && <p className="hint">{message}</p>}

        <h3>¿Cómo te sientes?</h3>
        <div className="moods">
          {MOODS.map((m, i) => (
            <button key={m} type="button" className={`mood ${mood === i + 1 ? 'active' : ''}`} onClick={() => setMood(mood === i + 1 ? null : i + 1)}>
              {m}
            </button>
          ))}
        </div>

        <h3>
          Fotos <span className="muted">· quedan {photosLeft} de {PHOTOS_PER_DAY} hoy</span>
        </h3>
        <div className="photos">
          {keptPhotos.map((id) => (
            <Photo key={id} id={id} onRemove={() => setKeptPhotos((p) => p.filter((x) => x !== id))} />
          ))}
          {newPhotos.map((p) => (
            <div className="photo" key={p.key}>
              <img src={p.url} alt="" />
              <button
                type="button"
                className="photo-x"
                aria-label="Quitar foto"
                onClick={() => {
                  URL.revokeObjectURL(p.url);
                  setNewPhotos((list) => list.filter((x) => x.key !== p.key));
                }}
              >
                <Icon name="x" />
              </button>
            </div>
          ))}
          {photosLeft > 0 && (
            <button type="button" className="photo add" onClick={() => fileInput.current?.click()} aria-label="Agregar foto">
              <Icon name="camera" />
            </button>
          )}
        </div>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => void addPhotos(e.target.files)} />
      </div>
    </div>
  );
}
