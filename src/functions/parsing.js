module.exports = {
    /**
     * Splits a YAML section at the top of a markdown file from the rest of the string.
     * @param data {String}
     * @returns {Array}
     */
	splitYaml: function (data) {
		if (data.slice(0, 3) !== '---') return [null, data];

		var matcher = /\n(\.{3}|-{3})/g;
		var metaEnd = matcher.exec(data);

		return metaEnd && [data.slice(0, metaEnd.index), data.slice(matcher.lastIndex)];
	},
    /**
     * Splits a markdown string by a ;;; delimiter. Returns an array containing the two
     * halves of the string.
     * @param data {String}
     * @returns {Array}
     */
    splitMarkdown: function (data) {
        if (data.match(/;;;/)) {
            var split = data.split(';;;', 2);
            return split;
        }
        return [
            null,
            data
        ];
    }
};