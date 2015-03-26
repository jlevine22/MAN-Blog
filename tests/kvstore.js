var should = require('should');
var KVEmitter = require('../src/kvemitter');
var kvstore = require('../src/kvstore');

describe('kvstore', function() {
    describe('.store', function() {
        it('should be a KVEmitter object', function() {
            kvstore.should.have.property('store');
            kvstore.store.should.be.an.instanceOf(KVEmitter);
        });
    });
    describe('sort()', function() {
        before(function() {
            kvstore.store.put('key1', { number: 1, letter: 'z' });
            kvstore.store.put('key2', { number: 3, letter: 'h' });
            kvstore.store.put('key3', { number: 2, letter: 'b' });
        });
        it('should resolve an array of keys sorted by numbers', function() {
            numberSort = kvstore.sort('number');

            return numberSort.then(function (sortedValues) {
                sortedValues.length.should.equal(3);
                sortedValues[0].should.equal('key1');
                sortedValues[1].should.equal('key3');
                sortedValues[2].should.equal('key2');
            });
        });
        it('should resolve an array of keys sorted by the specified field AFTER a new key is added', function() {
            kvstore.store.put('key4', { number: 0, letter: 'a' });

            return kvstore.sort('number').then(function (sortedValues) {
                sortedValues.length.should.equal(4);
                sortedValues[0].should.equal('key4');
                sortedValues[1].should.equal('key1');
                sortedValues[2].should.equal('key3');
            });
        });
        it('should resolve an array of keys sorted by strings', function() {
            return kvstore.sort('letter').then(function (sortedValues) {
                sortedValues.length.should.equal(4);
                sortedValues[0].should.equal('key4');
                sortedValues[1].should.equal('key3');
                sortedValues[2].should.equal('key2');
                sortedValues[3].should.equal('key1');
            });
        });
        it('should resolve an array of keys sorted by strings AFTER a new key is added', function() {
            kvstore.store.put('key5', { number: 12345, letter: 'abcdefg' });
            return kvstore.sort('letter').then(function (sortedValues) {
                sortedValues.length.should.equal(5);
                sortedValues[0].should.equal('key4');
                sortedValues[1].should.equal('key5');
            });
        });
    });
    describe('index()', function() {
        before(function() {
            kvstore.store.put('indexed-key-1', { indexedField: 20 });
            kvstore.store.put('indexed-key-2', { indexedField: 50 });
            kvstore.store.put('indexed-key-3', { indexedField: 100 });
            kvstore.store.put('indexed-key-4', { indexedField: 50 });
            kvstore.store.put('indexed-key-5', { indexedField: 66 });

            kvstore.store.put('key-111', { indexedArrayField: [2, 4, 6, 8, 10] });
            kvstore.store.put('key-222', { indexedArrayField: [2, 4, 10] });
            kvstore.store.put('key-333', { indexedArrayField: ['a', 'b', 'c', 'd'] });
            kvstore.store.put('key-444', { indexedArrayField: ['a', 'b'] });
            kvstore.store.put('key-555', { indexedArrayField: ['b', 'c', 'd'] });
        });
        it('should resolve an index object', function() {
            var indices = [20, 50, 66, 100];
            var getIndex = kvstore.index('indexedField');

            return getIndex.then(function(index) {
                indices.forEach(function(i) {
                    index[i].should.be.an.Array;
                    if (i == 50) {
                        index[i].length.should.equal(2);
                    } else {
                        index[i].length.should.equal(1);
                    }
                    switch(i) {
                        case 20:
                            index[20].indexOf('indexed-key-1').should.equal(0);
                            break;
                        case 50:
                            index[50].indexOf('indexed-key-2').should.equal(0);
                            index[50].indexOf('indexed-key-4').should.equal(1);
                            break;
                        case 100:
                            index[100].indexOf('indexed-key-3').should.equal(0);
                            break;
                        case 66:
                            index[66].indexOf('indexed-key-5').should.equal(0);
                    }
                });
            });
        });
        it('should resolve an index object for array fields', function() {
            return kvstore.index('indexedArrayField').then(function(index) {
                index['a'].should.be.an.Array;
                index['a'].length.should.equal(2);
                index['a'].indexOf('key-333').should.not.equal(-1);
                index['a'].indexOf('key-444').should.not.equal(-1);

                index['b'].should.be.an.Array;
                index['b'].length.should.equal(3);
                index['b'].indexOf('key-333').should.not.equal(-1);
                index['b'].indexOf('key-444').should.not.equal(-1);
                index['b'].indexOf('key-555').should.not.equal(-1);
            });
        });
        it('should return an array for a specific index value', function() {
            return kvstore.index('indexedArrayField', 'b').then(function (keys) {
                keys.should.be.an.Array;
                keys.length.should.equal(3);
                keys.indexOf('key-333').should.not.equal(-1);
                keys.indexOf('key-444').should.not.equal(-1);
                keys.indexOf('key-555').should.not.equal(-1);
            });
        });
    });
});