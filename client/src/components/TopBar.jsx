import './TopBar.css';

const ERA_LABELS = {
  frigoerelsen: 'Frigörelsen',
  expansion: 'Expansion',
  stormakt: 'Stormaktstid',
  fall: 'Stormaktens fall',
  frihetstid: 'Frihetstid',
  gustaviansk: 'Gustaviansk tid',
  slutet: 'Slutet',
};

export default function TopBar({ activeModule, onModuleChange, activeEra, onEraChange, eras }) {
  return (
    <header className="topbar">
      <div className="topbar-logo">
        <span className="logo-text">HISTORIA · BELLUM</span>
      </div>

      <nav className="topbar-eras">
        <button
          className={`era-pill ${activeEra === 'all' ? 'active' : ''}`}
          onClick={() => onEraChange('all')}
        >
          Alla eror
        </button>
        {eras.map(era => (
          <button
            key={era.id}
            className={`era-pill ${activeEra === era.id ? 'active' : ''}`}
            onClick={() => onEraChange(era.id)}
          >
            {ERA_LABELS[era.id] || era.label || era.id}
          </button>
        ))}
      </nav>

      <div className="topbar-modules">
        <button
          className={`module-btn ${activeModule === 'se' ? 'active' : ''}`}
          onClick={() => onModuleChange('se')}
        >
          Sverige
        </button>
        <button className="module-btn module-add">+ Modul</button>
      </div>
    </header>
  );
}
