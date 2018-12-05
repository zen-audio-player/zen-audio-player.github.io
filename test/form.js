const nock = require("nock");
var path = require("path");
var Browser = require("zombie");

require("../js/everything");

const browser = new Browser();
var youTubeDataApiKey = "AIzaSyCxVxsC5k46b8I-CLXlF3cZHjpiqP_myVk";
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

    it("should return at most 5 videos with valid search", function (done) {
        nock("https://www.googleapis.com")
            .persist()
            .get("/youtube/v3/channels")
            .query({ id: "UCtinbF-Q-fVthA0qrFQTgXQ", part: "snippet", key: youTubeDataApiKey })
            .reply(200, {
                "kind": "channel",
                "message": "nock intercepted",
            });

        browser.visit("https://www.googleapis.com/youtube/v3/channels");
        done();
        // browser.assert.text("#zen-error", "");
        // browser.fill("#v", "valid search");
        // browser.pressButton("#submit", function() {
        //     browser.assert.elements("#search-result");
        //     done();
        // });
    });
});

describe("printResults", function() {
    it("should error when there are no results", function() {
        let data;
        data.pageInfo.totalResults = 0;

        PrintResults(data);
        browser.assert.text("#zen-error", "ERROR: Skipping video lookup request as we're running the site locally.");
    });
});