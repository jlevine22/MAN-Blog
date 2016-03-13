'use strict';
let kvstore = require('../kvstore');

module.exports = function *getPostBySlug(slug) {
  let post = kvstore.store.get(slug);
  if (null === post) {
    this.throw('Post Not Found', 404);
    return;
  }
  this.body = post;
};