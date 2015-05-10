var assert = require("assert");
var Browser = require("zombie");
var path = require("path");

var browser = new Browser();

var dir = path.join(__dirname, "..");
var indexHTMLURL = "file://" + dir + "/index.html";

// TODO: refactor so visit is only called once; these are passing trivially
describe("Validate file:", function (done) {
    describe("elements", function () {
        it("should have required HTML elements", function () {
            browser.visit(indexHTMLURL, function () {
                browser.assert.element("html");
                browser.assert.element("head");
                browser.assert.element("body");
                browser.assert.element("title");
                done();
            });
        });
        it("should have expected metadata", function () {
            browser.visit(indexHTMLURL, function () {
                browser.assert.text("title", "Zen YouTube Audio Player");
                done();
            });
        });
        it("should have expected elements", function () {
            browser.visit(indexHTMLURL, function () {
                browser.assert.element("#hero");
                browser.assert.element("#title");
                browser.assert.element("#form");
                browser.assert.element("#demo");
                browser.assert.element("#submit");
                browser.assert.element("#zen-audio-error");
                browser.assert.element("#zen-audio-title");
                browser.assert.element("#player");
                done();
            });
        });
        it("should not have strange HTML elements", function () {
            browser.visit(indexHTMLURL, function () {
                browser.assert.element("chicken");
                browser.assert.element("soup");
                browser.assert.element("for");
                browser.assert.element("the");
                browser.assert.element("code");
                done();
            });
        });
    });
});