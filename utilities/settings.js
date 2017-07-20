'use strict';
const periodic = require('periodicjs');

function getSettings() {
  return periodic.settings.extensions['periodicjs.ext.packagecloud'];
}

module.exports = {
  getSettings,
};