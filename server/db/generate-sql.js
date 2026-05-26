const fs = require('fs');
const path = require('path');

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/sweden.json'), 'utf8')
);

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

const lines = [];

const { country } = data;
lines.push(
  `INSERT INTO countries (id, name, default_lat, default_lng, default_zoom) VALUES (${esc(country.id)}, ${esc(country.name)}, ${country.defaultView.lat}, ${country.defaultView.lng}, ${country.defaultView.zoom}) ON CONFLICT (id) DO NOTHING;`
);

for (const era of data.eras) {
  lines.push(
    `INSERT INTO eras (id, country_id, label, year_from, year_to) VALUES (${esc(era.id)}, ${esc(country.id)}, ${esc(era.label)}, ${era.from}, ${era.to}) ON CONFLICT (id) DO NOTHING;`
  );
}

for (const person of data.persons) {
  lines.push(
    `INSERT INTO persons (id, name, born, died, initials, description, country_id) VALUES (${esc(person.id)}, ${esc(person.name)}, ${person.born ?? 'NULL'}, ${person.died ?? 'NULL'}, ${esc(person.initials)}, ${esc(person.description)}, ${esc(country.id)}) ON CONFLICT (id) DO NOTHING;`
  );
}

for (const event of data.events) {
  lines.push(
    `INSERT INTO events (id, country_id, type, era_id, name, date, year, lat, lng, modern_location, historical_context, description, notes, wikipedia, route_description) VALUES (${esc(event.id)}, ${esc(country.id)}, ${esc(event.type)}, ${esc(event.era)}, ${esc(event.name)}, ${esc(event.date)}, ${event.year}, ${event.lat}, ${event.lng}, ${esc(event.modern_location)}, ${esc(event.historical_context)}, ${esc(event.description)}, ${esc(event.notes)}, ${esc(event.wikipedia)}, ${esc(event.route_description)}) ON CONFLICT (id) DO NOTHING;`
  );

  if (event.person_ids) {
    for (const personId of event.person_ids) {
      const role = event.person_roles?.[personId] ?? null;
      lines.push(
        `INSERT INTO event_persons (event_id, person_id, role) VALUES (${esc(event.id)}, ${esc(personId)}, ${esc(role)}) ON CONFLICT (event_id, person_id) DO NOTHING;`
      );
    }
  }

  if (event.route) {
    for (let i = 0; i < event.route.length; i++) {
      const wp = event.route[i];
      lines.push(
        `INSERT INTO event_waypoints (event_id, sort_order, lat, lng, label) VALUES (${esc(event.id)}, ${i}, ${wp.lat}, ${wp.lng}, ${esc(wp.label)});`
      );
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'seed.sql'), lines.join('\n') + '\n');
console.log(`Generated seed.sql with ${lines.length} statements`);
