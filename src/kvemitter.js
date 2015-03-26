var _ = require('lodash');
var util = require('util');
var events = require('events');

function KVEmitter(start) {
    var data = start || {};

    this.get = function(key) {
        if (data[key]) {
            return data[key];
        }
        return null;
    }

    this.put = function(key, value) {
        var event = { key: key, value: value };
        if (data[key]) {
            event.oldValue = data[key];
        }
        data[key] = value;
        this.emit('put', event);
    }

    this.delete = function(key) {
        if (data[key]) {
            delete data[key];
            this.emit('delete', key);
        }
    }

    this.keys = function() {
        return Object.keys(data);
    }
}

util.inherits(KVEmitter, events.EventEmitter);

module.exports = KVEmitter;