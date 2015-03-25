var KVEmitter = require('./kvemitter');
var async = require('async');
var Promise = require('bluebird');

var sorts = {};
var indices = {};
var sorting = {};
var kve = new KVEmitter();

function sort(values, field) {
    return new Promise(function(resolve, reject) {
        async.sortBy(values, function(key, callback) {
            var value = kve.get(key);
            if (!field) {
                return callback(null, value);
            }
            var path = field.split('.');
            for (var i = 0; i < path.length; i++) {
                if (null === value) break;
                value = value[path[i]] || null;
            }
            callback(null, value);
        }, function sortingComplete(err, results) {
            if (err) throw err;
            resolve(results);
        });
    });
}

kve.on('put', function(result) {
    function addToSortValues(sortBy) {
        sorts[sortBy] = sorts[sortBy].then(function(values) {
            values.push(result.key);
            return sort(values, sortBy);
        });
    }
    async.each(Object.keys(sorts), addToSortValues);
});

kve.on('delete', function(key) {
    async.each(Objects.keys(sorts), function(sortBy) {
        sorts[sortBy] = sorts[sortBy].then(function (values) {
            var index = values.indexOf(key);
            values.splice(index, 1);
            return values;
        });
    });
});

module.exports = {
    sort: function(sortBy, order) {
        order = order || 'desc';
        if (!sortBy) {
            throw new Error("sortBy is required");
        }
        if (!sorts[sortBy]) {
            sorts[sortBy] = sort(kve.keys(), sortBy);
        }
        return sorts[sortBy];
    },
    store: kve
};