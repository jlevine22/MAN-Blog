module.exports = function buildDb(path) {
	var Promise = require('bluebird');
	var Loki = require('lokijs');

	var fs = require('fs');
	var yaml = require('js-yaml');
	var getPaths = require('./getpaths');

	var readFile = Promise.promisify(fs.readFile);
	var marked = Promise.promisify(require('marked'));
	var splitInput = require('./parsing').splitInput;
	var db = new Loki();
	var posts = db.addCollection('posts');
	var sortedView = posts.addDynamicView('sortedByDate');
	sortedView.applySort(function (obj1, obj2) {
		var date1 = obj1.date || null;
		var date2 = obj2.date || null;

		if (date1 == date2) return 0;
		if (date1 > date2) return -1;
		if (date1 < date2) return 1;
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

					if (post.published !== false) {
						posts.insert(post);
					}

					return post;
				})
		);
	});

	return Promise.all(filesIndexed).then(function () {
		return db;
	});
}