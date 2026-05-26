import './FilterRow.css';

const FILTERS = [
  { key: 'battle', label: 'Slag' },
  { key: 'event', label: 'Händelser' },
  { key: 'person', label: 'Nyckelpersoner' },
];

export default function FilterRow({ activeFilters, onToggle }) {
  return (
    <div className="filter-row">
      <span className="filter-label">Visa:</span>
      {FILTERS.map(f => (
        <button
          key={f.key}
          className={`filter-btn filter-btn--${f.key} ${activeFilters[f.key] ? 'active' : ''}`}
          onClick={() => onToggle(f.key)}
        >
          <span className="filter-dot" />
          {f.label}
        </button>
      ))}
    </div>
  );
}
