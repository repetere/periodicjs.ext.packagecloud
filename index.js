'use strict';
const periodic = require('periodicjs');
const utilities = require('./utilities');
const extSettings = utilities.getSettings();

module.exports = () => {
  return new Promise((resolve, reject) => {
    try {
      utilities.pkgcloudUtils.getPkgClient()
        .then(pkgCloudClient => {
          periodic.core.files.uploadMiddlewareHandler = utilities.files.pkgCloudUploadMiddlewareHandler.bind({ pkgcloud_client: pkgCloudClient });
          periodic.core.files.uploadMiddleware = utilities.files.pkgCloudUploadMiddleware;
          periodic.core.files.formFileHandler = utilities.files.pkgCloudFormFileHandler;
          console.log({ pkgCloudClient }, periodic.core.files);
          resolve(pkgCloudClient)
        })
        .catch(reject);
      // console.log({ extSettings })
      // resolve(true);
    } catch (e) {
      reject(e);
    }
  }); //Promise.resolve(true);
}