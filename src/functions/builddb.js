module.exports = function buildDb(path, cacheDirectory) {
	var Promise = require('bluebird');

	var fs = require('fs');
	var getPaths = require('./getpaths');
    var parseFile = require('./parsefile');
    var kvstore = require('../kvstore');

	var paths = getPaths(path);
	var filesIndexed = [];
	paths.forEach(function (path) {
        var p = parseFile(path, cacheDirectory).then(function(file) {
            if (file.published) {
                kvstore.store.put(file.slug, file);
            }
        });
		filesIndexed.push(p);
	});

	return Promise.all(filesIndexed).then(function () {
		return kvstore;
	});
}