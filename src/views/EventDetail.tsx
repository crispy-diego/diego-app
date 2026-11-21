import type { AgendaEvent } from '../lib/agenda';
import { useApp } from '../App';
import { Icon } from '../components/ui';

export default function EventDetail({ event, onClose }: { event: AgendaEvent; onClose: () => void }) {
  const { open } = useApp();

  return (
    <div className="sheet">
      <header className="sheet-head">
        <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>
          <Icon name="x" />
        </button>
        <strong>Evento</strong>
        <span className="icon-btn" />
      </header>

      <div className="sheet-body">
        <div className="event-title">
          <i style={{ background: event.color }} />
          <h1>{event.title}</h1>
        </div>

        <dl className="card event-facts">
          <div>
            <dt>Hora</dt>
            <dd>
              {event.start} a {event.end}
            </dd>
          </div>
          {event.place && (
            <div>
              <dt>Lugar</dt>
              <dd>{event.place}</dd>
            </div>
          )}
          {event.people.length > 0 && (
            <div>
              <dt>Con</dt>
              <dd>{event.people.join(', ')}</dd>
            </div>
          )}
          <div>
            <dt>Calendario</dt>
            <dd>{event.calendar}</dd>
          </div>
          {event.notes && (
            <div>
              <dt>Notas</dt>
              <dd>{event.notes}</dd>
            </div>
          )}
        </dl>

        <button className="btn primary block" onClick={() => open({ type: 'capture', initialText: `${event.title}: ` })}>
          Escribir sobre este evento
        </button>
      </div>
    </div>
  );
}
