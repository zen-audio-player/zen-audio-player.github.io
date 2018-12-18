var assert = require("assert");
var path = require("path");
var Browser = require("zombie");

var _js = "";

var indexHTMLURL = "file://" + path.join(__dirname, "..", "index.html");
const browser = new Browser();

describe("JavaScript components", function() {
    before(function(done) {
        browser.visit(indexHTMLURL, function () {
            done();
        });
    });
    it("should load TrackJS token", function() {
        var trackjs = browser.evaluate("window._trackJs");
        assert.strictEqual(Object.keys(trackjs).length, 1);
        assert.ok(trackjs.token);
        assert.strictEqual(trackjs.token.length, 32);
    });
    it("should load jQuery", function() {
        assert.ok(browser.evaluate("$"));
    });
    it("should make all requests over https, not http", function() {
        assert.strictEqual(-1, _js.indexOf("http://"), "Please use HTTPS for all scripts");
    });
});