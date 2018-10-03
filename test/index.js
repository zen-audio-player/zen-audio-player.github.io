var assert = require("assert");
var Browser = require("zombie");
var path = require("path");
var fs = require("fs");

var _js = "";

const browser = new Browser();

var indexHTMLURL = "file://" + path.join(__dirname, "..", "index.html");

/** Utilities **/
// TODO: with refactor into a node module, this can go away!
function getParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"); // eslint-disable-line no-useless-escape
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

describe("Page Structure", function () {
    it("should have required HTML elements", function (done) {
        browser.visit(indexHTMLURL, function () {
            // TODO: getting an error from the underlying YouTube embed script from plyr... but only in CI
            // assert.ok(!e);
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
        var faviconPath = path.join("img", "favicon.ico");
        assert.ok(fs.existsSync(faviconPath));
        assert.ok(browser.query("link").href.endsWith("img/favicon.ico"));
        assert.equal(browser.query("link").type, "image/x-icon");
        assert.equal(browser.query("link").rel, "shortcut icon");
        assert.ok(browser.query("link ~ link").href.endsWith("img/favicon.ico"));
        assert.equal(browser.query("link ~ link").type, "image/x-icon");
        assert.equal(browser.query("link ~ link").rel, "icon");
    });
    it("should have CSS files configured correctly", function () {
        assert.equal(browser.query("link ~ link ~ link").rel, "stylesheet");
        assert.ok(browser.query("link ~ link ~ link").href.endsWith("bower_components/primer-css/css/primer.css"));

        assert.equal(browser.query("link ~ link ~ link ~ link").rel, "stylesheet");
        assert.ok(browser.query("link ~ link ~ link ~ link").href.endsWith("bower_components/font-awesome/css/font-awesome.min.css"));

        assert.equal(browser.query("link ~ link ~ link ~ link ~ link").rel, "stylesheet");
        assert.ok(browser.query("link ~ link ~ link ~ link ~ link").href.endsWith("bower_components/plyr/dist/plyr.css"));

        assert.equal(browser.query("link ~ link ~ link ~ link ~ link ~ link").rel, "stylesheet");
        assert.ok(browser.query("link ~ link ~ link ~ link ~ link ~ link").href.endsWith("css/styles.css"));
    });
    it("should have logo configured correctly", function () {
        var imgFolderPath = path.join(__filename, "..", "..", "img") + path.sep;
        assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-113.png");
        assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-453.png");
        assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-905.png");
        assert.equal(browser.query("header > figure > a").href, "https://zenplayer.audio/");
        assert.ok(browser.query("header > figure > a.zen-logo > img.img-100").src.indexOf("img/zen-audio-player-905.png") !== -1);
        assert.equal(browser.query("header > figure > a.zen-logo > img.img-100").alt, "Zen Audio Player logo");
    });
    it("should have expected elements", function () {
        assert.ok(browser.query("header"), "Couldn't find header");
        assert.ok(browser.query("header > figure"), "Couldn't find <header><figure>");
        assert.ok(browser.query("header > figure > a"), "Couldn't find <header><figure><a>");
        assert.ok(browser.query("header > figure > a.zen-logo > img.img-100"), "Couldn't find <header><figure><a><img>");
        assert.ok(browser.query("#form"), "Couldn't find #form");
        // TODO: validate the rest of the form
        assert.ok(browser.query("#demo"), "Couldn't find #demo");
        assert.ok(browser.query("#submit"), "Couldn't find #submit");
        assert.ok(browser.query("#zen-error"), "Couldn't find #zen-error");
        assert.ok(browser.query("#zen-video-title"), "Couldn't find #zen-video-title");
        assert.ok(browser.query("h3 > a#zen-video-title"), "Couldn't find a h3 > a#zen-video-title");
        assert.ok(browser.query("#audioplayer"), "Couldn't find #audioplayer");
        assert.ok(browser.query("#audioplayer > div.plyr"), "Couldn't find #audioplayer > div.plyr");

        assert.ok(browser.query("footer"), "Couldn't find footer");
        assert.ok(browser.query("footer > div.color-grey > p"), "Couldn't find footer > div.color-grey <p>Created by");
        assert.ok(browser.query("footer > div.color-grey > p ~ p"), "Couldn't find footer > div.color-grey<p>Created by...</p><p>");
        assert.ok(browser.query("footer > div.color-grey > p ~ p ~ p"), "Couldn't find footer > div.color-grey<p>Created by...</p><p>Source available...</p><p>");
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

describe("JavaScript components", function() {
    before(function () {
        _js = fs.readFileSync(path.join(__dirname, "../js", "everything.js"), "utf8");
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

describe("Demo", function () {
    it("should play the demo when demo button is clicked", function (done) {
        var oldUrl = browser.location.href;
        browser.click("#demo", function() {
            // Make sure the URL changed
            assert.notEqual(oldUrl, browser.location.href);
            // Check for any of the demo videos ID in the URL
            var demos = [
                "koJv-j1usoI", // The Glitch Mob - Starve the Ego, Feed the Soul
                "EBerFisqduk", // Cazzette - Together (Lost Kings Remix)
                "jxKjOOR9sPU", // The Temper Trap - Sweet Disposition
                "03O2yKUgrKw"  // Mike Mago & Dragonette - Outlines
            ];
            assert.notEqual(demos.indexOf(getParameterByName(browser.location.search, "v")), -1);
            // Check for any of the demo videos ID in the textbox
            assert.notEqual(demos.indexOf(browser.query("#v").value), -1);

            // TODO: once upon a time, using browser.evaluate("player") would give meaningful
            //     : info. But there's a race condition where sometimes the player object isn't ready yet...?
            //     : looks like can't rely on global variables.
            // TODO: How do we inspect the player object (title, etc.)?
            browser.assert.element(".plyr");
            assert.ok(browser.evaluate("window.plyrPlayer"));
            browser.assert.text("#togglePlayer", "Show Player");
            browser.assert.text("#zen-error", "");
            done();
        });
    });
});

describe("Form", function () {
    it("should break with nonsense input", function (done) {
        browser.assert.text("#zen-error", "");
        browser.fill("#v", "absolute rubbish");
        browser.pressButton("#submit", function() {
            // TODO: add tests for the error message, time, play/pause button, etc
            browser.assert.text("#zen-error", "ERROR: Skipping video lookup request as we're running the site locally.");
            done();
        });
    });
});
