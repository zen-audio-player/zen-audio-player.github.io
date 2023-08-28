const path = require("path");
const assert = require("assert");
const puppeteer = require("puppeteer");

const indexHTMLURL = "file://" + path.join(__dirname, "..", "index.html");

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

            // TODO: port

            // assert.equal(browser.query("meta ~ meta").name, "description");

            // assert.equal(browser.query("meta ~ meta").content, "Listen to YouTube videos, without the distracting visuals");
            // assert.equal(browser.query("meta ~ meta ~ meta").name, "author");
            // assert.equal(browser.query("meta ~ meta ~ meta").content, "Shakeel Mohamed");
            // assert.equal(browser.query("meta ~ meta ~ meta ~ meta").name, "viewport");
            // assert.equal(browser.query("meta ~ meta ~ meta ~ meta").content, "width=device-width, initial-scale=1");
            // assert.equal(browser.query("meta ~ meta ~ meta ~ meta ~ meta").name, "google-site-verification");
            // assert.equal(browser.query("meta ~ meta ~ meta ~ meta ~ meta").content, "D3SjNR3tmNYOusESQijh_oH5SGmU9QsAIVwlqizwRBU");
            // assert.equal(browser.query("title").text, "Zen Audio Player");
        });

        // it("should have favicon configured correctly", function () {
        //         var faviconPath = path.join("img", "favicon.ico");
        //         assert.ok(fs.existsSync(faviconPath));
        //         assert.ok(browser.query("link").href.endsWith("img/favicon.ico"));
        //         assert.equal(browser.query("link").type, "image/x-icon");
        //         assert.equal(browser.query("link").rel, "shortcut icon");
        //         assert.ok(browser.query("link ~ link").href.endsWith("img/favicon.ico"));
        //         assert.equal(browser.query("link ~ link").type, "image/x-icon");
        //         assert.equal(browser.query("link ~ link").rel, "icon");
        //     });
        //     it("should have CSS files configured correctly", function () {
        //         var preloadStylesheet = "preload stylesheet";
        //         assert.equal(browser.query("link ~ link ~ link").rel, preloadStylesheet);
        //         assert.ok(browser.query("link ~ link ~ link").href.endsWith("bower_components/primer-css/css/primer.css"));

        //         assert.equal(browser.query("link ~ link ~ link ~ link").rel, preloadStylesheet);
        //         assert.ok(browser.query("link ~ link ~ link ~ link").href.endsWith("bower_components/font-awesome/css/font-awesome.min.css"));

        //         assert.equal(browser.query("link ~ link ~ link ~ link ~ link").rel, preloadStylesheet);
        //         assert.ok(browser.query("link ~ link ~ link ~ link ~ link").href.endsWith("bower_components/plyr/dist/plyr.css"));

        //         assert.equal(browser.query("link ~ link ~ link ~ link ~ link ~ link").rel, preloadStylesheet);
        //         assert.ok(browser.query("link ~ link ~ link ~ link ~ link ~ link").href.endsWith("css/styles.css"));
        //     });
        //     it("should have logo configured correctly", function () {
        //         var imgFolderPath = path.join(__filename, "..", "..", "img") + path.sep;
        //         assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-113.png");
        //         assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-453.png");
        //         assert.ok(fs.existsSync(imgFolderPath) + "zen-audio-player-905.png");
        //         assert.equal(browser.query("header > figure > a").href, "https://zen-audio-player.github.io/");
        //         assert.ok(browser.query("header > figure > a.zen-logo > img.img-100").src.indexOf("img/zen-audio-player-905.png") !== -1);
        //         assert.equal(browser.query("header > figure > a.zen-logo > img.img-100").alt, "Zen Audio Player logo");
        //     });
        //     it("should have expected elements", function () {
        //         assert.ok(browser.query("header"), "Couldn't find header");
        //         assert.ok(browser.query("header > figure"), "Couldn't find <header><figure>");
        //         assert.ok(browser.query("header > figure > a"), "Couldn't find <header><figure><a>");
        //         assert.ok(browser.query("header > figure > a.zen-logo > img.img-100"), "Couldn't find <header><figure><a><img>");
        //         assert.ok(browser.query("#form"), "Couldn't find #form");
        //         // TODO: validate the rest of the form
        //         assert.ok(browser.query("#demo"), "Couldn't find #demo");
        //         assert.ok(browser.query("#submit"), "Couldn't find #submit");
        //         assert.ok(browser.query("#zen-error"), "Couldn't find #zen-error");
        //         assert.ok(browser.query("#zen-video-title"), "Couldn't find #zen-video-title");
        //         assert.ok(browser.query("h3 > a#zen-video-title"), "Couldn't find a h3 > a#zen-video-title");
        //         assert.ok(browser.query("#audioplayer"), "Couldn't find #audioplayer");
        //         assert.ok(browser.query("#audioplayer > div.plyr"), "Couldn't find #audioplayer > div.plyr");

        //         assert.ok(browser.query("footer"), "Couldn't find footer");
        //         assert.ok(browser.query("footer > div.color-grey > p"), "Couldn't find footer > div.color-grey <p>Created by");
        //         assert.ok(browser.query("footer > div.color-grey > p ~ p"), "Couldn't find footer > div.color-grey<p>Created by...</p><p>");
        //         assert.ok(browser.query("footer > div.repo-info > p"), "Couldn't find footer > div.repo-info<p>Source available on GitHub...</p><p>");
        //     });
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