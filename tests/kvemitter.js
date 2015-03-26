var should = require('should');
var KVEmitter = require('../src/kvemitter');

describe('KVEmitter', function() {
    describe('#constructor', function() {
        beforeEach(function() {
            this.kve = new KVEmitter();
        });
        it('should return an object that\'s an instance of KVEmitter', function() {
            should(this.kve).be.an.Object;
            should(this.kve).be.an.instanceOf(KVEmitter);
        });
        it('should have an on function', function() {
            should(this.kve.on).be.a.Function;
        });
    });
    describe('#get', function() {
        beforeEach(function() {
            this.kve = new KVEmitter({ first: 'some value', second: { test: true }, third: 159 });
        });
        it('should return a value when it exists', function() {
            should(this.kve.get('first')).equal('some value');
            should(this.kve.get('second')).be.an.Object;
            should(this.kve.get('second')).have.a.property('test', true);
            should(this.kve.get('third')).equal(159);
        });
        it('should return null when the key doesnt exist', function() {
            should(this.kve.get('doesntexist')).be.Null;
        });
    });
    describe('#put', function() {
        beforeEach(function() {
            this.kve = new KVEmitter({ first: 'some value', second: { test: true }, third: 159 });
        });
        it('should add a new value', function() {
            this.kve.put('new-key', 'value');
            should(this.kve.get('new-key')).equal('value');
        });
        it('should emit an event when a key is put', function(done) {
            this.kve.on('put', function(event) {
                should(event).have.property('key', 'emit');
                should(event).have.property('value', 'me');
                done();
            });
            this.kve.put('emit', 'me');
        });
        it('should pass the old value when emitting a put event for an existing key', function(done) {
            this.kve.put('existing-key', 'some value');
            this.kve.get('existing-key').should.equal('some value');
            this.kve.on('put', function(event) {
                should(event).have.property('key', 'existing-key');
                should(event).have.property('value', 'new value');
                should(event).have.property('oldValue', 'some value');
                done();
            });
            this.kve.put('existing-key', 'new value');
        });
    });
    describe('#delete', function() {
        beforeEach(function() {
            this.kve = new KVEmitter({ first: 'some value', second: { test: true }, third: 159 });
        });
        it('should remove a value when it\'s deleted', function() {
            should(this.kve.get('first')).equal('some value');
            this.kve.delete('first');
            should(this.kve.get('first')).be.Null;
        });
        it('should emit an event when a key is deleted', function(done) {
            should(this.kve.get('first')).equal('some value');
            this.kve.on('delete', function(key) {
                should(key).equal('first');
                done();
            });
            this.kve.delete('first');
        });
    });
});