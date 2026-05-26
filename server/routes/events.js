const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  const { country, era, type } = req.query;
  const conditions = [];
  const values = [];

  if (country) {
    values.push(country);
    conditions.push(`e.country_id = $${values.length}`);
  }
  if (era) {
    values.push(era);
    conditions.push(`e.era_id = $${values.length}`);
  }
  if (type) {
    values.push(type);
    conditions.push(`e.type = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT e.*,
              COALESCE(json_agg(json_build_object('lat', w.lat, 'lng', w.lng, 'label', w.label)) FILTER (WHERE w.id IS NOT NULL), '[]') AS waypoints
       FROM events e
       LEFT JOIN event_waypoints w ON w.event_id = e.id
       ${where}
       GROUP BY e.id
       ORDER BY e.year`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const eventResult = await pool.query(
      `SELECT e.*,
              COALESCE(json_agg(json_build_object('lat', w.lat, 'lng', w.lng, 'label', w.label) ORDER BY w.sort_order) FILTER (WHERE w.id IS NOT NULL), '[]') AS waypoints
       FROM events e
       LEFT JOIN event_waypoints w ON w.event_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [req.params.id]
    );

    if (eventResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const event = eventResult.rows[0];

    const personsResult = await pool.query(
      `SELECT p.*, ep.role
       FROM persons p
       JOIN event_persons ep ON ep.person_id = p.id
       WHERE ep.event_id = $1`,
      [req.params.id]
    );

    event.persons = personsResult.rows;
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
