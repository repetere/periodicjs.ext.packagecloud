'use strict';
const periodic = require('periodicjs');
const utilities = require('./utilities');
const extSettings = utilities.getSettings();

module.exports = () => {
  return new Promise((resolve, reject) => {
    try {
      if (extSettings.initialize.wait_for_client === false) {
        resolve(true);
      }
      utilities.pkgcloudUtils.getPkgClient()
        .then(pkgCloudClient => {
          periodic.core.files.uploadMiddlewareHandler = utilities.files.pkgCloudUploadMiddlewareHandler.bind({ pkgcloud_client: pkgCloudClient });
          periodic.core.files.uploadMiddleware = utilities.files.pkgCloudUploadMiddleware;
          periodic.core.files.formFileHandler = utilities.files.pkgCloudFormFileHandler;
          periodic.core.files.removeMiddlewareHandler = utilities.files.pkgCloudRemoveMiddlewareHandler.bind({ pkgcloud_client: pkgCloudClient });
          periodic.core.files.uploadDirectory = utilities.files.pkgCloudUploadDirectory;
          // console.log({ pkgCloudClient }, periodic.core.files);
          if (extSettings.initialize.wait_for_client === true) {
            resolve(pkgCloudClient)
          }
        })
        .catch(reject);
      // console.log({ extSettings })
      // resolve(true);
    } catch (e) {
      reject(e);
    }
  }); //Promise.resolve(true);
}