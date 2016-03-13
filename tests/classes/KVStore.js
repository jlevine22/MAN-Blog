'use strict';
var should = require('should');
var KVStore = require('../../src/classes/KVStore');

describe('KVStore', function() {
  describe('#constructor', function() {
    beforeEach(function() {
      this.store = new KVStore();
    });
    it('should return an object that\'s an instance of KVEmitter', function() {
      should(this.store).be.an.Object;
      should(this.store).be.an.instanceOf(KVStore);
    });
    it('should have an on function', function() {
      should(this.store.on).be.a.Function;
    });
  });
  describe('.keys', function() {
    it('should return an array of keys', function() {
      let emptyStore = new KVStore();
      emptyStore.keys.should.be.an.Array;
      let store = new KVStore({ 'key1': 'abc', 'key2': 'def' });
      store.keys.should.be.an.Array;
      store.keys.length.should.equal(2);
    });
  });
  describe('#get', function() {
    beforeEach(function() {
      this.store = new KVStore({ first: 'some value', second: { test: true }, third: 159 });
    });
    it('should return a value when it exists', function() {
      should(this.store.get('first')).equal('some value');
      should(this.store.get('second')).be.an.Object;
      should(this.store.get('second')).have.a.property('test', true);
      should(this.store.get('third')).equal(159);
    });
    it('should return null when the key doesnt exist', function() {
      should(this.store.get('doesntexist')).be.Null;
    });
  });
  describe('#put', function() {
    beforeEach(function() {
      this.store = new KVStore({ first: 'some value', second: { test: true }, third: 159 });
    });
    it('should add a new value', function() {
      this.store.put('new-key', 'value');
      should(this.store.get('new-key')).equal('value');
    });
    it('should emit an event when a key is put', function(done) {
      this.store.on('put', function(event) {
        should(event).have.property('key', 'emit');
        should(event).have.property('value', 'me');
        done();
      });
      this.store.put('emit', 'me');
    });
    it('should pass the old value when emitting a put event for an existing key', function(done) {
      this.store.put('existing-key', 'some value');
      this.store.get('existing-key').should.equal('some value');
      this.store.on('put', function(event) {
        should(event).have.property('key', 'existing-key');
        should(event).have.property('value', 'new value');
        should(event).have.property('oldValue', 'some value');
        done();
      });
      this.store.put('existing-key', 'new value');
    });
  });
  describe('#delete', function() {
    beforeEach(function() {
      this.store = new KVStore({ first: 'some value', second: { test: true }, third: 159 });
    });
    it('should remove a value when it\'s deleted', function() {
      should(this.store.get('first')).equal('some value');
      this.store.delete('first');
      should(this.store.get('first')).be.Null;
    });
    it('should emit an event when a key is deleted', function(done) {
      should(this.store.get('first')).equal('some value');
      this.store.on('delete', function(key) {
        should(key).equal('first');
        done();
      });
      this.store.delete('first');
    });
  });
  describe('#sort', function() {
    before(function() {
      this.store = new KVStore({
        'key1': { number: 1, letter: 'z'},
        'key2': { number: 3, letter: 'h' },
        'key3': { number: 2, letter: 'b' }
      });
    });
    it('should resolve an array of keys sorted by numbers', function() {
      let numberSort = this.store.sort('number');
      return numberSort.then(function (sortedValues) {
        sortedValues.length.should.equal(3);
        sortedValues[0].should.equal('key1');
        sortedValues[1].should.equal('key3');
        sortedValues[2].should.equal('key2');
      });
    });
    it('should resolve an array of keys sorted by the specified field AFTER a new key is added', function() {
      this.store.put('key4', { number: 0, letter: 'a' });
      return this.store.sort('number').then(function (sortedValues) {
        sortedValues.length.should.equal(4);
        sortedValues[0].should.equal('key4');
        sortedValues[1].should.equal('key1');
        sortedValues[2].should.equal('key3');
      });
    });
    it('should resolve an array of keys sorted by strings', function() {
      return this.store.sort('letter').then(function (sortedValues) {
        sortedValues.length.should.equal(4);
        sortedValues[0].should.equal('key4');
        sortedValues[1].should.equal('key3');
        sortedValues[2].should.equal('key2');
        sortedValues[3].should.equal('key1');
      });
    });
    it('should resolve an array of keys sorted by strings AFTER a new key is added', function() {
      this.store.put('key5', { number: 12345, letter: 'abcdefg' });
      return this.store.sort('letter').then(function (sortedValues) {
        sortedValues.length.should.equal(5);
        sortedValues[0].should.equal('key4');
        sortedValues[1].should.equal('key5');
      });
    });
  });
});