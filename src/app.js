var Promise = require('bluebird');
var Loki = require('lokijs');

var _ = require('lodash');
var fs = require('fs');
var express = require('express');
var async = require('async');
var bodyParser = require('body-parser');
var buildDb = require('./functions/builddb');

var config = _.merge({
		postsDirectory: fs.realpathSync(__dirname + '/../posts'),
		githubPushUpdateEnabled: false,
		port: 3000,
		host: 'localhost',
		serveStatic: true
	},
	require('../man.json') || {});

// Create app
var app = express();

// Serve static assets
if (config.serveStatic) {
	console.log('Serving static files');
	app.use(express.static(__dirname + '/../public'));
}

// Serve the index file if the slug url is used
app.get('/p/*', function (req, res) {
	res.sendFile(fs.realpathSync(__dirname + '/../public/index.html'));
});

// routes
app.get('/posts', function (req, res) {
	var db = app.get('db');
	var posts = db.getCollection('posts');
	var sortedPosts = posts.getDynamicView('sortedByDate');

	res.send(sortedPosts.data());
});

app.get('/posts/:slug', function (req, res) {
	var db = app.get('db');
	var posts = db.getCollection('posts');
	var post = posts.findOne({ slug: req.params.slug });

	if (null === post) {
		res.status(404).send('Not found');
		return;
	}

	var marked = Promise.promisify(require('marked'));
	var splitInput = require('./functions/parsing').splitInput
	var readFile = Promise.promisify(fs.readFile);
	readFile(post.path).then(function (buffer) {
		// Split the input
		return splitInput(buffer.toString().replace(';;;',''));
	}).spread(function (yamlString, markdownString) {
		var yaml = require('js-yaml');
		return [
			yamlString? yaml.safeLoad(yamlString) : null,
			marked(markdownString)
		];
	}).spread(function (meta, html) {
		meta = meta || {};
		meta.html = html;
		res.send(meta);
	}).catch(function (error) {
		console.error(error);
		res.status(500).send('Something went wrong!');
	});
});

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

// Fallback, serve the index file
app.use(function (req, res) {
	res.send(fs.readFileSync(__dirname + '/../public/index.html').toString());
});

// Watchr Config to detect file changes
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
		buildDb(config.postsDirectory).then(function (db) {
			app.set('db', db);
		});
	}
};

// Build the database, watch the posts directory for changes, and start listening for connections
buildDb(config.postsDirectory).then(function (db) {
	var watchr = require('watchr');
	watchr.watch(watchrConfig);
	app.set('db', db);

	var server = app.listen(config.port, config.host, function () {
		var host = server.address().address
		var port = server.address().port

		console.log ('Manly Blog app listening at http://%s:%s', host, port)
	});
});