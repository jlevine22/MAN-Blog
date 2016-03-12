'use strict';
let _ = require('lodash');
let fs = require('fs');
let async = require('async');
let parseFile = require('./functions/parsefile');
let chokidar = require('chokidar');
let kvstore = require('./kvstore');
let koa = require('koa');
let route = require('koa-route');
let listPosts = require('./routes/list-posts');
let getPostBySlug = require('./routes/get-post-by-slug');

/**
 * Setup our app
 */
let config = _.merge(
  {
    postsDirectory: fs.realpathSync(__dirname + '/../posts'),
    cacheDirectory: fs.realpathSync(__dirname + '/../cache'),
    githubPushUpdateEnabled: false,
    port: 3000,
    host: 'localhost'
  },
  require('../man.json') || {}
);

// Create app
let app = koa();

/**
 * Post routes
 */
app.use(route.get('/posts', listPosts));
app.use(route.get('/posts/:slug', getPostBySlug));

//app.get('/tags', function(req, res) {
//  var tags = [];
//
//  kvstore.index('tags').then(function(tagsIndex) {
//    // Add the tags to the tags array so they can be sorted
//    function tagsIndexIterator(tag, callback) {
//      tags.push({ name: tag, count: tagsIndex[tag].length });
//      callback();
//    }
//    // Sort the tags by count
//    function tagsIndexIteratorComplete() {
//      async.sortBy(tags, function(tag, callback) {
//        callback(null, -tag.count);
//      }, function(err, sortedTags) {
//        res.send(sortedTags);
//      });
//    }
//    // Run the iterator
//    async.each(Object.keys(tagsIndex), tagsIndexIterator, tagsIndexIteratorComplete);
//  });
//});

/**
 * Github auto-update route
 */
//app.post('/github', bodyParser.json(), function (req, res) {
//  res.send('OK');
//
//  if (!config.githubPushUpdateEnabled) {
//    return;
//  }
//
//  var crypto = require('crypto');
//  var hash = crypto.createHmac('sha1', config.githubPushSecret).update(JSON.stringify(req.body)).digest('hex');
//
//  if ('sha1=' + hash != req.get('X-Hub-Signature')) {
//    return;
//  }
//
//  var rootPath = fs.realpathSync(__dirname + '/../');
//
//  var exec = function (cmd) {
//    console.log('execing command: %s', cmd);
//    return new Promise(function (resolve, reject) {
//      require('child_process').exec(cmd, function (error, stdout, stderr) {
//        if (error) return reject(error);
//        resolve([stdout, stderr]);
//      });
//    });
//  };
//
//  var cwd = process.cwd();
//  process.chdir(rootPath);
//  exec('git pull').spread(function (stdout, stderr) {
//    return exec('npm install');
//  }).spread(function (stdout, stderr) {
//    process.exit();
//  }).finally(function () {
//    process.chdir(cwd);
//  });
//});

/**
 * Static file serving
 */

// Serve static assets
//app.use(express.static(__dirname + '/../public'));

// Serve the index file if the slug url is used
//app.get('/p/*', function (req, res) {
//  res.sendFile(fs.realpathSync(__dirname + '/../public/index.html'));
//});

// Serve cached files
//app.use('/cache', express.static(config.cacheDirectory));

// Fallback, serve the index file
//app.use(function (req, res) {
//  res.send(fs.readFileSync(__dirname + '/../public/index.html').toString());
//});


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