var assert = require("assert");
var Browser = require("zombie");
var path = require("path");
var fs = require("fs");
var path = require("path");

var browser = new Browser();

// TODO: tests may break on Windows because of this magic
var indexHTMLURL = "file:" + path.join(__dirname, "..", "index.html");

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
        it("should have expected metadata", function () {
            assert.equal(browser.url, indexHTMLURL);
            assert.equal(browser.query("meta ~ meta").name, "viewport");
            assert.equal(browser.query("meta ~ meta").content, "width=device-width, initial-scale=1");
            assert.equal(browser.query("title").text, "Zen Audio Player");

            // TODO: more tests for link validation
        });
        it("should have favicon configured correctly", function () {
            var faviconPath = path.join(__filename, "..", "..", "img", "favicon.ico");
            assert.ok(fs.existsSync(faviconPath));
            assert.equal(browser.query("link").href, "img/favicon.ico");
            assert.equal(browser.query("link").type, "image/x-icon");
            assert.equal(browser.query("link").rel, "shortcut icon");
            assert.equal(browser.query("link ~ link").href, "img/favicon.ico");
            assert.equal(browser.query("link ~ link").type, "image/x-icon");
            assert.equal(browser.query("link ~ link").rel, "icon");
        });
        it("should have CSS files configured correctly", function () {
            assert.equal(browser.query("link ~ link ~ link").rel, "stylesheet");
            assert.equal(browser.query("link ~ link ~ link").href, "css/styles.css");

            assert.equal(browser.query("link ~ link ~ link  ~ link").rel, "stylesheet");
            assert.equal(browser.query("link ~ link ~ link ~ link").href, "bower_components/primer-css/css/primer.css");

            assert.equal(browser.query("link ~ link ~ link ~ link ~ link").rel, "stylesheet");
            assert.equal(browser.query("link ~ link ~ link ~ link ~ link").href, "bower_components/octicons/octicons/octicons.css");
        });
        // TODO: validate JS files, might have some funky action w/ the YouTube iFrame API though
        it("should have logo configured correctly", function () {
            var imgFolderPath = path.join(__filename, "..", "..", "img") + path.sep;
            assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-113.png");
            assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-453.png");
            assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-905.png");
            assert.equal(browser.query("#hero > figure > a").href, "https://zen-audio-player.github.io/");
            assert.ok(browser.query("#hero > figure > a > img.logo").src.indexOf("img/zen-audio-player-905.png") !== -1);
            assert.equal(browser.query("#hero > figure > a > img.logo").alt, "Zen Audio Player");
        });
        it("should have expected elements", function () {
            assert.ok(browser.query("#hero"), "Couldn't find #hero");
            assert.ok(browser.query("#hero > figure"), "Couldn't find hero <figure>");
            assert.ok(browser.query("#hero > figure > a"), "Couldn't find hero <figure><a>");
            assert.ok(browser.query("#hero > figure > a > img.logo"), "Couldn't find hero <figure><a><img>");
            assert.ok(browser.query("#form"), "Couldn't find #form");
            // TODO: validate the rest of the form
            assert.ok(browser.query("#demo"), "Couldn't find #demo");
            assert.ok(browser.query("#submit"), "Couldn't find #submit");
            assert.ok(browser.query("#zen-video-error"), "Couldn't find #zen-video-error");
            assert.ok(browser.query("#zen-video-title"), "Couldn't find #zen-video-title");
            assert.ok(browser.query("a#zen-video-title"), "Couldn't find a#zen-video-title");
            assert.ok(browser.query("#player"), "Couldn't find #player");
        });
        it("should not have strange HTML elements", function () {
            // These are more of a sanity check than anything else
            assert.ok(!browser.query("chicken"), "Found unexpected <chicken> element");
            assert.ok(!browser.query("soup"), "Found unexpected <soup> element");
            assert.ok(!browser.query("for"), "Found unexpected <for> element");
            assert.ok(!browser.query("the"), "Found unexpected <the> element");
            assert.ok(!browser.query("code"), "Found unexpected <code> element");
        });
    });
});