'use strict';
let _ = require('lodash');
let util = require('util');
let events = require('events');
let async = require('async');

class KVStore extends events.EventEmitter {
  constructor(data) {
    super();
    this.data = data || {};
    this.sorts = {};
    this.indices = {};
  }

  get(key) {
    if (this.data[key]) {
      return this.data[key];
    }
    return null;
  }

  put(key, value) {
    var event = { key: key, value: value };
    if (this.data[key]) {
      event.oldValue = this.data[key];
    }
    this.data[key] = value;
    async.each(Object.keys(this.sorts), sortBy => {
      this.sorts[sortBy] = this.sorts[sortBy].then(values => {
        if (values.indexOf(event.key) != -1) {
          return values;
        }
        values.push(event.key);
        return this.createSort(sortBy);
      });
    });
    this.emit('put', event);
  }

  delete(key) {
    if (this.data[key]) {
      delete this.data[key];
      async.each(Object.keys(this.sorts), sortBy => {
        this.sorts[sortBy] = this.sorts[sortBy].then(values => {
          var index = values.indexOf(key);
          values.splice(index, 1);
          return values;
        });
      });
      this.emit('delete', key);
    }
  }

  get keys() {
    return Object.keys(this.data);
  }

  forEach(iterator) {
    this.keys.forEach(function(key) {
      iterator.call(this, this.data[key], key);
    });
  }

  sort(sortBy, order) {
    order = order || 'desc';
    if (!sortBy) {
      throw new Error("sortBy is required");
    }
    if (!this.sorts[sortBy]) {
      this.sorts[sortBy] = this.createSort(sortBy);
    }
    return this.sorts[sortBy];
  }

  createSort(field) {
    let self = this;
    return new Promise(function(resolve, reject) {
      async.sortBy(self.keys, function(key, callback) {
        var value = self.get(key);
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

  index(field, value) {
    if (!field) {
      throw new Error("field is required");
    }
    if (!this.indices[field]) {
      this.indices[field] = this.createIndex(field);
    }
    if (value) {
      return this.indices[field].then(function(index) {
        return index[value] || [];
      });
    }
    return this.indices[field];
  }

  createIndex(field) {
    let self = this;
    return new Promise(function(resolve, reject) {
      var indexObject = {};
      async.each(self.keys, function indexIterator(key, callback) {
        var value = self.get(key);
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
}

module.exports = KVStore;