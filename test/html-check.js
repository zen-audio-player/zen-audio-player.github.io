var assert = require("assert");
var fs = require("fs");
var html5Lint = require("html5-lint");

describe("Splash Page", function() {
    it("should have valid HTML", function(done) {
        fs.readFile("index.html", "utf8", function(err, html) {
            assert.ok(!err);
            html5Lint(html, function(err, results) {
                for (var m in results.messages) {
                    var msg = results.messages[m];
                    var type = msg.type; // error or warning
                    var message = msg.message;
                    console.log("HTML5 Lint [%s]: %s %s (line %s)", type, message, msg, msg.lastLine);
                    assert.notStrictEqual(type, "error", message + ", see line " + msg.lastLine + " in index.html");
                }
                done();
            });
        });
    });
});