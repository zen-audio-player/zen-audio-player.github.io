var assert = require("assert");
var fs = require("fs");
var html5Lint = require("html5-lint");

var _html = "";

describe("index.html", function() {
    before(function() {
        _html = fs.readFileSync("index.html", "utf8");
    });
    it("should have valid HTML", function(done) {
        html5Lint(_html, function(err, results) {
            for (var m in results.messages) {
                var msg = results.messages[m];
                var type = msg.type; // error, warning, or info
                var message = msg.message;
                var lineNumber = msg.lastLine;
                console.log("HTML5 Lint [%s]: %s %s (line %s)", type, message, lineNumber);
                assert.notStrictEqual(type, "error", message + ", see line " + lineNumber + " in index.html");
            }
            done();
        });
    });
    it("should not contain tab characters", function() {
        assert.strictEqual(-1, _html.indexOf("\t"), "Please remove any tab indents from index.html");
    });
    it("should not contain single quote characters", function() {
        assert.strictEqual(-1, _html.indexOf("'"), "Please remove any single quote characters from index.html");
    });
});