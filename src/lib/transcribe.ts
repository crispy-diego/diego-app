import { db, getSettings, nowIso } from '../db';

export class TranscribeError extends Error {
  /** true = no tiene caso reintentar sin cambiar algo (llave mala, audio inválido). */
  constructor(message: string, public permanent: boolean) {
    super(message);
  }
}

const extFor = (mime: string) => (mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'webm');

export async function canTranscribe(): Promise<boolean> {
  const s = await getSettings();
  return Boolean(s.transcribeKey) && navigator.onLine;
}

/**
 * Manda el audio al servicio de transcripción (API de OpenAI, compatible con Whisper).
 * La llave vive solo en este dispositivo. Más adelante esto pasará por nuestro propio servidor.
 */
export async function transcribe(data: ArrayBuffer, mime: string): Promise<string> {
  const s = await getSettings();
  if (!s.transcribeKey) throw new TranscribeError('Falta la llave de transcripción en Ajustes.', true);

  const form = new FormData();
  form.append('file', new File([data], `audio.${extFor(mime)}`, { type: mime }));
  form.append('model', s.transcribeModel || 'gpt-4o-transcribe');
  if (s.transcribeHint) form.append('prompt', s.transcribeHint);

  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s.transcribeKey}` },
      body: form,
    });
  } catch {
    throw new TranscribeError('Sin conexión. Se transcribirá cuando vuelva el internet.', false);
  }
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error?.message ?? '';
    } catch {
      /* respuesta sin JSON */
    }
    const permanent = res.status >= 400 && res.status < 500 && res.status !== 429 && res.status !== 408;
    throw new TranscribeError(detail || `Error ${res.status} al transcribir.`, permanent);
  }
  const json = await res.json();
  return String(json.text ?? '').trim();
}

let running = false;

/** Transcribe las notas de voz que quedaron pendientes (por falta de señal o de llave). */
export async function processPending(includeErrors = false): Promise<void> {
  if (running || !(await canTranscribe())) return;
  running = true;
  try {
    const states = includeErrors ? ['pending', 'error'] : ['pending'];
    const pending = await db.entries.where('transcription').anyOf(states).toArray();
    for (const entry of pending) {
      if (!entry.audioId) continue;
      const blob = await db.blobs.get(entry.audioId);
      if (!blob) {
        await db.entries.update(entry.id, { transcription: 'none' });
        continue;
      }
      try {
        const text = await transcribe(blob.data, blob.mime);
        // Releer: pudiste editar la entrada mientras se transcribía.
        const fresh = await db.entries.get(entry.id);
        if (!fresh || fresh.deleted) continue;
        await db.entries.update(entry.id, {
          text: [fresh.text.trim(), text].filter(Boolean).join('\n\n'),
          transcription: 'done',
          updatedAt: nowIso(),
        });
      } catch (e) {
        if (e instanceof TranscribeError && e.permanent) {
          await db.entries.update(entry.id, { transcription: 'error' });
        } else {
          break; // problema de red: lo intentamos después
        }
      }
    }
  } finally {
    running = false;
  }
}
