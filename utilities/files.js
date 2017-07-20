'use strict';
const periodic = require('periodicjs');
const pkgcloud = require('pkgcloud');
const Busboy = require('busboy');
const crypto = require('crypto');
const path = require('path');
const settings = require('./settings');
let client = {};
let publicPath = {};


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
  const upload_dir = this.periodic.settings.express.config.upload_directory;
  const name = periodic.core.files.renameFile.call(this, {
    filename,
    req: this.req,
  });
  const uploadDir = periodic.core.files.uploadDirectory({
    req: this.req,
    periodic: this.periodic,
    upload_dir,
  });
  const pkgCloudUploadFileName = path.join(this.upload_path_dir || uploadDir.upload_path_dir, name);
  const pkgCloudRemoteBaseURL = (this.prefer_http) ? pkgCloudClient.publicPath.cdnUri : pkgCloudClient.publicPath.cdnSslUri;
  // const filelocation = (pkgCloudClient.clientSettings.provider === 'amazon') ? uploaded_cloud_file.location : pkgCloudClient.publicPath.cdnUri + '/' + pkgCloudUploadFileName;
  const filelocation = path.join(pkgCloudRemoteBaseURL, pkgCloudUploadFileName);
  const fileurl = pkgCloudUploadFileName;
  const processedFile = {
    fieldname,
    encoding,
    mimetype,
    locationtype: pkgCloudClient.clientSettings.provider,
    original_filename: filename,
    filename: name,
    name,
    fileurl,
    uploaddirectory: uploadDir.periodicDir,
    encrypted_client_side: this.encrypted_client_side,
    client_encryption_algo: this.client_encryption_algo,
    attributes: Object.assign({}, pkgCloudClient.publicPath, {
      cloudfilepath: pkgCloudUploadFileName,
      cloudcontainername: pkgCloudClient.containerSettings.name,
      location: filelocation,
    })
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
        'x-amz-meta-Cache-Control': this.cacheControl || 'public, max-age=86400'
      }
    });
    uploadStream.on('error', (e) => {
      throw e;
    });

    uploadStream.on('success', (cloudfile) => {
      console.log('~~~~~~~~~~~~~~S3 SRTEAM')
      console.log('~~~~~~~~~~~~~~S3 SRTEAM')
      console.log('~~~~~~~~~~~~~~S3 SRTEAM')
      console.log('~~~~~~~~~~~~~~S3 SRTEAM')
      console.log('~~~~~~~~~~~~~~S3 SRTEAM')
      console.log('~~~~~~~~~~~~~~S3 SRTEAM')
      console.log('~~~~~~~~~~~~~~S3 SRTEAM', { cloudfile });
      // success, file will be a File model
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
    console.log('FILE PROCESSING COMPLETE')
    console.log('FILE PROCESSING COMPLETE')
    console.log('FILE PROCESSING COMPLETE')
    console.log('FILE PROCESSING COMPLETE')
    console.log('FILE PROCESSING COMPLETE')
    console.log('FILE PROCESSING COMPLETE')
    this.files.push(processedFile);
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
  const busboy = new Busboy({ headers: req.headers, });
  const middlewareInstance = Object.assign({}, {
    body: {},
    files: [],
    req,
    res,
  }, this);
  const fileHandler = pkgCloudFormFileHandler.bind(middlewareInstance);
  const fieldHandler = periodic.core.files.formFieldHandler.bind(middlewareInstance);
  const completeHandler = periodic.core.files.completeFormHandler.bind(middlewareInstance, { req, res, next, });
  busboy.on('file', fileHandler);
  busboy.on('field', fieldHandler);
  busboy.on('finish', completeHandler);
  req.pipe(busboy);
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
    pkgcloud_client: this.pkgcloud_client
  }, periodic.core.files.uploadMiddlewareHandlerDefaultOptions, options));
}

module.exports = {
  pkgCloudFormFileHandler,
  pkgCloudUploadMiddleware,
  pkgCloudUploadMiddlewareHandler,
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