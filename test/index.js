var assert = require("assert");
var Browser = require("zombie");
var path = require("path");
var fs = require("fs");
var path = require("path");

const browser = new Browser();

var indexHTMLURL = "file://" + path.join(__dirname, "..", "index.html");

/** Utilities **/
function getParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

describe("Splash Page", function () {
    it("should have required HTML elements", function (done) {
        browser.visit(indexHTMLURL, function (e) {
            assert.ok(browser.query("html"), "Couldn't find <html>, wow!");
            assert.ok(browser.query("head"), "Couldn't find <head>, wow!");
            assert.ok(browser.query("body"), "Couldn't find <body>, wow!");
            assert.ok(browser.query("title"), "Couldn't find <title>, wow!");
            done();
        });
    });
    it("should have expected metadata", function () {
        assert.equal(browser.url, indexHTMLURL);
        assert.equal(browser.query("meta ~ meta").name, "description");
        assert.equal(browser.query("meta ~ meta").content, "Listen to YouTube videos, without the distracting visuals");
        assert.equal(browser.query("meta ~ meta ~ meta").name, "author");
        assert.equal(browser.query("meta ~ meta ~ meta").content, "Shakeel Mohamed");
        assert.equal(browser.query("meta ~ meta ~ meta ~ meta").name, "viewport");
        assert.equal(browser.query("meta ~ meta ~ meta ~ meta").content, "width=device-width, initial-scale=1");
        assert.equal(browser.query("meta ~ meta ~ meta ~ meta ~ meta").name, "google-site-verification");
        assert.equal(browser.query("meta ~ meta ~ meta ~ meta ~ meta").content, "D3SjNR3tmNYOusESQijh_oH5SGmU9QsAIVwlqizwRBU");
        assert.equal(browser.query("title").text, "Zen Audio Player");
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
        assert.equal(browser.query("link ~ link ~ link").href, "bower_components/primer-css/css/primer.css");

        assert.equal(browser.query("link ~ link ~ link ~ link").rel, "stylesheet");
        assert.equal(browser.query("link ~ link ~ link ~ link").href, "bower_components/font-awesome/css/font-awesome.min.css");

        assert.equal(browser.query("link ~ link ~ link ~ link ~ link").rel, "stylesheet");
        assert.equal(browser.query("link ~ link ~ link ~ link ~ link").href, "bower_components/seiyria-bootstrap-slider/dist/css/bootstrap-slider.min.css");

        assert.equal(browser.query("link ~ link ~ link ~ link ~ link ~ link").rel, "stylesheet");
        assert.equal(browser.query("link ~ link ~ link ~ link ~ link ~ link").href, "css/styles.css");
    });
    // TODO: validate JS files, might have some funky action w/ the YouTube iFrame API though
    it("should have logo configured correctly", function () {
        var imgFolderPath = path.join(__filename, "..", "..", "img") + path.sep;
        assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-113.png");
        assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-453.png");
        assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-905.png");
        assert.equal(browser.query("header > figure > a").href, "https://zen-audio-player.github.io/");
        assert.ok(browser.query("header > figure > a > img.logo").src.indexOf("img/zen-audio-player-905.png") !== -1);
        assert.equal(browser.query("header > figure > a > img.logo").alt, "Zen Audio Player logo");
    });
    it("should have expected elements", function () {
        assert.ok(browser.query("header"), "Couldn't find header");
        assert.ok(browser.query("header > figure"), "Couldn't find <header><figure>");
        assert.ok(browser.query("header > figure > a"), "Couldn't find <header><figure><a>");
        assert.ok(browser.query("header > figure > a > img.logo"), "Couldn't find <header><figure><a><img>");
        assert.ok(browser.query("#form"), "Couldn't find #form");
        // TODO: validate the rest of the form
        assert.ok(browser.query("#demo"), "Couldn't find #demo");
        assert.ok(browser.query("#submit"), "Couldn't find #submit");
        assert.ok(browser.query("#zen-video-error"), "Couldn't find #zen-video-error");
        assert.ok(browser.query("#zen-video-title"), "Couldn't find #zen-video-title");
        assert.ok(browser.query("h3 > a#zen-video-title"), "Couldn't find a h3 > a#zen-video-title");
        assert.ok(browser.query("#player"), "Couldn't find #player");
        assert.ok(browser.query("#v"), "Couldn't find #v");

        assert.ok(browser.query("footer"), "Couldn't find footer");
        assert.ok(browser.query("footer > p"), "Couldn't find footer<p>Created by");
        assert.ok(browser.query("footer > p ~ p"), "Couldn't find footer<p>Created by...</p><p>");
        assert.ok(browser.query("footer > p ~ p ~ p"), "Couldn't find footer<p>Created by...</p><p>Source available...</p><p>");
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

describe("Demo", function () {
    it("should play the demo when demo link is clicked", function (done) {
        var oldUrl = browser.location.href;
        browser.clickLink("#demo", function() {
            // Make sure the URL changed
            assert.notEqual(oldUrl, browser.location.href);
            // Check for demo video ID in the URL
            assert.equal("koJv-j1usoI", getParameterByName(browser.location.search, "v"));
            // Check for demo video ID in the textbox
            assert.equal("koJv-j1usoI", browser.query("#v").value);
            
            // TODO: once upon a time, using browser.evaluate("player") would give meaningful
            //     : info. But there's a race condition where sometimes the player object isn't ready yet...?
            //     : looks like can't rely on global variables.
            browser.assert.element("#player");
            browser.assert.text("#togglePlayer", "Show Player");
            browser.assert.text("#zen-video-error", "");
            done();
        });
    });
});

describe("Form", function () {
    it("should break with nonsense input", function (done) {
        browser.assert.text("#zen-video-error", "");
        browser.fill("#v", "absolute rubbish");
        browser.pressButton("#submit", function() {
            // TODO: add tests for the error message, time, play/pause button, etc
            done();
        });
    });
});