var should = require('should');
var parsing = require('../src/functions/parsing');

describe('splitMarkdown', function() {
    it('should split a string by ;;;', function() {
        var result = parsing.splitMarkdown('this is;;;my string');
        result.should.be.an.Array;
        result.length.should.equal(2);
        result[0].should.equal('this is');
        result[1].should.equal('my string');
    });
    it('should only return 2 values when the string contains multiple delimiters', function() {
        var result = parsing.splitMarkdown('string1;;;string2;;;string3');
        result.should.be.an.Array;
        result.length.should.equal(2);
        result[0].should.equal('string1');
        result[1].should.equal('string2;;;string3');
    });
    it('should return an array with the 2nd value being the full string when there is no ;;;', function() {
        var result = parsing.splitMarkdown('this has no delimiter');
        result.should.be.an.Array;
        result.length.should.equal(2);
        should(result[0]).be.Null;
        result[1].should.equal('this has no delimiter');
    });
});