'use strict';
const periodic = require('periodicjs');
const pkgcloud = require('pkgcloud');
const settings = require('./settings');
let client = {};
let publicPath = {};

async function getPkgClient() {
  try {
    const extSettings = settings.getSettings();
    const containerName = extSettings.container.name;
    client = pkgcloud.storage.createClient(extSettings.client);
    if (client.provider === 'google') {
      publicPath = {
        // https://storage.cloud.google.com/app.jewelml.io/clouduploads/2019/03/26/5c8fc06500edfcf79e630ce3-2019-03-26_08-48-08-jewel_logo_sm.png?_ga=2.11903795.-642431485.1553568040
        // https://storage.googleapis.com/app.jewelml.io/clouduploads/integrations/5cbf1464f71cae765df8bd82/5c8fc06500edfcf79e630ce3-2019-04-29_14-29-10-sample-upload.csv
        cdnUri:  `http://storage.googleapis.com/${containerName}`,
        cdnSslUri:  `https://storage.googleapis.com/${containerName}`,
        endpoint: 'https://storage.googleapis.com',
      };
    } else {
      publicPath = {
        cdnUri: 'http://' + client.s3.config.endpoint + '/' + containerName,
        cdnSslUri: client.s3.endpoint.href + containerName,
        endpoint: client.s3.endpoint
      };
    }
    return({
      client,
      publicPath,
      clientSettings: extSettings.client,
      containerSettings: extSettings.container,
    });
  } catch (e) {
    throw (e);
  }
}

module.exports = {
  client,
  publicPath,
  getPkgClient,
};