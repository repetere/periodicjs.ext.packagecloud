'use strict';
const periodic = require('periodicjs');
const pkgcloud = require('pkgcloud');
const settings = require('./settings');
let client = {};
let publicPath = {};

function getPkgClient() {
  return new Promise((resolve, reject) => {
    try {
      const extSettings = settings.getSettings();
      const containerName = extSettings.container.name;
      client = pkgcloud.storage.createClient(extSettings.client);
      publicPath = {
        cdnUri: 'http://' + client.s3.config.endpoint + '/' + containerName,
        cdnSslUri: client.s3.endpoint.href + containerName,
        endpoint: client.s3.endpoint
      };
      resolve({
        client,
        publicPath,
        clientSettings: extSettings.client,
        containerSettings: extSettings.container,
      });
    } catch (e) {
      reject(e);
    }
  });
}

// function




// client.getContainers(function (err, containers) {
//   if (err) {
//     console.error(err);
//   }

//   containers.forEach(function (container) {
//     console.log(container.toJSON());
//   });
// });

module.exports = {
  client,
  publicPath,
  getPkgClient,
};

/**
 * var createStorageContainer = function() {
  fs.readJson(cloudproviderfilepath, function(err, data) {
    if (err) {
      cloudStorageClientError = err;
      logger.error('createStorageContainer readJson cloudproviderfilepath', cloudproviderfilepath);
      logger.error(err);
    } else {
      try {
        cloudprovider = data[appSettings.application.environment];
        cloudstorageclient = pkgcloud.storage.createClient(cloudprovider);
        var storageContainerOptions = {
          name: (cloudprovider.containername) ? cloudprovider.containername : 'periodicjs',
          type: 'public',
          metadata: {
            env: appSettings.application.environment,
            name: appSettings.name
          }
        };
        if (cloudprovider.provider === 'amazon') {

          cloudStorageContainer = cloudprovider.containername || cloudprovider.Bucket || cloudprovider.bucket;
          cloudStoragePublicPath = {
            cdnUri: 'http://' + cloudstorageclient.s3.config.endpoint + '/' + cloudStorageContainer,
            cdnSslUri: cloudstorageclient.s3.endpoint.href + cloudStorageContainer,
            endpoint: cloudstorageclient.s3.endpoint
          };
        } else if (cloudprovider.provider === 'rackspace') {
          cloudstorageclient.createContainer(
            storageContainerOptions,
            function(err, container) {
              if (err) {
                console.log('failed on storage client', err);
                console.log(err.stack);
                cloudStorageClientError = err;
                throw Error(err);
              } else {
                console.log('created container');
                cloudStorageContainer = container;
                if (cloudprovider.provider === 'rackspace') {
                  cloudstorageclient.setCdnEnabled(cloudStorageContainer, true, function(error, cont) {
                    if (error) {
                      cloudStorageClientError = error;
                      throw Error(error);
                    } else if (cont) {
                      cloudStoragePublicPath = {
                        cdnUri: cont.cdnUri,
                        cdnSslUri: cont.cdnSslUri,
                        cdnStreamingUri: cont.cdnStreamingUri,
                        cdniOSUri: cont.cdniOSUri
                      };
                      // console.log('cont', cont);
                      // console.log('cloudStoragePublicPath', cloudStoragePublicPath);
                      logger.silly('Successfully Created CDN Bucket');
                    }
                  });
                }
              }
            });
        }
        // console.log('cloudstorageclient',cloudstorageclient);
        // console.log('cloudprovider',cloudprovider);
        // console.log('storageContainerOptions',storageContainerOptions);
        cloudprovider.containername = cloudprovider.containername || cloudprovider.Bucket || cloudprovider.bucket || 'periodicjs';
      } catch (e) {
        logger.error('cloudstorageclient.createContainer cloudStorageClientError');
        cloudStorageClientError = e;
        console.log(e);
        logger.error(e);
      }
    }
  });
};
*/