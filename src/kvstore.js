var KVEmitter = require('./kvemitter');
var async = require('async');
var util = require('util');
var Promise = require('bluebird');

var sorts = {};
var indices = {};
var sorting = {};
var kve = new KVEmitter();

function index(keys, field) {
    return new Promise(function(resolve, reject) {
        var indexObject = {};
        async.each(keys, function indexIterator(key, callback) {
            var value = kve.get(key);
            if (value != null && value[field] != null) {
                var values;
                if (!util.isArray(value[field])) {
                    values = [value[field]];
                } else {
                    values = value[field];
                }
                values.forEach(function(v) {
                    if (indexObject[v] == null) {
                        indexObject[v] = [];
                    }
                    indexObject[v].push(key);
                });
            }
            callback();
        }, function(err) {
            resolve(indexObject);
        });
    });
}

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
    async.each(Object.keys(sorts), function(sortBy) {
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
    index: function(field, value) {
        if (!field) {
            throw new Error("field is required");
        }
        if (!indices[field]) {
            indices[field] = index(kve.keys(), field);
        }
        if (value) {
            return indices[field].then(function(index) {
                return index[value] || [];
            });
        }
        return indices[field];
    },
    store: kve
};