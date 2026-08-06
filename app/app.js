const path = require('path');
const express = require('express');
const { adminRouter } = require('./routes/admin');
const { playerRouter } = require('./routes/player');
const { submissionsRouter } = require('./routes/submissions');

function createApp(db) {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/', (_req, res) => res.redirect('/admin/campaigns'));
  app.use('/admin', adminRouter(db));
  app.use(playerRouter(db));
  app.use(submissionsRouter(db));

  return app;
}

module.exports = { createApp };
