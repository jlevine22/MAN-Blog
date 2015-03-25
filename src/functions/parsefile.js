module.exports = function parseFile(path, cacheDirectory) {
    'use strict';
    var Promise = require('bluebird');

    var _ = require('lodash');
    var fs = require('fs');
    var marked = require('marked');
    var splitYaml = require('./parsing').splitYaml;
    var splitMarkdown = require('./parsing').splitMarkdown;
    var yaml = require('js-yaml');

    var markdown = Promise.promisify(marked);
    var readFile = Promise.promisify(fs.readFile);
    var writeFile = Promise.promisify(fs.writeFile);

    var result = {};

    return readFile(path)
        .then(function bufferToString(data) {
            return data.toString();
        })
        .then(splitYaml)
        .spread(function(yamlString, markdownString) {
            result = _.defaults(result, yaml.safeLoad(yamlString));
            return markdownString;
        })
        .then(splitMarkdown)
        .spread(function parseMarkdown(summaryMarkdownString, fullMarkdownString) {
            return [
                summaryMarkdownString ? markdown(summaryMarkdownString) : null,
                markdown(fullMarkdownString)
            ];
        })
        .spread(function saveHtml(summaryHtml, fullHtml) {
            if (!result.slug) {
                return;
            }

            var summaryPath = cacheDirectory + '/' + result.slug + '.summary.html';
            var fullPath = cacheDirectory + '/' + result.slug + '.html';

            var summary;
            if (summaryHtml) {
                summary = writeFile(summaryPath, summaryHtml);
                result.summary = true;
            }
            var full = writeFile(fullPath, fullHtml);

            return Promise.all([summary, full]);
        })
        .then(function() {
            return result;
        });
}