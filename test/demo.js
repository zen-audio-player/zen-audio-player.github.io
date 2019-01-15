var assert = require("assert");
var path = require("path");
var Browser = require("zombie");

const browser = new Browser({
    waitDuration: 29 * 1000
});

var indexHTMLURL = "file://" + path.join(__dirname, "..", "index.html");

/** Utilities **/
// TODO: with refactor into a node module, this can go away!
function getParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"); // eslint-disable-line no-useless-escape
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

describe("Demo", function () {
    before(function(done) {
        browser.visit(indexHTMLURL, function () {
            browser.assert.element(".plyr");
            done();
        });
    });
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