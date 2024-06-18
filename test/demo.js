const path = require("path");
const assert = require("assert");
const puppeteer = require("puppeteer");
const http = require("http-server");

const indexHTMLURL = "http://localhost:8000/index.html";


/** Utilities **/
// TODO: with refactor into a node module, this can go away!
function getParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"); // eslint-disable-line no-useless-escape
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

const demos = [
    "koJv-j1usoI", // The Glitch Mob - Starve the Ego, Feed the Soul
    "EBerFisqduk", // Cazzette - Together (Lost Kings Remix)
    "jxKjOOR9sPU", // The Temper Trap - Sweet Disposition
    "03O2yKUgrKw"  // Mike Mago & Dragonette - Outlines
];

let server;
(async () => {
    before(async function() {
        server = http.createServer({root: path.join(__dirname, "..")});
        server.listen(8000);
        global.browser = global.browser || await puppeteer.launch();
    });

    describe("Demo", async function() {
        it("should play the demo when demo button is clicked", async function() {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            const plyrLoaded = await page.waitForSelector(".plyr");
            assert.ok(plyrLoaded);

            const oldUrl = page.url();
            await page.click("#demo");

            // Make sure the URL changed
            assert.notEqual(oldUrl, page.url());

            // Check for any of the demo videos ID in the URL
            assert.notEqual(demos.indexOf(getParameterByName(page.url(), "v")), -1);

            // Check for any of the demo videos ID in the textbox
            const textBox = await page.waitForSelector("#v");
            let textBoxValue = await textBox.evaluate(el => el.value);
            assert.notEqual(demos.indexOf(textBoxValue), -1);

            // TODO: once upon a time, using browser.evaluate("player") would give meaningful
            //     : info. But there's a race condition where sometimes the player object isn't ready yet...?
            //     : looks like can't rely on global variables.
            // TODO: How do we inspect the player object (title, etc.)?

            const plyPlayer = await page.evaluate(() => {
                return window.plyrPlayer;
            });
            assert.ok(plyPlayer);

            const toggleButton = await page.waitForSelector("#togglePlayer");
            let toggleButtonText = await toggleButton.evaluate(el => el.textContent);
            assert.equal(toggleButtonText.trim(), "Show Player");

            const zenError = await page.waitForSelector("#zen-error");
            let zenErrorText = await zenError.evaluate(el => el.textContent);
            assert.equal(zenErrorText, "");
        });
    });

    after(async () => {
        await server.close();
        await browser.close();
    });
})();