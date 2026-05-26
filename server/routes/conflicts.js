const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/:id', async (req, res) => {
  try {
    const conflictResult = await pool.query(
      'SELECT * FROM conflicts WHERE id = $1',
      [req.params.id]
    );

    if (conflictResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const conflict = conflictResult.rows[0];

    const [eventsResult, partiesResult] = await Promise.all([
      pool.query(
        'SELECT id, name, year, type, lat, lng FROM events WHERE conflict_id = $1 ORDER BY year',
        [req.params.id]
      ),
      pool.query(
        `SELECT cp.role, c.id, c.name
         FROM conflict_parties cp
         JOIN countries c ON c.id = cp.country_id
         WHERE cp.conflict_id = $1`,
        [req.params.id]
      ),
    ]);

    conflict.events = eventsResult.rows;
    conflict.parties = partiesResult.rows;
    res.json(conflict);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
