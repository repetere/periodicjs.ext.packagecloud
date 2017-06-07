'use strict';

function testPreTransform(req) {
  return new Promise((resolve, reject) => {
    console.log('pre transfrom params', req.params.id);
    resolve(req);
  });
}
function testPostTransform(req) {
  return new Promise((resolve, reject) => {
    console.log('post transfrom params', req.params.id);
    const newReq = Object.assign({}, req);
    newReq.controllerData.item.title='THIS IS OVERWRITTEN'
    resolve(newReq);
  });
}

module.exports = {
  pre: {
    GET: {
      '/data/standard/items/:id':[testPreTransform]
    },
    PUT: {
    }
  },
  post: {
    GET: {
      '/data/standard/items/:id':[testPostTransform]
    },
    PUT: {
    }
  }
}