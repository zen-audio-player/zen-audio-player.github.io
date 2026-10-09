const path = require("path");
const assert = require("assert");
const { chromium } = require("playwright");
const http = require("http-server");
const { getPlaywrightConfig } = require("./playwright-config");

const SERVER_PORT = 8000;
const TEST_TIMEOUT = process.env.CI ? 15000 : 10000;
const indexHTMLURL = `http://localhost:${SERVER_PORT}/index.html`;
let server;

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

before(async function() {
    this.timeout(TEST_TIMEOUT);
    server = http.createServer({root: path.join(__dirname, "..")});
    await new Promise((resolve, reject) => {
        server.listen(SERVER_PORT, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
    global.browser = global.browser || await chromium.launch(getPlaywrightConfig().launchOptions);
});

describe("Demo", async function() {
    // set timeout for this test
    this.timeout(TEST_TIMEOUT);

    it("should play demo when demo button is clicked", async function() {
        const page = await browser.newPage();
        await page.goto(indexHTMLURL);

        const plyrLoaded = await page.waitForSelector("video-player", { state: "attached", timeout: 8000 });
        assert.ok(plyrLoaded);

        const oldUrl = page.url();
        await page.click(".demo-button");

        // Wait a moment for navigation
        await page.waitForTimeout(2000);

        // Make sure URL changed
        assert.notEqual(oldUrl, page.url());

        // Check for any of the demo videos ID in the URL
        const videoId = getParameterByName(page.url(), "v");
        assert.notEqual(demos.indexOf(videoId), -1);

        // Check for any of the demo videos ID in the textbox
        const textBox = await page.waitForSelector(".search-input", { state: "attached", timeout: 5000 });
        let textBoxValue = await textBox.inputValue();
        assert.notEqual(demos.indexOf(textBoxValue), -1);

        // TODO: once upon a time, using browser.evaluate("player") would give meaningful
        //     : info. But there's a race condition where sometimes the player object isn't ready yet...?
        //     : looks like can't rely on global variables.
        // TODO: How do we inspect the player object (title, etc.)?

        const plyPlayer = await page.evaluate(() => {
            return window.videoPlayer;
        });
        assert.ok(plyPlayer);

        const toggleButton = await page.waitForSelector(".toggle-player-btn", { state: "attached", timeout: 5000 });
        let toggleButtonText = await toggleButton.textContent();
        assert.equal(toggleButtonText.trim(), "Show Player");

        const zenError = await page.waitForSelector(".error-message", { state: "attached", timeout: 5000 });
        let zenErrorText = await zenError.textContent();
        const expectedErrors = [
            "ERROR: the video owner won't allow us to play that video",
            "ERROR: we can't play that video here, or something is wrong with YouTube's iframe API"
        ];
        assert.ok(zenErrorText === "" || expectedErrors.indexOf(zenErrorText) !== -1, zenErrorText);

        await page.close();
    });
});

after(async () => {
    if (server) {
        await server.close();
    }
    if (global.browser) {
        await browser.close();
    }
});