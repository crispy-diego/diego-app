import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../db';

export interface Recording {
  data: ArrayBuffer;
  mime: string;
  seconds: number;
}

function pickMime(): string {
  const options = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  return options.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ?? '';
}

/** Grabadora de voz. `start()` pide el micrófono; `stop()` devuelve el audio. */
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  const cleanup = useCallback(() => {
    window.clearInterval(timer.current);
    rec.current?.stream.getTracks().forEach((t) => t.stop());
    rec.current = null;
    setRecording(false);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = pickMime();
    const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunks.current = [];
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.start(1000);
    rec.current = r;
    startedAt.current = Date.now();
    setSeconds(0);
    setRecording(true);
    timer.current = window.setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 500);
  }, []);

  const stop = useCallback((): Promise<Recording | null> => {
    const r = rec.current;
    if (!r) return Promise.resolve(null);
    return new Promise((resolve) => {
      r.onstop = async () => {
        const mime = (r.mimeType || 'audio/mp4').split(';')[0];
        const blob = new Blob(chunks.current, { type: mime });
        const secs = Math.round((Date.now() - startedAt.current) / 1000);
        cleanup();
        resolve(blob.size ? { data: await blob.arrayBuffer(), mime, seconds: secs } : null);
      };
      r.stop();
    });
  }, [cleanup]);

  return { recording, seconds, start, stop };
}

export const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Reduce la foto a máx. 1600 px y JPEG, para que el diario no pese gigas. */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<{ data: ArrayBuffer; mime: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir la imagen.'))), 'image/jpeg', quality),
    );
    return { data: await blob.arrayBuffer(), mime: 'image/jpeg' };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** URL temporal para mostrar una foto o audio guardado en la base local. */
export function useBlobUrl(id: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    let made: string | null = null;
    setUrl(null);
    if (!id) return;
    db.blobs.get(id).then((b) => {
      if (!alive || !b) return;
      made = URL.createObjectURL(new Blob([b.data], { type: b.mime }));
      setUrl(made);
    });
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [id]);
  return url;
}
