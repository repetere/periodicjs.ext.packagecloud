'use strict';
const periodic = require('periodicjs');
const pkgcloud = require('pkgcloud');
const Busboy = require('busboy');
const crypto = require('crypto');
const moment = require('moment');
const path = require('path');
const settings = require('./settings');
let client = {};
let publicPath = {};

function pkgCloudUploadDirectory(options) {
  const { req, periodic, upload_dir, include_timestamp_in_dir, } = options;
  // console.log({ upload_dir });
  const current_date = moment().format('YYYY/MM/DD');
  const upload_path_dir = (req.localuploadpath) ?
    req.localuploadpath :
    path.join(upload_dir, (include_timestamp_in_dir) ? current_date : '');
  return {
    current_date,
    upload_dir,
    upload_path_dir,
    periodicDir: path.join(upload_dir, (include_timestamp_in_dir) ? current_date : ''),
  };
}


/**
 * handles file data from a multi-part form
 * 
 * @param {any} fieldname 
 * @param {any} file 
 * @param {any} filename 
 * @param {any} encoding 
 * @param {any} mimetype 
 */
function pkgCloudFormFileHandler(fieldname, file, filename, encoding, mimetype) {
  const fieldHandler = periodic.core.files.formFieldHandler.bind(this);
  const pkgCloudClient = this.pkgcloud_client;
  const upload_dir = this.upload_directory || 'clouduploads';
  const name = periodic.core.files.renameFile.call(this, {
    filename,
    req: this.req,
  });
  const uploadDir = pkgCloudUploadDirectory({
    req: this.req,
    periodic: this.periodic,
    upload_dir,
    include_timestamp_in_dir: (typeof this.include_timestamp_in_dir === 'boolean') ? this.include_timestamp_in_dir : true,
  });
  const pkgCloudUploadFileName = path.join(this.upload_path_dir || uploadDir.upload_path_dir, name);
  const pkgCloudRemoteBaseURL = (this.prefer_http) ? pkgCloudClient.publicPath.cdnUri : pkgCloudClient.publicPath.cdnSslUri + '/';
  const filelocation = pkgCloudRemoteBaseURL + pkgCloudUploadFileName;
  const fileurl = filelocation;
  const processedFile = {
    fieldname,
    encoding,
    mimetype,
    locationtype: pkgCloudClient.clientSettings.provider,
    original_filename: filename,
    filename: name,
    name,
    fileurl,
    location: filelocation,
    uploaddirectory: uploadDir.periodicDir,
    encrypted_client_side: this.encrypted_client_side,
    client_encryption_algo: this.client_encryption_algo,
    attributes: Object.assign({}, pkgCloudClient.publicPath, {
      cloudfilepath: pkgCloudUploadFileName,
      cloudcontainername: pkgCloudClient.containerSettings.name,
      location: filelocation,
    }),
  };
  // let response = (this.use_buffers) ? [] : '';
  let filesize = 0;
  if (this.save_to_disk) {
    const uploadStream = pkgCloudClient.client.upload({
      container: pkgCloudClient.containerSettings.name,
      remote: pkgCloudUploadFileName, //name,
      cacheControl: this.cacheControl || 'public, max-age=86400',
      contentType: mimetype,
      ServerSideEncryption: (this.encrypted_client_side) ? 'AES256' : undefined,
      acl: this.acl || 'public-read',
      headers: {
        // optionally provide raw headers to send to cloud files
        'cache-control': this.cacheControl || 'public, max-age=86400',
        'Cache-Control': this.cacheControl || 'public, max-age=86400',
        'Content-Type': mimetype,
        'x-amz-meta-Cache-Control': this.cacheControl || 'public, max-age=86400',
      },
    });
    uploadStream.on('error', (e) => {
      throw e;
    });

    uploadStream.on('success', (cloudfile) => {
      this.cloudfiles.push(cloudfile);
      if (this.cloudfiles.length === this.files.length && this.completedFormProcessing === false && this.wait_for_cloud_uploads === true) {
        // console.log('UPLOADS HAVE FINISHED');
        this.completeHandler();
        this.completedFormProcessing = true;
      }
    });

    if (this.encrypted_client_side) {
      const cipher = crypto.createCipher(this.client_encryption_algo, this.encryption_key);
      file
        .pipe(cipher)
        .pipe(uploadStream);
    } else {
      file.pipe(uploadStream);
    }
  }
  file.on('data', (chunk) => {
    if (this.use_buffers) {
      // response.push(chunk);
      filesize = filesize + Buffer.byteLength(chunk);
    } else {
      // response += chunk;
      filesize = filesize + chunk.length;
    }
    processedFile.size = filesize;
  });
  file.on('end', () => {
    this.files.push(processedFile);
    if (this.cloudfiles.length === this.files.length && this.completedFormProcessing === false && this.wait_for_cloud_uploads === true) {
      // console.log('UPLOADS HAVE FINISHED');
      this.completeHandler();
      this.completedFormProcessing = true;
    }
  });
  file.on('error', (e) => {
    throw e;
  });


  fieldHandler(fieldname, filename);
}

/**
 * middleware function for handling multi-part form data
 * 
 * @param {object} req express request object
 * @param {object} res express response object
 * @param {function} next express next handler
 */
function pkgCloudUploadMiddleware(req, res, next) {
  if (req.headers[ 'content-type' ].toLowerCase().indexOf('multipart/form-data') === -1) {
    next();
  } else {
    const busboy = new Busboy({ headers: req.headers, });
    const middlewareInstance = Object.assign({}, {
      body: {},
      files: [],
      cloudfiles: [],
      completedFormProcessing: false,
      wait_for_cloud_uploads: (typeof req.wait_for_cloud_uploads === 'boolean') ? req.wait_for_cloud_uploads : this.wait_for_cloud_uploads,
      req,
      res,
    }, this);
    const completeHandler = periodic.core.files.completeFormHandler.bind(middlewareInstance, { req, res, next, });
    middlewareInstance.completeHandler = completeHandler;
    const fileHandler = pkgCloudFormFileHandler.bind(middlewareInstance);
    const fieldHandler = periodic.core.files.formFieldHandler.bind(middlewareInstance);
    busboy.on('file', fileHandler);
    busboy.on('field', fieldHandler);
    busboy.on('finish', () => {
      if (this.wait_for_cloud_uploads === false) {
        // console.log('COMPLETING BEFORE UPLOADS')
        completeHandler();
      }
    });
    req.pipe(busboy);
  }
}

/**
 * return a middleware fuction for handling file uploads with busboy
 * 
 * @param {boolean} options.save_to_disk should the files be saved to disk 
 * @param {boolean} options.save_to_req_files append file data to req object on req.files 
 * @param {boolean} options.save_file_to_asset create an asset document in the database after the files have been processes
 * @param {boolean} options.use_buffers use buffers to process files
 * @param {string} options.asset_core_data core data collection name
 * @param {object} options.periodic periodic instance to use to save data
 * @param {boolean} options.send_response file middleware should call next or send http response
 * @param {function} options.complete_form_post_hook post asset creation hook that are passed {req,res,periodic,assets}
 * @returns 
 */
function pkgCloudUploadMiddlewareHandler(options = {}) {
  //needs to be bound with this.pkgcloud_client
  return pkgCloudUploadMiddleware.bind(Object.assign({
    pkgcloud_client: this.pkgcloud_client,
    wait_for_cloud_uploads: true,
  }, periodic.core.files.uploadMiddlewareHandlerDefaultOptions, options));
}

function removeCloudFilePromise(options) {
  const { asset, } = options;
  if (asset.locationtype !== 'local') {
    return new Promise((resolve, reject) => {
      const containerName = (asset.attributes)
        ? asset.attributes.cloudcontainername
        : asset.attributes.cloudcontainername;
      const containerFilepath = (asset.attributes)
        ? asset.attributes.cloudfilepath
        : asset.attributes.cloudfilepath;
      this.pkgcloud_client.client.removeFile(containerName, containerFilepath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  } else {
    return undefined;
  }
}

function pkgCloudRemoveMiddlewareHandler(options) {
  const removeFilePromise = removeCloudFilePromise.bind(this);
  return periodic.core.files.removeMiddleware.bind(Object.assign({
    removeFilePromise,
  }, periodic.core.files.removeMiddlewareHandlerDefaultOptions, options));
}

module.exports = {
  pkgCloudUploadDirectory,
  pkgCloudFormFileHandler,
  pkgCloudUploadMiddleware,
  removeCloudFilePromise,
  pkgCloudUploadMiddlewareHandler,
  pkgCloudRemoveMiddlewareHandler,
};



/**
 * {
    "_id": "5936c6d5a2bd0204173a822d",
    "attributes": {
        "cdnUri": "http://s3-us-west-2.amazonaws.com/promisefinancial.com",
        "cdnSslUri": "https://s3-us-west-2.amazonaws.com/promisefinancial.com",
        "endpoint": {
            "href": "https://s3-us-west-2.amazonaws.com/",
            "path": "/",
            "pathname": "/",
            "hostname": "s3-us-west-2.amazonaws.com",
            "port": 443,
            "host": "s3-us-west-2.amazonaws.com",
            "protocol": "https:"
        },
        "encrypted_client_side": false,
        "periodicFilename": "58a323a7cf6c7658aae99fe3-bmb-card@4x-2017-06-06_11-14-27.png",
        "cloudfilepath": "cloudfiles/2017/06/06/58a323a7cf6c7658aae99fe3-bmb-card@4x-2017-06-06_11-14-27.png",
        "cloudcontainername": "promisefinancial.com",
        "location": "https://s3-us-west-2.amazonaws.com/promisefinancial.com/cloudfiles%2F2017%2F06%2F06%2F58a323a7cf6c7658aae99fe3-bmb-card%404x-2017-06-06_11-14-27.png",
        "delimiter": "::",
        "lastModified": null,
        "etag": "a3f08c007b5255c570e906d482a0bae6-1",
        "fieldname": "mediafiles",
        "client_encryption_algo": "aes192"
    },
    "size": 63688,
    "assettype": "image/png",
    "locationtype": "amazon",
    "fileurl": "https://s3-us-west-2.amazonaws.com/promisefinancial.com/cloudfiles%2F2017%2F06%2F06%2F58a323a7cf6c7658aae99fe3-bmb-card%404x-2017-06-06_11-14-27.png",
    "name": "58a323a7cf6c7658aae99fe3-bmb-card-4x-2017-06-06-11-14-27-png",
    "title": "58a323a7cf6c7658aae99fe3-bmb-card-4x-2017-06-06-11-14-27-png",
    "author": null,
    "__v": 0,
    "related_assets": [],
    "categories": [],
    "tags": [],
    "authors": [],
    "status": "VALID",
    }
 */