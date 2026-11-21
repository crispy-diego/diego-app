import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveSetting } from '../db';
import { exportAll, importAll } from '../lib/backup';
import { processPending } from '../lib/transcribe';
import { useApp } from '../App';
import { supabase } from '../lib/supabase';

export default function SettingsView() {
  const { settings } = useApp();
  const [key, setKey] = useState(settings.transcribeKey);
  const [model, setModel] = useState(settings.transcribeModel);
  const [hint, setHint] = useState(settings.transcribeHint);
  const [status, setStatus] = useState('');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const pending = useLiveQuery(() => db.entries.where('transcription').anyOf('pending', 'error').count(), []) ?? 0;

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => {});
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setAccount(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setAccount(session?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPassword('');
    setStatus(error ? 'No se pudo entrar. Revisa el correo y la contraseña.' : 'Sesión iniciada.');
  };

  const saveTranscription = async () => {
    await saveSetting('transcribeKey', key.trim());
    await saveSetting('transcribeModel', model.trim() || 'gpt-4o-transcribe');
    await saveSetting('transcribeHint', hint.trim());
    setStatus('Guardado.');
    void processPending(true);
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const n = await importAll(file);
      setStatus(`Respaldo restaurado: ${n} entradas.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'No se pudo leer el respaldo.');
    }
    if (importInput.current) importInput.current.value = '';
  };

  return (
    <>
      <header className="page-head">
        <h1>Ajustes</h1>
      </header>

      {supabase && (
        <>
          <h2>Tu cuenta</h2>
          <section className="card form">
            {account ? (
              <div className="row">
                <span className="spacer">{account}</span>
                <button className="btn" onClick={() => void supabase!.auth.signOut()}>
                  Salir
                </button>
              </div>
            ) : (
              <>
                <p className="hint">Entra para ver tu agenda real.</p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" autoComplete="username" autoCapitalize="off" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" autoComplete="current-password" />
                <div className="row">
                  <button className="btn primary" onClick={signIn} disabled={!email.trim() || !password}>
                    Entrar
                  </button>
                </div>
              </>
            )}
          </section>
        </>
      )}

      <h2>Transcripción de voz</h2>
      <section className="card form">
        <p className="hint">Sin llave, el audio se guarda igual y puedes usar el dictado del teclado.</p>
        <label>
          Llave de API de OpenAI
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-…" autoComplete="off" />
        </label>
        <label>
          Modelo
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-transcribe" autoCapitalize="off" />
        </label>
        <label>
          Nombres y palabras que usas
          <textarea value={hint} onChange={(e) => setHint(e.target.value)} rows={3} />
        </label>
        <div className="row">
          <button className="btn primary" onClick={saveTranscription}>
            Guardar
          </button>
          {pending > 0 && (
            <button className="btn" onClick={() => void processPending(true)}>
              Transcribir pendientes ({pending})
            </button>
          )}
        </div>
      </section>

      <h2>Tus datos</h2>
      <section className="card form">
        <p className="hint">Todo vive en este teléfono{persisted ? ', protegido contra limpieza automática' : ''}. Descarga un respaldo de vez en cuando.</p>
        <div className="row">
          <button className="btn" onClick={() => void exportAll()}>
            Descargar respaldo
          </button>
          <button className="btn" onClick={() => importInput.current?.click()}>
            Restaurar respaldo
          </button>
        </div>
        <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={(e) => void doImport(e.target.files?.[0])} />
      </section>

      {status && <p className="hint center">{status}</p>}
    </>
  );
}
