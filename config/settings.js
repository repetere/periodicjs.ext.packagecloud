'use strict';

module.exports = {
  settings: {
    client: {
      "provider": "amazon",
      "accessKeyId": "your-access-key-id",
      "accessKey": "you-access-key",
      // "bucket": "created-bucked-on-s3",
      "region": "us-west-2",
    },
    container: {
      name: 'periodicjs', //bucketname
    },
  },
  databases: {},
};