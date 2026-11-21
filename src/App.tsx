import { createContext, useContext, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, type Entry, type Settings } from './db';
import { processPending } from './lib/transcribe';
import { Icon, type IconName } from './components/ui';
import Today from './views/Today';
import Journal from './views/Journal';
import Principles from './views/Principles';
import SettingsView from './views/Settings';
import Capture from './views/Capture';
import ReflectionFlow from './views/Reflection';
import EventDetail from './views/EventDetail';
import type { AgendaEvent } from './lib/agenda';

type Tab = 'hoy' | 'diario' | 'principios' | 'ajustes';

export type Overlay =
  | null
  | { type: 'capture'; entry?: Entry; initialText?: string }
  | { type: 'event'; event: AgendaEvent }
  | { type: 'reflection'; entry?: Entry };

interface Ctx {
  settings: Settings;
  open: (o: Overlay) => void;
  go: (t: Tab) => void;
}

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => useContext(AppCtx)!;

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'hoy', label: 'Hoy', icon: 'sun' },
  { id: 'diario', label: 'Diario', icon: 'book' },
  { id: 'principios', label: 'Principios', icon: 'star' },
  { id: 'ajustes', label: 'Ajustes', icon: 'sliders' },
];

export default function App() {
  const settings = useLiveQuery(getSettings, []);
  const [tab, setTab] = useState<Tab>('hoy');
  const [overlay, setOverlay] = useState<Overlay>(null);

  useEffect(() => {
    // Pide al sistema no borrar los datos locales si falta espacio.
    navigator.storage?.persist?.().catch(() => {});
    const run = () => void processPending();
    run();
    window.addEventListener('online', run);
    return () => window.removeEventListener('online', run);
  }, []);

  if (!settings) return null;

  const tabButton = (t: (typeof TABS)[number]) => (
    <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
      <Icon name={t.icon} />
      <span>{t.label}</span>
    </button>
  );

  return (
    <AppCtx.Provider value={{ settings, open: setOverlay, go: setTab }}>
      <main className="screen" key={tab}>
        {tab === 'hoy' && <Today />}
        {tab === 'diario' && <Journal />}
        {tab === 'principios' && <Principles />}
        {tab === 'ajustes' && <SettingsView />}
      </main>

      <nav className="tabbar">
        {TABS.slice(0, 2).map(tabButton)}
        <button className="fab" aria-label="Nueva nota" onClick={() => setOverlay({ type: 'capture' })}>
          <Icon name="plus" />
        </button>
        {TABS.slice(2).map(tabButton)}
      </nav>

      {overlay?.type === 'capture' && <Capture entry={overlay.entry} initialText={overlay.initialText} onClose={() => setOverlay(null)} />}
      {overlay?.type === 'event' && <EventDetail event={overlay.event} onClose={() => setOverlay(null)} />}
      {overlay?.type === 'reflection' && <ReflectionFlow entry={overlay.entry} onClose={() => setOverlay(null)} />}
    </AppCtx.Provider>
  );
}
