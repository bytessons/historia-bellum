require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/countries', require('./routes/countries'));
app.use('/api/events', require('./routes/events'));
app.use('/api/persons', require('./routes/persons'));
app.use('/api/conflicts', require('./routes/conflicts'));

app.listen(PORT, () => {
  console.log(`Historia Bellum API running on port ${PORT}`);
});
