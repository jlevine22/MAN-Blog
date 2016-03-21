'use strict';
let _ = require('lodash');
let fs = require('fs');
let async = require('async');
let parseFile = require('./functions/parsefile');
let chokidar = require('chokidar');
let kvstore = require('./kvstore');
let koa = require('koa');
let route = require('koa-route');
let serve = require('koa-static');
let mount = require('koa-mount');
let listPosts = require('./routes/list-posts');
let getPostBySlug = require('./routes/get-post-by-slug');
let listTags = require('./routes/list-tags');

/**
 * Setup our app
 */
let config = {
  postsDirectory: process.env.POSTS_DIRECTORY || '/posts',
  cacheDirectory: process.env.CACHE_DIRECTORY || '/cache',
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost'
};

// Create app
let app = koa();

/**
 * Post routes
 */
app.use(route.get('/posts', listPosts));
app.use(route.get('/posts/:slug', getPostBySlug));
app.use(route.get('/tags', listTags));

/**
 * Static file serving
 */

function *serveIndexFile() {
  this.body = yield new Promise((resolve, reject) => {
    fs.readFile(fs.realpathSync(__dirname + '/../public/index.html'), (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

// Serve static assets
app.use(serve(__dirname + '/../public'));

// Serve the index file if the slug url is used
app.use(route.get('/p/*', serveIndexFile));

// Serve cached files
app.use(mount('/cache', serve(config.cacheDirectory)));

// Fallback, serve the index file
app.use(serveIndexFile);

// Build the database, watch the posts directory for changes, and start listening for connections
chokidar.watch(config.postsDirectory, {})
  .on('all', function(event, path) {
    if (!path.match(/\.md$/i)) {
      return;
    }
    console.log(event + ': ' + path);
    switch(event) {
      case 'unlink':
        kvstore.store.forEach(function(item, key) {
          kvstore.store.delete(key);
        });
        break;
      case 'add':
      case 'change':
      default:
        parseFile(path, config.cacheDirectory).then(function(file) {
          if (file.published) {
            kvstore.store.put(file.slug, file);
          } else {
            kvstore.store.delete(file.slug);
          }
        });
    }
  });

app.listen(config.port);

console.log('app listening on port', config.port);