'use strict';

const periodic = require('periodicjs');
const extensionRouter = periodic.express.Router();

extensionRouter.all('/packagecloud', (req, res) => {
  res.send('PACKAGE CLOUD EXTENSION');
});

module.exports = extensionRouter;