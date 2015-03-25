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
});