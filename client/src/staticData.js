import swedenData from '../../data/sweden.json';

const modules = { se: swedenData };

function getModule(countryId) {
  return modules[countryId] || swedenData;
}

export function getEvents({ country = 'se', era = null, types = null } = {}) {
  const mod = getModule(country);
  let events = mod.events.map(e => ({
    ...e,
    era_id: e.era,
    country_id: country,
  }));

  if (era) events = events.filter(e => e.era_id === era);
  if (types && types.length > 0) events = events.filter(e => types.includes(e.type));

  return events;
}

export function getEvent(id, country = 'se') {
  const mod = getModule(country);
  const event = mod.events.find(e => e.id === id);
  if (!event) return null;

  const persons = (event.person_ids || []).map(pid => {
    const p = mod.persons.find(p => p.id === pid);
    if (!p) return null;
    return {
      ...p,
      role: (event.person_roles || {})[pid] || null,
    };
  }).filter(Boolean);

  return {
    ...event,
    era_id: event.era,
    country_id: country,
    persons,
  };
}

export function getPersons({ country = 'se', era = null } = {}) {
  const mod = getModule(country);
  let persons = mod.persons.map(p => ({ ...p, country_id: country }));

  if (era) {
    const eraEventPersonIds = new Set(
      mod.events
        .filter(e => e.era === era)
        .flatMap(e => e.person_ids || [])
    );
    persons = persons.filter(p => eraEventPersonIds.has(p.id));
  }

  return persons;
}

export function getPerson(id, country = 'se') {
  const mod = getModule(country);
  const person = mod.persons.find(p => p.id === id);
  if (!person) return null;

  const events = mod.events
    .filter(e => (e.person_ids || []).includes(id))
    .map(e => ({
      ...e,
      era_id: e.era,
      country_id: country,
      role: (e.person_roles || {})[id] || null,
    }));

  return { ...person, country_id: country, events };
}

export function getEras(country = 'se') {
  const mod = getModule(country);
  return mod.eras.map(era => ({ ...era, country_id: country }));
}

export function getCountry(id) {
  const mod = getModule(id);
  return {
    id,
    name: mod.country.name,
    default_lat: mod.country.defaultView.lat,
    default_lng: mod.country.defaultView.lng,
    default_zoom: mod.country.defaultView.zoom,
  };
}
