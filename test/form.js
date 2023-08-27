const path = require("path");
const assert = require("assert");
const puppeteer = require("puppeteer");

const indexHTMLURL = "file://" + path.join(__dirname, "..", "index.html");

(async () => {
    before(async function() {
        global.browser = await puppeteer.launch();
    });

    describe("hehe", async function() {
        it("hi", async function() {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            const zenError = await page.waitForSelector("#zen-error");
            let errorValue = await zenError.evaluate(el => el.textContent);
            assert.equal(errorValue, "");

            await page.type("#v", "absolute rubbish");
            await page.click("#submit");

            errorValue = await zenError.evaluate(el => el.textContent);
            assert.equal(errorValue, "ERROR: Skipping video lookup request as we're running the site locally.");
        });
    });

    after(async () => browser.close());
})();