import { db } from '../db';
import { supabase } from './supabase';

export interface AgendaEvent {
  id: string;
  title: string;
  start: string; // ISO con hora, o YYYY-MM-DD si dura todo el día
  end: string;
  allDay: boolean;
  place: string;
  calendar: string;
  calendarIndex: number;
  people: string[];
  notes: string;
}

export interface Agenda {
  events: AgendaEvent[];
  /** real = recién traída; guardada = última copia (sin conexión); ejemplo = aún no hay servidor o sesión. */
  source: 'real' | 'guardada' | 'ejemplo';
}

const COLORS = ['var(--green)', 'var(--accent)', 'var(--green-dark)', 'var(--green-light)'];
export const eventColor = (e: AgendaEvent) => COLORS[e.calendarIndex % COLORS.length];

const timeFmt = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: false });
export const eventTime = (iso: string, allDay: boolean) => (allDay ? 'Todo el día' : timeFmt.format(new Date(iso)));

function demoAgenda(day: string): AgendaEvent[] {
  const at = (h: string) => `${day}T${h}:00`;
  const base = { allDay: false, calendar: 'Ejemplo' };
  return [
    { ...base, id: 'demo-1', title: 'Junta de equipo', start: at('09:00'), end: at('10:00'), place: 'Videollamada', calendarIndex: 0, people: ['Ana', 'Luis', 'Sofía'], notes: 'Revisar avances de la semana y pendientes.' },
    { ...base, id: 'demo-2', title: 'Comida con la familia', start: at('13:30'), end: at('15:00'), place: 'Casa de mis papás', calendarIndex: 1, people: ['Mamá', 'Papá'], notes: '' },
    { ...base, id: 'demo-3', title: 'Gimnasio', start: at('18:00'), end: at('19:00'), place: 'Gimnasio', calendarIndex: 2, people: [], notes: 'Día de pierna.' },
  ];
}

/** Diferencia horaria del teléfono, p. ej. "-06:00". */
function localOffset(): string {
  const min = -new Date().getTimezoneOffset();
  const abs = Math.abs(min);
  return `${min < 0 ? '-' : '+'}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** Agenda del día: del servidor si hay sesión y conexión; si no, la última copia guardada; si no, el ejemplo. */
export async function loadAgenda(day: string): Promise<Agenda> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (!supabase || !session) return { events: demoAgenda(day), source: 'ejemplo' };

  const cacheKey = `agenda:${day}`;
  try {
    const { data, error } = await supabase.functions.invoke('agenda', { body: { day, offset: localOffset() } });
    if (error || !Array.isArray(data?.events)) throw error ?? new Error('Respuesta inválida');
    await db.kv.put({ key: cacheKey, value: data.events });
    return { events: data.events, source: 'real' };
  } catch {
    const cached = await db.kv.get(cacheKey);
    return { events: (cached?.value as AgendaEvent[] | undefined) ?? [], source: 'guardada' };
  }
}
