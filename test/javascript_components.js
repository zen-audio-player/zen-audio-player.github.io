const path = require("path");
const assert = require("assert");
const puppeteer = require("puppeteer");

const indexHTMLURL = "file://" + path.join(__dirname, "..", "index.html");
let _js = "";

(async () => {
    before(async function() {
        global.browser = global.browser || await puppeteer.launch();
    });

    describe("JavaScript components", async function() {
        it("should load TrackJS token", async function() {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);
            // var trackjs = browser.evaluate("window._trackJs");
            const trackjs = await page.evaluate(() => {
                return window._trackJs;
            });

            assert.strictEqual(Object.keys(trackjs).length, 1);
            assert.ok(trackjs.token);
            assert.strictEqual(trackjs.token.length, 32);

            const jQuery = await page.evaluate(() => {
                return Object.keys(window).includes("jQuery");
            });
            assert.ok(jQuery);
        });
        it("should load jQuery", async function() {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            const jQuery = await page.evaluate(() => {
                return Object.keys(window).includes("jQuery");
            });
            assert.ok(jQuery);
        });

        // TODO: implement this test! _js is always empty
        it("should make all requests over https, not http", async function() {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            assert.strictEqual(-1, _js.indexOf("http://"), "Please use HTTPS for all scripts");
        });
    });

    after(async () => browser.close());
})();