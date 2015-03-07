module.exports = {
	splitInput: function (data) {
		if (data.slice(0, 3) !== '---') return [null, data];

		var matcher = /\n(\.{3}|-{3})/g;
		var metaEnd = matcher.exec(data);

		return metaEnd && [data.slice(0, metaEnd.index), data.slice(matcher.lastIndex)];
	}
};