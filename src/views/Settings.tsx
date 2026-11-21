import { useEffect, useRef, useState } from 'react';
import { exportAll, importAll } from '../lib/backup';
import { supabase } from '../lib/supabase';

export default function SettingsView() {
  const [status, setStatus] = useState('');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const signUp = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setPassword('');
    setStatus(error ? `No se pudo crear la cuenta: ${error.message}` : 'Cuenta creada. Abre el correo de confirmación que te llegó y luego entra aquí.');
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
                <p className="hint">Entra para ver tu agenda real. La primera vez, crea tu cuenta con una contraseña de 8 caracteres o más.</p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" autoComplete="username" autoCapitalize="off" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" autoComplete="current-password" />
                <div className="row">
                  <button className="btn primary" onClick={signIn} disabled={!email.trim() || !password}>
                    Entrar
                  </button>
                  <button className="btn" onClick={signUp} disabled={!email.trim() || password.length < 8}>
                    Crear cuenta
                  </button>
                </div>
              </>
            )}
          </section>
        </>
      )}

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
