import './Timeline.css';

const TYPE_COLORS = {
  battle: 'var(--color-battle)',
  event: 'var(--color-event)',
  person: 'var(--color-person)',
};

export default function Timeline({ events, activeEventId, onEventSelect }) {
  if (events.length === 0) return null;

  const sorted = [...events].sort((a, b) => a.year - b.year);
  const minYear = sorted[0].year;
  const maxYear = sorted[sorted.length - 1].year;
  const range = maxYear - minYear || 1;

  return (
    <div className="timeline">
      <div className="timeline-track">
        <div className="timeline-line" />
        {sorted.map(event => {
          const pct = ((event.year - minYear) / range) * 100;
          return (
            <button
              key={event.id}
              className={`timeline-marker ${activeEventId === event.id ? 'active' : ''}`}
              style={{
                left: `${pct}%`,
                '--marker-color': TYPE_COLORS[event.type] || 'var(--gold)',
              }}
              onClick={() => onEventSelect(event.id)}
              title={`${event.name} (${event.year})`}
            >
              <span className="timeline-dot" />
              <span className="timeline-year">{event.year}</span>
            </button>
          );
        })}
      </div>
      <div className="timeline-bounds">
        <span>{minYear}</span>
        <span>{maxYear}</span>
      </div>
    </div>
  );
}
