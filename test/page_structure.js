const fs = require("fs");
const path = require("path");
const assert = require("assert");
const puppeteer = require("puppeteer");

const indexHTMLURL = "file://" + path.join(__dirname, "..", "index.html");

async function getProperty(page, selector, property) {
    return await (await (await page.waitForSelector(selector)).getProperty(property)).jsonValue();
}

(async () => {
    before(async function() {
        global.browser = global.browser || await puppeteer.launch();
    });

    describe("Page Structure", async function() {
        it("should have required HTML elements", async function() {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            assert.ok(await page.waitForSelector("html"), "Couldn't find <html>, wow!");
            assert.ok(await page.waitForSelector("head"), "Couldn't find <head>, wow!");
            assert.ok(await page.waitForSelector("body"), "Couldn't find <body>, wow!");
            assert.ok(await page.waitForSelector("title"), "Couldn't find <title>, wow!");
        });
        it("should have expected metadata", async function () {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            assert.equal(page.url(), indexHTMLURL);

            assert.equal(await getProperty(page, "meta ~ meta", "name"), "description");
            assert.equal(await getProperty(page, "meta ~ meta", "content"), "Listen to YouTube videos, without the distracting visuals");

            assert.equal(await getProperty(page, "meta ~ meta ~ meta", "name"), "author");
            assert.equal(await getProperty(page, "meta ~ meta ~ meta", "content"), "Shakeel Mohamed");

            assert.equal(await getProperty(page, "meta ~ meta ~ meta ~ meta", "name"), "viewport");
            assert.equal(await getProperty(page, "meta ~ meta ~ meta ~ meta", "content"), "width=device-width, initial-scale=1");

            assert.equal(await getProperty(page, "meta ~ meta ~ meta ~ meta ~ meta", "name"), "google-site-verification");
            assert.equal(await getProperty(page, "meta ~ meta ~ meta ~ meta ~ meta", "content"), "D3SjNR3tmNYOusESQijh_oH5SGmU9QsAIVwlqizwRBU");

            assert.equal(await getProperty(page, "title", "text"), "Zen Audio Player");
        });

        it("should have favicon configured correctly", async function () {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            const faviconPath = path.join("img", "favicon.ico");
            assert.ok(fs.existsSync(faviconPath));

            assert.ok((await getProperty(page, "link", "href")).endsWith("img/favicon.ico"));
            assert.equal(await getProperty(page, "link", "type"), "image/x-icon");
            assert.equal(await getProperty(page, "link", "rel"), "shortcut icon");

            assert.ok((await getProperty(page, "link ~ link", "href")).endsWith("img/favicon.ico"));
            assert.equal(await getProperty(page, "link ~ link", "type"), "image/x-icon");
            assert.equal(await getProperty(page, "link ~ link", "rel"), "icon");
        });
        it("should have CSS files configured correctly", async function () {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            const preloadStylesheet = "preload stylesheet";

            assert.equal(await getProperty(page, "link ~ link ~ link", "rel"), preloadStylesheet);
            assert.ok((await getProperty(page, "link ~ link ~ link", "href")).match("https:\\/\\/unpkg.com\\/primer-css@[~^]?\\d.+\\/css\\/primer.css"));

            assert.equal(await getProperty(page, "link ~ link ~ link ~ link", "rel"), preloadStylesheet);
            assert.ok((await getProperty(page, "link ~ link ~ link ~ link", "href")).match("https:\\/\\/unpkg.com\\/font-awesome@[~^]?\\d.+\\/css\\/font-awesome.min.css"));

            assert.equal(await getProperty(page, "link ~ link ~ link ~ link ~ link", "rel"), preloadStylesheet);
            assert.ok((await getProperty(page, "link ~ link ~ link ~ link ~ link", "href")).match("https:\\/\\/unpkg.com\\/plyr@[~^]?\\d.+\\/dist\\/plyr.css"));

            assert.equal(await getProperty(page, "link ~ link ~ link ~ link ~ link ~ link", "rel"), preloadStylesheet);
            assert.ok((await getProperty(page, "link ~ link ~ link ~ link ~ link ~ link", "href")).endsWith("css/styles.css"));
        });
        it("should have logo configured correctly", async function () {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            const imgFolderPath = path.join(__filename, "..", "..", "img") + path.sep;

            assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-113.png");
            assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-453.png");
            assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-905.png");

            assert.equal(await getProperty(page, "header > figure > a", "href"), "https://zen-audio-player.github.io/");
            assert.ok((await getProperty(page, "header > figure > a.zen-logo > img.img-100", "src")).indexOf("img/zen-audio-player-905.png") !== -1);
            assert.equal(await getProperty(page, "header > figure > a.zen-logo > img.img-100", "alt"), "Zen Audio Player logo");
        });
        it("should have expected elements", async function () {
            const page = await browser.newPage();
            await page.goto(indexHTMLURL);

            assert.ok(page.$("header"), "Couldn't find header");
            assert.ok(page.$("header > figure"), "Couldn't find <header><figure>");
            assert.ok(page.$("header > figure > a"), "Couldn't find <header><figure><a>");
            assert.ok(page.$("header > figure > a.zen-logo > img.img-100"), "Couldn't find <header><figure><a><img>");
            assert.ok(page.$("#form"), "Couldn't find #form");

            // TODO: validate the rest of the form
            assert.ok(page.$("#demo"), "Couldn't find #demo");
            assert.ok(page.$("#submit"), "Couldn't find #submit");
            assert.ok(page.$("#zen-error"), "Couldn't find #zen-error");
            assert.ok(page.$("#zen-video-title"), "Couldn't find #zen-video-title");
            assert.ok(page.$("h3 > a#zen-video-title"), "Couldn't find a h3 > a#zen-video-title");
            assert.ok(page.$("#audioplayer"), "Couldn't find #audioplayer");
            assert.ok(page.$("#audioplayer > div.plyr"), "Couldn't find #audioplayer > div.plyr");

            assert.ok(page.$("footer"), "Couldn't find footer");
            assert.ok(page.$("footer > div.color-grey > p"), "Couldn't find footer > div.color-grey <p>Created by");
            assert.ok(page.$("footer > div.color-grey > p ~ p"), "Couldn't find footer > div.color-grey<p>Created by...</p><p>");
            assert.ok(page.$("footer > div.repo-info > p"), "Couldn't find footer > div.repo-info<p>Source available on GitHub...</p><p>");
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
        });
    });

    after(async () => browser.close());
})();
