var express = require('express');
var Promise = require('bluebird');
var fs = require('fs');
var async = require('async');
var Loki = require('lokijs');

var postsDirectory = process.env.MANLY_POSTS_DIR || __dirname + '/../posts';

var app = express();
app.use(express.static(__dirname + '/../public'));
app.use('/posts', express.static(postsDirectory));

function getPaths(rootPath) {
	var paths = [];
	fs.readdirSync(rootPath).forEach(function (path) {
		if (path == '.default.md') return;
		if (path == '.' || path == '..') return;
		var fullPath = rootPath + '/' + path;
		var stat = fs.statSync(fullPath);
		if (stat.isFile() && fullPath.match(/\.md$/i)) {
			paths.push(fullPath);
		} else if (stat.isDirectory()) {
			paths = paths.concat(getPaths(fullPath));
		}
	});
	return paths;
}

var rootPath = fs.realpathSync(postsDirectory);
buildDb(rootPath).then(function (db) {
	app.set('db', db);
});

function buildDb(path) {
	var readFile = Promise.promisify(fs.readFile);
	var marked = Promise.promisify(require('marked'));
	var yaml = require('js-yaml');
	var splitInput = require('./functions/parsing').splitInput;
	var db = new Loki();
	var posts = db.addCollection('posts');
	var sortedView = posts.addDynamicView('sortedByDate');
	sortedView.applySort(function (obj1, obj2) {
		var date1 = obj1.date || null;
		var date2 = obj2.date || null;

		if (date1 == date2) return 0;
		if (date1 > date2) return 1;
		if (date1 < date2) return -1;
	});

	var paths = getPaths(path);
	var filesIndexed = [];
	paths.forEach(function (path) {
		filesIndexed.push(
			readFile(path)
				.then(function bufferToString(data) {
					return data.toString();
				})
				.then(splitInput)
				.spread(function parseSections(yamlString, markdownString) {
					if (markdownString.match(/;;;/)) {
						var hasMore = true;
					}
					return [
						yamlString ? yaml.safeLoad(yamlString) : null,
						marked(markdownString.split(';;;')[0]),
						hasMore || false
					];
				})
				.spread(function createFinalObject(meta, htmlSummary, hasMore) {
					var post = meta || {};
					post.path = path;
					post.summary = htmlSummary;
					post.hasMore = hasMore;

					posts.insert(post);

					return post;
				})
		);
	});

	return Promise.all(filesIndexed).then(function () {
		return db;
	});
}

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

app.use(function (req, res) {
	res.send(fs.readFileSync(__dirname + '/../public/index.html').toString());
});

var server = app.listen(process.env.MANLY_PORT || 3000, 'localhost', function () {
	var host = server.address().address
	var port = server.address().port

	console.log ('Example app listening at http://%s:%s', host, port)
});