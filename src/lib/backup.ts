import { db, type StoredBlob } from '../db';
import { dayKey } from './dates';

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function fromBase64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/** Descarga todo (entradas, principios, áreas, fotos y audios) en un archivo JSON. La llave de transcripción no se incluye. */
export async function exportAll(): Promise<void> {
  const [entries, principles, blobs, kv] = await Promise.all([
    db.entries.toArray(),
    db.principles.toArray(),
    db.blobs.toArray(),
    db.kv.toArray(),
  ]);
  const payload = {
    app: 'diego',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    principles,
    kv: kv.filter((r) => r.key !== 'transcribeKey'),
    blobs: blobs.map((b) => ({ ...b, data: toBase64(b.data) })),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `diego-respaldo-${dayKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Restaura un respaldo. Lo que ya existe con el mismo id se reemplaza; nada más se borra. */
export async function importAll(file: File): Promise<number> {
  const payload = JSON.parse(await file.text());
  if (payload?.app !== 'diego' || !Array.isArray(payload.entries)) throw new Error('Este archivo no es un respaldo de la app.');
  const blobs: StoredBlob[] = (payload.blobs ?? []).map((b: StoredBlob & { data: string }) => ({ ...b, data: fromBase64(b.data) }));
  await db.transaction('rw', db.entries, db.principles, db.blobs, db.kv, async () => {
    await db.entries.bulkPut(payload.entries);
    await db.principles.bulkPut(payload.principles ?? []);
    await db.blobs.bulkPut(blobs);
    await db.kv.bulkPut(payload.kv ?? []);
  });
  return payload.entries.length;
}
