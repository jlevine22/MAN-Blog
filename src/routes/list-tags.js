'use strict';
let async = require('async');
let kvstore = require('../kvstore');

module.exports = function *listTags() {
  let tagsIndex = yield kvstore.index('tags');

  let tags = yield new Promise((resolve) => {
    let tags = [];
    async.each(
      Object.keys(tagsIndex),
      function tagsIndexIterator(tag, callback) {
        tags.push({ name: tag, count: tagsIndex[tag].length });
        callback();
      },
      function eachTagsIndexComplete() {
        resolve(tags);
      }
    );
  });

  let sortedTags = yield new Promise((resolve, reject) => {
    async.sortBy(tags, (tag, callback) => {
      callback(null, -tag.count);
    }, (err, sortedTags) => {
      if (err) return reject(err);
      resolve(sortedTags);
    });
  });

  this.body = sortedTags;
};