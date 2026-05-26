import './Sidebar.css';

const TYPE_LABELS = { battle: 'Slag', event: 'Händelse', person: 'Nyckelperson' };
const TYPE_COLORS = { battle: 'var(--color-battle)', event: 'var(--color-event)', person: 'var(--color-person)' };

function StackView({ stack, onEventSelect, onPersonSelect, onClose }) {
  const location = stack.find(i => i.modern_location)?.modern_location || 'Okänd plats';
  const sorted = [...stack].sort((a, b) => {
    const aYear = a._kind === 'person' ? a.born : a.year;
    const bYear = b._kind === 'person' ? b.born : b.year;
    return (aYear || 0) - (bYear || 0);
  });

  return (
    <aside className="sidebar sidebar--active">
      <div className="sidebar-header">
        <span className="sidebar-stack-label">{stack.length} i {location}</span>
        <button className="sidebar-close" onClick={onClose} aria-label="Stäng">✕</button>
      </div>
      <h2 className="sidebar-title">{location}</h2>
      <ul className="stack-list">
        {sorted.map(item => {
          const isPerson = item._kind === 'person';
          const color = isPerson ? TYPE_COLORS.person : (TYPE_COLORS[item.type] || '#c9a84c');
          const label = isPerson ? TYPE_LABELS.person : (TYPE_LABELS[item.type] || item.type);
          const meta = isPerson ? `${item.born || '?'}–${item.died || '?'}` : item.year;
          return (
            <li
              key={item.id}
              className="stack-item"
              onClick={() => isPerson ? onPersonSelect(item.id) : onEventSelect(item.id)}
            >
              <span className="stack-item-dot" style={{ background: color }} />
              <div className="stack-item-info">
                <span className="stack-item-name">{item.name}</span>
                <span className="stack-item-meta">
                  {meta}
                  <span style={{ color }}> · {label}</span>
                </span>
              </div>
              <span className="stack-item-arrow">→</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

const EVENT_TYPE_LABELS = { battle: 'Slag', event: 'Händelse', person: 'Nyckelperson' };

function PersonView({ person, onEventSelect, onClose }) {
  return (
    <aside className="sidebar sidebar--active">
      <div className="sidebar-header">
        <div className="sidebar-meta">
          <span className="sidebar-type" style={{ color: 'var(--color-person)' }}>Nyckelperson</span>
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Stäng">✕</button>
      </div>

      <h2 className="sidebar-title">{person.name}</h2>

      <div className="sidebar-location">
        {(person.born || person.died) && (
          <span className="sidebar-date">{person.born || '?'}–{person.died || '?'}</span>
        )}
      </div>

      {person.description && (
        <p className="sidebar-description">{person.description}</p>
      )}

      {person.events && person.events.length > 0 && (
        <div className="sidebar-persons">
          <h4 className="sidebar-section-title">Händelser</h4>
          <ul className="stack-list" style={{ margin: 0 }}>
            {person.events.map(event => (
              <li key={event.id} className="stack-item" onClick={() => onEventSelect(event.id)}>
                <span
                  className="stack-item-dot"
                  style={{ background: TYPE_COLORS[event.type] }}
                />
                <div className="stack-item-info">
                  <span className="stack-item-name">{event.name}</span>
                  <span className="stack-item-meta">
                    {event.year}
                    {event.type && <span style={{ color: TYPE_COLORS[event.type] }}> · {EVENT_TYPE_LABELS[event.type]}</span>}
                    {event.role && <span> · {event.role}</span>}
                  </span>
                </div>
                <span className="stack-item-arrow">→</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {person.wikipedia && (
        <a href={person.wikipedia} target="_blank" rel="noopener noreferrer" className="sidebar-wiki">
          Wikipedia →
        </a>
      )}
    </aside>
  );
}

export default function Sidebar({ event, stack, person, onEventSelect, onPersonSelect, onClose }) {
  if (person && !event) {
    return <PersonView person={person} onEventSelect={onEventSelect} onClose={onClose} />;
  }

  if (stack && !event) {
    return <StackView stack={stack} onEventSelect={onEventSelect} onPersonSelect={onPersonSelect} onClose={onClose} />;
  }

  if (!event) {
    return (
      <aside className="sidebar sidebar--empty">
        <div className="empty-state">
          <p className="empty-state-text">Klicka på ett märke på kartan för att läsa om händelsen.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar sidebar--active">
      <div className="sidebar-header">
        <div className="sidebar-meta">
          <span
            className="sidebar-type"
            style={{ color: TYPE_COLORS[event.type] }}
          >
            {TYPE_LABELS[event.type] || event.type}
          </span>
          {event.era_id && <span className="sidebar-era">{event.era_id}</span>}
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Stäng">✕</button>
      </div>

      <h2 className="sidebar-title">{event.name}</h2>

      <div className="sidebar-location">
        {event.date && <span className="sidebar-date">{event.date}</span>}
        {event.modern_location && (
          <span className="sidebar-place">{event.modern_location}</span>
        )}
        {event.historical_context && (
          <span className="sidebar-context">{event.historical_context}</span>
        )}
      </div>

      {event.description && (
        <p className="sidebar-description">{event.description}</p>
      )}

      {event.route_description && (
        <div className="sidebar-route">
          <span className="sidebar-route-icon">→</span>
          <span>{event.route_description}</span>
        </div>
      )}

      {event.notes && (
        <div className="sidebar-notes">
          <h4 className="sidebar-notes-title">Djupare kontext</h4>
          <p>{event.notes}</p>
        </div>
      )}

      {event.persons && event.persons.length > 0 && (
        <div className="sidebar-persons">
          <h4 className="sidebar-section-title">Inblandade</h4>
          <ul className="persons-list">
            {event.persons.map(person => (
              <li key={person.id} className="person-item">
                <span className="person-initials">{person.initials || '?'}</span>
                <div className="person-info">
                  <span className="person-name">{person.name}</span>
                  {person.role && <span className="person-role">{person.role}</span>}
                  {(person.born || person.died) && (
                    <span className="person-years">
                      {person.born || '?'}–{person.died || '?'}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {event.wikipedia && (
        <a
          href={event.wikipedia}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-wiki"
        >
          Wikipedia →
        </a>
      )}
    </aside>
  );
}
