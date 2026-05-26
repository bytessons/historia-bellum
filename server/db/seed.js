const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:localdev@localhost:5432/historia_bellum',
});

async function seed() {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../data/sweden.json'), 'utf8')
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Country
    const { country } = data;
    await client.query(
      `INSERT INTO countries (id, name, default_lat, default_lng, default_zoom)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [country.id, country.name, country.defaultView.lat, country.defaultView.lng, country.defaultView.zoom]
    );
    console.log(`Inserted country: ${country.name}`);

    // Eras
    for (const era of data.eras) {
      await client.query(
        `INSERT INTO eras (id, country_id, label, year_from, year_to)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [era.id, country.id, era.label, era.from, era.to]
      );
    }
    console.log(`Inserted ${data.eras.length} eras`);

    // Persons
    for (const person of data.persons) {
      await client.query(
        `INSERT INTO persons (id, name, born, died, initials, description, country_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [person.id, person.name, person.born || null, person.died || null, person.initials || null, person.description || null, country.id]
      );
    }
    console.log(`Inserted ${data.persons.length} persons`);

    // Events
    for (const event of data.events) {
      await client.query(
        `INSERT INTO events (id, country_id, type, era_id, name, date, year, lat, lng, modern_location, historical_context, description, notes, wikipedia, route_description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO NOTHING`,
        [
          event.id,
          country.id,
          event.type,
          event.era,
          event.name,
          event.date || null,
          event.year,
          event.lat,
          event.lng,
          event.modern_location || null,
          event.historical_context || null,
          event.description || null,
          event.notes || null,
          event.wikipedia || null,
          event.route_description || null,
        ]
      );

      // Event-person relations
      if (event.person_ids && event.person_ids.length > 0) {
        for (const personId of event.person_ids) {
          const role = event.person_roles?.[personId] || null;
          await client.query(
            `INSERT INTO event_persons (event_id, person_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (event_id, person_id) DO NOTHING`,
            [event.id, personId, role]
          );
        }
      }

      // Waypoints
      if (event.route && event.route.length > 0) {
        for (let i = 0; i < event.route.length; i++) {
          const wp = event.route[i];
          await client.query(
            `INSERT INTO event_waypoints (event_id, sort_order, lat, lng, label)
             VALUES ($1, $2, $3, $4, $5)`,
            [event.id, i, wp.lat, wp.lng, wp.label || null]
          );
        }
      }
    }
    console.log(`Inserted ${data.events.length} events`);

    await client.query('COMMIT');
    console.log('Seed completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
