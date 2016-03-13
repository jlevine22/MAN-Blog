'use strict';
let kvstore = require('../kvstore');
let async  = require('async');

module.exports =  function *listPosts(next) {
  var page = this.query.p || 1;
  var start = (page - 1) * 10;

  let sortedKeys = yield kvstore.sort('date');
  let keys = sortedKeys.slice();
  keys.reverse();

  if (this.query.t) {
    let tags = util.isArray(this.query.t) ? this.query.t : [this.query.t];
    var tagIndexes = [];
    tags.forEach(function(tag) {
      tagIndexes.push(kvstore.index('tags', tag));
    });
    let tagKeys = yield Promise.all(tagIndexes);
    tagKeys.forEach(function(key) {
      keys = _.intersection(keys, key);
    });
  }

  if (this.query.q) {
    keys = yield new Promise(function (resolve) {
      async.filter(keys, function queryIterator(key, callback) {
        var value = kvstore.store.get(key);
        if (!value || !value.title || typeof value.title != 'string') {
          return callback(false);
        }
        var regexp = new RegExp(this.query.q, 'i');
        callback(value.title.match(regexp));
      }, function filteredResults(results) {
        resolve(results);
      });
    });
  }

  let posts = yield new Promise((resolve, reject) => {
    async.map(keys.slice(start, 10), function getValueForKey(key, callback) {
      callback(null, kvstore.store.get(key));
    }, function mapResults(err, results) {
      if (err) return reject(err);
      resolve(results || []);
    });
  });

  this.body = posts;
};