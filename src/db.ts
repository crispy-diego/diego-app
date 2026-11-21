import Dexie, { type Table } from 'dexie';

/** Las cinco respuestas de la reflexión de la noche. */
export interface Reflection {
  good: string;
  goodPart: string;
  bad: string;
  badPart: string;
  others: string;
}

export type TranscriptionState = 'none' | 'pending' | 'done' | 'error';

export interface Entry {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO — servirá para sincronizar después
  day: string; // YYYY-MM-DD en hora local
  kind: 'nota' | 'reflexion';
  areaId: string | null;
  text: string;
  mood: number | null; // 1–5
  audioId: string | null;
  transcription: TranscriptionState;
  photoIds: string[];
  reflection: Reflection | null;
  deleted: 0 | 1; // borrado lógico, para que la sincronización futura lo propague
}

export interface StoredBlob {
  id: string;
  type: 'audio' | 'photo';
  mime: string;
  data: ArrayBuffer;
  createdAt: string;
}

export interface Principle {
  id: string;
  text: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  id: string;
  name: string;
  color: string;
}

export interface Settings {
  areas: Area[];
  transcribeKey: string;
  transcribeModel: string;
  transcribeHint: string;
}

interface KV {
  key: string;
  value: unknown;
}

class DiegoDB extends Dexie {
  entries!: Table<Entry, string>;
  blobs!: Table<StoredBlob, string>;
  principles!: Table<Principle, string>;
  kv!: Table<KV, string>;

  constructor() {
    super('diego');
    this.version(1).stores({
      entries: 'id, day, createdAt, areaId, transcription',
      blobs: 'id, type',
      principles: 'id, createdAt',
      kv: 'key',
    });
  }
}

export const db = new DiegoDB();

export const AREA_COLORS = ['#b4532a', '#2f6f6a', '#8a5a9e', '#3d6b9c', '#a8842a', '#5d7a3a', '#a84860', '#6b6459'];

export const DEFAULT_SETTINGS: Settings = {
  areas: [
    { id: 'trabajo', name: 'Trabajo', color: AREA_COLORS[0] },
    { id: 'familia', name: 'Familia', color: AREA_COLORS[1] },
    { id: 'social', name: 'Vida social', color: AREA_COLORS[2] },
    { id: 'salud', name: 'Salud', color: AREA_COLORS[5] },
    { id: 'dinero', name: 'Dinero', color: AREA_COLORS[4] },
    { id: 'personal', name: 'Personal', color: AREA_COLORS[3] },
  ],
  transcribeKey: '',
  transcribeModel: 'gpt-4o-transcribe',
  transcribeHint: 'Diario personal de Diego. Español de México, con algunas palabras en inglés.',
};

export async function getSettings(): Promise<Settings> {
  const rows = await db.kv.toArray();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...stored } as Settings;
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await db.kv.put({ key, value });
}

export const uid = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

export async function putBlob(type: StoredBlob['type'], mime: string, data: ArrayBuffer): Promise<string> {
  const id = uid();
  await db.blobs.put({ id, type, mime, data, createdAt: nowIso() });
  return id;
}

export async function deleteEntry(entry: Entry) {
  const blobIds = [...entry.photoIds, ...(entry.audioId ? [entry.audioId] : [])];
  await db.transaction('rw', db.entries, db.blobs, async () => {
    await db.blobs.bulkDelete(blobIds);
    await db.entries.put({
      ...entry,
      text: '',
      reflection: null,
      audioId: null,
      photoIds: [],
      transcription: 'none',
      deleted: 1,
      updatedAt: nowIso(),
    });
  });
}

/** Texto plano de una reflexión, para que el buscador la encuentre. */
export function reflectionText(r: Reflection): string {
  return [r.good, r.goodPart, r.bad, r.badPart, r.others].filter(Boolean).join('\n');
}
