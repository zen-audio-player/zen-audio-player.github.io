var path = require("path");
var Browser = require("zombie");


const browser = new Browser();
var indexHTMLURL = "file://" + path.join(__dirname, "..", "index.html");

describe("Form", function () {
    before(function(done) {
        browser.visit(indexHTMLURL, function () {
            done();
        });
    });
    it("should error when running locally", function (done) {
        browser.assert.text("#zen-error", "");
        browser.fill("#v", "absolute rubbish");
        browser.pressButton("#submit", function() {
            browser.assert.text("#zen-error", "ERROR: Skipping video lookup request as we're running the site locally.");
            done();
        });
    });
});