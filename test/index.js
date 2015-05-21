var assert = require("assert");
var Browser = require("zombie");
var path = require("path");

var browser = new Browser();

var dir = path.join(__dirname, "..");
// TODO: tests may break on Windows because of this magic
var indexHTMLURL = "file:" + dir + "/index.html";

describe("Tests", function () {
    describe("Splash page", function () {
        it("should have required HTML elements", function (done) {
            browser.visit(indexHTMLURL, function (e) {
                // 404 for Google Analytics is expected locally
                assert.equal(e.message, "Server returned status code 404 from file://www.google-analytics.com/analytics.js");
                assert.ok(browser.query("html"), "Couldn't find <html>, wow!");
                assert.ok(browser.query("head"), "Couldn't find <head>, wow!");
                assert.ok(browser.query("body"), "Couldn't find <body>, wow!");
                assert.ok(browser.query("title"), "Couldn't find <title>, wow!");
                done();
            });
        });
        it("should have expected metadata", function (done) {
            assert.equal(browser.url, indexHTMLURL);
            assert.equal(browser.query("title").text, "Zen Audio Player");
            assert.equal(browser.query("#hero > a").href, "https://zen-audio-player.github.io/");
            assert.ok(browser.query("#hero > a > img.logo").src.indexOf("img/zen-audio-player-905.png") !== -1);
            assert.equal(browser.query("#hero > a > img.logo").alt, "Zen Audio Player");
            // TODO: more tests for link validation
            done();
        });
        it("should have expected elements", function (done) {
            assert.ok(browser.query("#hero"), "Couldn't find #hero");
            assert.ok(browser.query("#hero > a"), "Couldn't hero <a>");
            assert.ok(browser.query("#hero > a > img.logo"), "Couldn't hero <a><img class=\"logo\">");
            assert.ok(browser.query("#form"), "Couldn't find #form");
            // TODO: validate the rest of the form
            assert.ok(browser.query("#demo"), "Couldn't find #demo");
            assert.ok(browser.query("#submit"), "Couldn't find #submit");
            assert.ok(browser.query("#zen-video-error"), "Couldn't find #zen-video-error");
            assert.ok(browser.query("#zen-video-title"), "Couldn't find #zen-video-title");
            assert.ok(browser.query("#player"), "Couldn't find #player");
            done();
        });
        it("should not have strange HTML elements", function (done) {
            // These are more of a sanity check than anything else
            assert.ok(!browser.query("chicken"), "Found unexpected <chicken> element");
            assert.ok(!browser.query("soup"), "Found unexpected <soup> element");
            assert.ok(!browser.query("for"), "Found unexpected <for> element");
            assert.ok(!browser.query("the"), "Found unexpected <the> element");
            assert.ok(!browser.query("code"), "Found unexpected <code> element");
            done();
        });
    });
});