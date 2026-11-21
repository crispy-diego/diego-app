export interface AgendaEvent {
  id: string;
  title: string;
  start: string; // HH:MM
  end: string; // HH:MM
  place: string;
  calendar: string;
  people: string[];
  notes: string;
  color: string;
}

// DEMO: agenda de ejemplo. Cuando se conecten tus calendarios, esta función
// devolverá los eventos reales del día con la misma forma.
export function agendaForToday(): AgendaEvent[] {
  return [
    {
      id: 'demo-1',
      title: 'Junta de equipo',
      start: '9:00',
      end: '10:00',
      place: 'Videollamada',
      calendar: 'Trabajo',
      people: ['Ana', 'Luis', 'Sofía'],
      notes: 'Revisar avances de la semana y pendientes.',
      color: 'var(--green)',
    },
    {
      id: 'demo-2',
      title: 'Comida con la familia',
      start: '13:30',
      end: '15:00',
      place: 'Casa de mis papás',
      calendar: 'Personal',
      people: ['Mamá', 'Papá'],
      notes: '',
      color: 'var(--accent)',
    },
    {
      id: 'demo-3',
      title: 'Gimnasio',
      start: '18:00',
      end: '19:00',
      place: 'Gimnasio',
      calendar: 'Personal',
      people: [],
      notes: 'Día de pierna.',
      color: 'var(--green-dark)',
    },
  ];
}
