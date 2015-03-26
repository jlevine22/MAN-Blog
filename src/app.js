var Promise = require('bluebird');

var _ = require('lodash');
var fs = require('fs');
var express = require('express');
var async = require('async');
var bodyParser = require('body-parser');
var buildDb = require('./functions/builddb');

var kvstore = require('./kvstore');

/**
 * Setup our app
 */
var config = _.merge({
		postsDirectory: fs.realpathSync(__dirname + '/../posts'),
        cacheDirectory: fs.realpathSync(__dirname + '/../cache'),
		githubPushUpdateEnabled: false,
		port: 3000,
		host: 'localhost'
	},
	require('../man.json') || {});

// Create app
var app = express();

/**
 * Post routes
 */
app.get('/posts', function (req, res) {
    var page = req.query.p || 1;
    var start = (page - 1) * 10;

    var data = kvstore.sort('date').then(function(sorted) {
        var ordered = sorted.slice();
        ordered.reverse();
        return ordered;
    });

    if (req.query.q) {
        data = data.then(function (values) {
            return new Promise(function (resolve) {
                async.filter(values, function queryIterator(key, callback) {
                    var value = kvstore.store.get(key);
                    if (!value || !value.title || typeof value.title != 'string') {
                        return callback(false);
                    }
                    var regexp = new RegExp(req.query.q, 'i');
                    callback(value.title.match(regexp));
                }, function filteredResults(results) {
                    resolve(results);
                });
            });
        });
    }

    data = data.then(function(values) {
        async.map(values.slice(start, 10), function getValueForKey(key, callback) {
            callback(null, kvstore.store.get(key));
        }, function mapResults(err, results) {
            if (err) throw err;
            res.send(results || []);
        });
    });
});

app.get('/posts/:slug', function (req, res) {
    var post = kvstore.store.get(req.params.slug);
    if (null === post) {
		res.status(404).send('Not found');
		return;
	}
    res.send(post);
});

/**
 * Github auto-update route
 */
app.post('/github', bodyParser.json(), function (req, res) {
	res.send('OK');

	if (!config.githubPushUpdateEnabled) {
		return;
	}

	var crypto = require('crypto');
	var hash = crypto.createHmac('sha1', config.githubPushSecret).update(JSON.stringify(req.body)).digest('hex');

	if ('sha1=' + hash != req.get('X-Hub-Signature')) {
		return;
	}

	var rootPath = fs.realpathSync(__dirname + '/../');

	var exec = function (cmd) {
		console.log('execing command: %s', cmd);
		return new Promise(function (resolve, reject) {
			require('child_process').exec(cmd, function (error, stdout, stderr) {
				if (error) return reject(error);
				resolve([stdout, stderr]);
			});
		});
	};

	var cwd = process.cwd();
	process.chdir(rootPath);
	exec('git pull').spread(function (stdout, stderr) {
		return exec('npm install');
	}).spread(function (stdout, stderr) {
		process.exit();
	}).finally(function () {
		process.chdir(cwd);
	});
});

/**
 * Static file serving
 */

// Serve static assets
app.use(express.static(__dirname + '/../public'));

// Serve the index file if the slug url is used
app.get('/p/*', function (req, res) {
    res.sendFile(fs.realpathSync(__dirname + '/../public/index.html'));
});

// Serve cached files
app.use('/cache', express.static(config.cacheDirectory));

// Fallback, serve the index file
app.use(function (req, res) {
	res.send(fs.readFileSync(__dirname + '/../public/index.html').toString());
});

/**
 * File watching
 */
var watchrConfig = {
	path: config.postsDirectory,
	listener: function (type, path) {
		// Perform an incremental update of the database
		//switch (type) {
		//	case 'update':
		//		break;
		//	case 'create':
		//		break;
		//	case 'delete':
		//		break;
		//}

		// Rebuild the db for now until I have time to properly implement incremental updates
		//
		buildDb(config.postsDirectory, cacheDirectory);
	}
};

// Build the database, watch the posts directory for changes, and start listening for connections
buildDb(config.postsDirectory, config.cacheDirectory).then(function (kvstore) {
	var watchr = require('watchr');
	watchr.watch(watchrConfig);

	var server = app.listen(config.port, config.host, function () {
		var host = server.address().address
		var port = server.address().port

		console.log ('Manly Blog app listening at http://%s:%s', host, port)
	});
});