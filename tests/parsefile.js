var should = require('should');
var parseFile = require('../src/functions/parsefile');

describe('parseFile', function() {
  it('should be a function', function() {
    parseFile.should.be.a.Function;
  });
});