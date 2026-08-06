require('dotenv').config();
const { createDb } = require('./db');
const { createApp } = require('./app');

const db = createDb();
const app = createApp(db);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`skellyforum listening on http://localhost:${port}`);
});
