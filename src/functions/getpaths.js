var fs = require('fs');
module.exports = function getPaths(rootPath) {
	var paths = [];
	rootPath = fs.realpathSync(rootPath);
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
};