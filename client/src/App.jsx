import { useState, useEffect } from 'react';
import TopBar from './components/TopBar.jsx';
import FilterRow from './components/FilterRow.jsx';
import MapView from './components/MapView.jsx';
import Sidebar from './components/Sidebar.jsx';
import Timeline from './components/Timeline.jsx';
import { getEvents, getEvent, getPersons, getPerson, getEras } from './staticData.js';
import './App.css';

export default function App() {
  const [events, setEvents] = useState([]);
  const [eras, setEras] = useState([]);
  const [activeModule, setActiveModule] = useState('se');
  const [activeEra, setActiveEra] = useState('all');
  const [activeFilters, setActiveFilters] = useState({ battle: true, event: true, person: true });
  const [activeEventId, setActiveEventId] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeStack, setActiveStack] = useState(null);
  const [persons, setPersons] = useState([]);
  const [activePersonId, setActivePersonId] = useState(null);
  const [activePerson, setActivePerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEras();
  }, [activeModule]);

  useEffect(() => {
    fetchEvents();
    fetchPersons();
  }, [activeModule, activeEra, activeFilters]);

  useEffect(() => {
    if (activeEventId) fetchEvent(activeEventId);
    else setActiveEvent(null);
  }, [activeEventId]);

  useEffect(() => {
    if (activePersonId) fetchPerson(activePersonId);
    else setActivePerson(null);
  }, [activePersonId]);

  function fetchEras() {
    setEras(getEras(activeModule));
  }

  function fetchEvents() {
    setLoading(true);
    const activeTypes = Object.entries(activeFilters)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (activeTypes.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const data = getEvents({
      country: activeModule,
      era: activeEra !== 'all' ? activeEra : null,
    });
    const filtered = data.filter(e => activeFilters[e.type]);
    setEvents(filtered);
    setLoading(false);
  }

  function fetchPersons() {
    const data = getPersons({
      country: activeModule,
      era: activeEra !== 'all' ? activeEra : null,
    });
    setPersons(data);
  }

  function fetchPerson(id) {
    const data = getPerson(id, activeModule);
    setActivePerson(data);
  }

  function fetchEvent(id) {
    const data = getEvent(id, activeModule);
    setActiveEvent(data);
  }

  function handleEventSelect(id) {
    setActiveStack(null);
    setActivePersonId(null);
    setActiveEventId(id);
  }

  function handleStackSelect(stackEvents) {
    setActiveEventId(null);
    setActiveEvent(null);
    setActivePersonId(null);
    setActiveStack(stackEvents);
  }

  function handlePersonSelect(id) {
    setActiveEventId(null);
    setActiveEvent(null);
    setActiveStack(null);
    setActivePersonId(id);
  }

  function handleClose() {
    setActiveEventId(null);
    setActiveStack(null);
    setActivePersonId(null);
  }

  function toggleFilter(type) {
    setActiveFilters(f => ({ ...f, [type]: !f[type] }));
  }

  return (
    <div className="app">
      <TopBar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        activeEra={activeEra}
        onEraChange={setActiveEra}
        eras={eras}
      />
      <FilterRow activeFilters={activeFilters} onToggle={toggleFilter} />
      <div className="main-layout">
        <MapView
          events={events}
          activeEventId={activeEventId}
          onEventSelect={handleEventSelect}
          onStackSelect={handleStackSelect}
          activeEvent={activeEvent}
          activeStack={activeStack}
          persons={persons}
          activePersonId={activePersonId}
          onPersonSelect={handlePersonSelect}
        />
        <Sidebar
          event={activeEvent}
          stack={activeStack}
          person={activePerson}
          onEventSelect={handleEventSelect}
          onPersonSelect={handlePersonSelect}
          onClose={handleClose}
        />
      </div>
      <Timeline
        events={events}
        activeEventId={activeEventId}
        onEventSelect={handleEventSelect}
      />
    </div>
  );
}
