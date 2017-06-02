'use strict';

const periodic = require('periodicjs');
const extensionRouter = periodic.app.Router();

extensionRouter.all('/passport', (req, res) => {
  res.send('PASSPORT EXTENSION');
});

module.exports = extensionRouter;