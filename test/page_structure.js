const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { chromium } = require("playwright");
const { getPlaywrightConfig } = require("./playwright-config");

const indexHTMLURL = "file://" + path.join(__dirname, "..", "index.html");

async function getProperty(page, selector, property) {
    const element = await page.waitForSelector(selector, { state: "attached", timeout: 5000 });
    switch (property) {
        case "text":
            return await element.textContent();
        case "href":
            return await element.getAttribute("href");
        case "src":
            return await element.getAttribute("src");
        case "alt":
            return await element.getAttribute("alt");
        default:
            return await element.getAttribute(property);
    }
}

before(async function() {
    this.timeout(10000);
    global.browser = global.browser || await chromium.launch(getPlaywrightConfig().launchOptions);
});

describe("Page Structure", async function() {
    it("should have required HTML elements", async function() {
        const page = await browser.newPage();
        await page.goto(indexHTMLURL);

        assert.ok(await page.waitForSelector("html", { state: "attached" }), "Couldn't find <html>, wow!");
        assert.ok(await page.waitForSelector("head", { state: "attached" }), "Couldn't find <head>, wow!");
        assert.ok(await page.waitForSelector("body", { state: "attached" }), "Couldn't find <body>, wow!");
        assert.ok(await page.waitForSelector("title", { state: "attached" }), "Couldn't find <title>, wow!");

        await page.close();
    });
    it("should have expected metadata", async function () {
        this.timeout(8000);
        const page = await browser.newPage();
        await page.goto(indexHTMLURL, { waitUntil: "domcontentloaded" });

        assert.equal(page.url(), indexHTMLURL);

        // Use more specific selectors instead of fragile sibling selectors
        const metas = await page.$$("meta");
        let foundDescription = false, foundAuthor = false, foundViewport = false, foundGoogleVerification = false;

        for (const meta of metas) {
            const nameValue = await meta.getAttribute("name");
            const contentValue = await meta.getAttribute("content");

            if (nameValue === "description" && contentValue === "Listen to YouTube videos, without the distracting visuals") {
                foundDescription = true;
            }
            if (nameValue === "author" && contentValue === "Shakeel Mohamed") {
                foundAuthor = true;
            }
            if (nameValue === "viewport" && contentValue === "width=device-width, initial-scale=1") {
                foundViewport = true;
            }
            if (nameValue === "google-site-verification" && contentValue === "D3SjNR3tmNYOusESQijh_oH5SGmU9QsAIVwlqizwRBU") {
                foundGoogleVerification = true;
            }
        }

        assert.ok(foundDescription, "Description meta tag not found");
        assert.ok(foundAuthor, "Author meta tag not found");
        assert.ok(foundViewport, "Viewport meta tag not found");
        assert.ok(foundGoogleVerification, "Google site verification meta tag not found");

        assert.equal(await getProperty(page, "title", "text"), "Zen Audio Player");

        await page.close();
    });

    it("should have favicon configured correctly", async function () {
        this.timeout(8000);
        const page = await browser.newPage();
        await page.goto(indexHTMLURL, { waitUntil: "domcontentloaded" });

        const faviconPath = path.join("img", "favicon.ico");
        assert.ok(fs.existsSync(faviconPath));

        // Find all link elements and check for favicon configurations
        const links = await page.$$("link");
        let foundShortcutIcon = false, foundIcon = false;

        for (const link of links) {
            const relValue = await link.getAttribute("rel");
            const hrefValue = await link.getAttribute("href");
            const typeValue = await link.getAttribute("type");

            if (relValue === "shortcut icon" && hrefValue.includes("img/favicon.ico") && typeValue === "image/x-icon") {
                foundShortcutIcon = true;
            }
            if (relValue === "icon" && hrefValue.includes("img/favicon.ico") && typeValue === "image/x-icon") {
                foundIcon = true;
            }
        }

        assert.ok(foundShortcutIcon, "Shortcut icon link not found");
        assert.ok(foundIcon, "Icon link not found");

        await page.close();
    });
    it("should have CSS files configured correctly", async function () {
        this.timeout(8000);
        const page = await browser.newPage();
        await page.goto(indexHTMLURL, { waitUntil: "domcontentloaded" });

        const preloadStylesheet = "preload stylesheet";

        // Find all link elements and check for CSS configurations
        const links = await page.$$("link");
        let foundPrimerCSS = false, foundFontAwesome = false, foundLocalCSS = false;

        for (const link of links) {
            const relValue = await link.getAttribute("rel");
            const hrefValue = await link.getAttribute("href");

            if (relValue === preloadStylesheet && hrefValue.match(/https:\/\/unpkg\.com\/primer-css@[~^]?\d.+\/(css\/primer\.css|build\/build\.css)/)) {
                foundPrimerCSS = true;
            }
            if (relValue === preloadStylesheet && hrefValue.match(/https:\/\/unpkg\.com\/font-awesome@[~^]?\d.+\/css\/font-awesome\.min\.css/)) {
                foundFontAwesome = true;
            }
            if (relValue === preloadStylesheet && hrefValue.endsWith("css/styles.css")) {
                foundLocalCSS = true;
            }
        }

        assert.ok(foundPrimerCSS, "Primer CSS stylesheet not found");
        assert.ok(foundFontAwesome, "Font Awesome stylesheet not found");
        assert.ok(foundLocalCSS, "Local CSS stylesheet not found");

        await page.close();
    });
    it("should have logo configured correctly", async function () {
        this.timeout(8000);
        const page = await browser.newPage();
        await page.goto(indexHTMLURL, { waitUntil: "domcontentloaded" });

        const imgFolderPath = path.join(__filename, "..", "..", "img") + path.sep;

        assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-113.png");
        assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-453.png");
        assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-905.png");

        assert.equal(await getProperty(page, "header > figure > a", "href"), "/");
        assert.ok((await getProperty(page, "header > figure > a.zen-logo > img.img-100", "src")).indexOf("img/zen-audio-player-905.png") !== -1);
        assert.equal(await getProperty(page, "header > figure > a.zen-logo > img.img-100", "alt"), "Zen Audio Player logo");

        await page.close();
    });
    it("should have expected elements", async function () {
        const page = await browser.newPage();
        await page.goto(indexHTMLURL);

        assert.ok(await page.$("header"), "Couldn't find header");
        assert.ok(await page.$("header > figure"), "Couldn't find <header><figure>");
        assert.ok(await page.$("header > figure > a"), "Couldn't find <header><figure><a>");
        assert.ok(await page.$("header > figure > a.zen-logo > img.img-100"), "Couldn't find <header><figure><a><img>");
        assert.ok(await page.$(".search-form"), "Couldn't find .search-form");

        // Validate form structure and elements
        assert.ok(await page.$(".search-input"), "Couldn't find .search-input");
        assert.ok(await page.$(".search-submit"), "Couldn't find .search-submit");
        assert.ok(await page.$(".error-message"), "Couldn't find .error-message element");

        // Validate warning message presence and base styling
        const warningMessage = await page.$(".warning-message");
        assert.ok(warningMessage, "Couldn't find .warning-message element");

        const warningClassName = await getProperty(page, ".warning-message", "class");
        assert.ok(
            warningClassName && warningClassName.includes("warning-message"),
            "Warning message should have the .warning-message class"
        );
        assert.ok(
            warningClassName.includes("flash"),
            "Warning message should use the base flash styling class"
        );
        assert.ok(
            warningClassName.includes("flash-warn"),
            "Warning message should use the warning flash styling class"
        );
        
        // Validate form attributes
        const input = await page.$(".search-input");
        assert.equal(await getProperty(page, ".search-input", "name"), "v", "Input field should have name='v'");
        assert.equal(await getProperty(page, ".search-input", "type"), "text", "Input field should be type='text'");
        assert.ok((await getProperty(page, ".search-input", "placeholder") || "").includes("Search"), "Input should have search placeholder");

        // Validate submit button
        assert.ok(await page.$(".search-submit"), "Couldn't find .search-submit");
        // Submit button may not have type attribute (that's acceptable)

        // Validate error element styling
        const errorElement = await page.$(".error-message");
        assert.ok(errorElement, "Error element should exist");
        assert.ok((await errorElement.getAttribute("class") || "").includes("flash"), "Error element should have flash class");
        assert.ok((await errorElement.getAttribute("class") || "").includes("flash-error"), "Error element should have flash-error class");

        assert.ok(await page.$(".demo-button"), "Couldn't find .demo-button");
        assert.ok(await page.$(".search-submit"), "Couldn't find .search-submit");
        assert.ok(await page.$(".error-message"), "Couldn't find .error-message");
        assert.ok(await page.$(".video-title"), "Couldn't find .video-title");
        assert.ok(await page.$("h3 > a.video-title"), "Couldn't find a h3 > a.video-title");
        assert.ok(await page.$(".audio-player"), "Couldn't find .audio-player");
        assert.ok(await page.$(".audio-player video-player"), "Couldn't find video-player element under .audio-player");

        assert.ok(await page.$("footer"), "Couldn't find footer");
        assert.ok(await page.$("footer > div.color-grey > p"), "Couldn't find footer > div.color-grey <p>Created by");
        assert.ok(await page.$("footer > div.color-grey > p ~ p"), "Couldn't find footer > div.color-grey<p>Created by...</p><p>");
        assert.ok(await page.$("footer > div.repo-info > p"), "Couldn't find footer > div.repo-info<p>Source available on GitHub...</p><p>");

        await page.close();
    });
    it("should not have strange HTML elements", async function () {
        const page = await browser.newPage();
        await page.goto(indexHTMLURL);

        // These are more of a sanity check than anything else
        assert.ok(! await page.$("chicken"), "Found unexpected <chicken> element");
        assert.ok(! await page.$("soup"), "Found unexpected <soup> element");
        assert.ok(! await page.$("for"), "Found unexpected <for> element");
        assert.ok(! await page.$("the"), "Found unexpected <the> element");
        assert.ok(! await page.$("code"), "Found unexpected <code> element");

        await page.close();
    });
});

after(async () => {
    if (browser) {
        await browser.close();
    }
});
