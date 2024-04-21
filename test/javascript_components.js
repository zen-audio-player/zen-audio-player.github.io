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

            const j = await page.evaluate(() => {
                return Object.keys(window).includes("jQuery");
            });
            assert.ok(j);
        });

        it("should load DOMPurify and sanitize", async function() {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            const dp = await page.evaluate(() => {
                return Object.keys(window).includes("DOMPurify");
            });
            assert.ok(dp, "DOMPurify should be loaded on the page.");

            const sanitizedOutput = await page.evaluate(() => {
                const dirty = "<img src=\"x\" onerror=\"alert(1)\">";
                return window.DOMPurify.sanitize(dirty);
            });
            assert.strictEqual(sanitizedOutput, "<img src=\"x\">", "DOMPurify should sanitize malicious scripts correctly.");
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