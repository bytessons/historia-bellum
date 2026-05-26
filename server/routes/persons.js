const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  const { country, era } = req.query;
  try {
    let query, values;
    if (era) {
      query = `
        SELECT DISTINCT p.*
        FROM persons p
        JOIN event_persons ep ON ep.person_id = p.id
        JOIN events e ON e.id = ep.event_id
        WHERE p.country_id = $1
          AND e.era_id = $2
          AND p.lat IS NOT NULL
        ORDER BY p.name
      `;
      values = [country, era];
    } else {
      query = `
        SELECT * FROM persons
        WHERE country_id = $1 AND lat IS NOT NULL
        ORDER BY name
      `;
      values = [country];
    }
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const personResult = await pool.query(
      'SELECT * FROM persons WHERE id = $1',
      [req.params.id]
    );

    if (personResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const person = personResult.rows[0];

    const eventsResult = await pool.query(
      `SELECT e.id, e.name, e.year, e.type, e.era_id, ep.role
       FROM events e
       JOIN event_persons ep ON ep.event_id = e.id
       WHERE ep.person_id = $1
       ORDER BY e.year`,
      [req.params.id]
    );

    person.events = eventsResult.rows;
    res.json(person);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
