/* global gtag, URI, DOMPurify, getSearchResults, getAutocompleteSuggestions, parseYoutubeVideoID, getYouTubeVideoDescription */

var videoPlayer;
var ytVideo;
var keyCodes = {
    SPACEBAR: 32,
    ENTER: 13
};

var timeIntervals = {
    SECONDS: 60
};

/**
 * YouTube iframe API required setup
 */
var youTubeDataApiKey = "AIzaSyCxVxsC5k46b8I-CLXlF3cZHjpiqP_myVk";
var currentVideoID;

// global playlist, this is populated with an ajax call
var tags = [];
var playList = [];
var autoplayState = false;
const MAX_TAGS = 10;

// Custom properties the neutral skin hardcodes on its internal
// .media-skin element. css/styles.css declares light-theme values
// for these on the host; applySkinTheme() injects a shadow-DOM style
// that makes .media-skin inherit them (the skin's own defaults would
// otherwise win over host inheritance).
const skinInheritVars = [
    "--media-background",
    "--media-foreground",
    "--media-controls",
    "--media-backdrop",
    "--media-ring",
    "--media-control-radius",
    "--media-border",
    "--media-muted",
    "--media-muted-foreground",
    "--media-popover",
    "--media-default-accent-color",
    "--media-default-accent-text-color"
];

var errorMessage = {
    init: function() {},
    show: function(message) {
        $(".error-message").text("ERROR: " + message);
        $(".error-message").show();

        // Pause if we got an error
        ZenPlayer.pause();

        // When the error message is shown, also hide the player
        ZenPlayer.hide();

        // Send the error to Google Analytics
        gtag("send", "event", "error", message);
    },
    hide: function() {
        $(".error-message").text("").hide();
        ZenPlayer.show();
    }
};

var warningMessage = {
    init: function() {},
    show: function(message) {
        $(".warning-message").text("WARNING: " + message).show();

        // Send warning to Google Analytics
        gtag("send", "event", "warning", message);
    },
    hide: function() {
        $(".warning-message").text("").hide();
    }
};

function isFileProtocol() {
    return URI(window.location).protocol() === "file";
}

function isLocalDevelopment() {
    const hostname = (window.location && window.location.hostname) || "";
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function shouldSkipYouTubeDataApi() {
    const searchParams = URI(window.location).search(true);
    const forceApi = searchParams.ytApi === "1";
    if (forceApi) {
        return false;
    }
    return isFileProtocol() || isLocalDevelopment();
}

function handleYouTubeError(details) {
    if (typeof details.code === "number") {
        let message = "Got an unknown error, check the JS console.";
        let verboseMessage = message;

        // Handle the different error codes
        switch (details.code) {
            case 2:
                verboseMessage = "The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.";
                message = "looks like an invalid video ID";
                break;
            case 5:
                verboseMessage = "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.";
                message = "we can't play that video here, or something is wrong with YouTube's iframe API";
                break;
            case 100:
                verboseMessage = "The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.";
                message = "we can't find that video, it might be private or removed";
                break;
            case 101:
                verboseMessage = "The owner of the requested video does not allow it to be played in embedded players.";
                message = "the video owner won't allow us to play that video";
                break;
            case 150:
                verboseMessage = "This error is the same as 101. It's just a 101 error in disguise!";
                message = "the video owner won't allow us to play that video";
                break;
        }

        // Update the UI w/ error
        errorMessage.show(message);
        gtag("send", "event", "YouTube iframe API error", verboseMessage);

        // Log debug info
        console.log("Verbose debug error message: ", verboseMessage);
    }
}

function getPlayerDuration() {
    if (ytVideo && typeof ytVideo.duration === "number" && !isNaN(ytVideo.duration)) {
        return ytVideo.duration;
    }

    return 0;
}

function getPlayerCurrentTime() {
    if (ytVideo && typeof ytVideo.currentTime === "number" && !isNaN(ytVideo.currentTime)) {
        return ytVideo.currentTime;
    }

    return 0;
}

function seekPlayerTo(seconds) {
    if (!ytVideo || typeof seconds !== "number" || isNaN(seconds)) {
        return;
    }

    try {
        ytVideo.currentTime = seconds;
    }
    catch (e) {
        void e;
    }
}

function getPlayerVideoData() {
    return {
        title: ZenPlayer.videoTitle || currentVideoID || "",
        author: ZenPlayer.videoAuthor || ""
    };
}

function getPlayerVideoUrl() {
    if (currentVideoID) {
        return "https://www.youtube.com/watch?v=" + currentVideoID;
    }

    return "https://www.youtube.com";
}

function fetchOEmbedVideoTitle(videoID, onSuccess) {
    if (!videoID || typeof onSuccess !== "function") {
        return;
    }

    $.ajax({
        url: "https://www.youtube.com/oembed",
        dataType: "json",
        data: {
            url: "https://www.youtube.com/watch?v=" + videoID,
            format: "json"
        },
        success: function(data) {
            if (data && data.title && data.title.trim().length > 0) {
                onSuccess(data.title);
            }
        }
    }).fail(function() {
        // Best effort only; keep the engine title when this fails.
    });
}

/**
 * Make the neutral skin inherit the light-theme custom properties
 * declared on the host (css/styles.css). The skin hardcodes a dark
 * theme on its internal .media-skin element, which would otherwise
 * override host inheritance, so we inject a shadow-DOM style that
 * resets those properties to inherit.
 *
 * The same style also fixes the layout of the skin's control bar:
 *
 * - media-controls-backdrop is the skin's gradient scrim. It is sized
 *   to the whole surface and sits at z-index 10, so over the video it
 *   covers the entire frame. It is removed in both modes: the control
 *   bar paints its own opaque --media-controls surface, so the video
 *   gets no gradient at all.
 * - media-controls-content is absolutely positioned over the bottom of
 *   the media. In video mode the bar is taken out of that overlay so it
 *   flows after the media (which is already later in DOM order inside
 *   media-container) and sits beneath the 16:9 video, and the
 *   container stops clipping it. The bar is still the skin's own, not a
 *   second row of controls.
 *
 * These rules are scoped with :host(.video-mode) because the injected
 * style lives in the skin's shadow root, where :host() matches the
 * classes JS toggles on the skin element.
 */
function applySkinTheme(skin) {
    const style = document.createElement("style");
    style.textContent = ".media-skin{" + skinInheritVars.map((name) => name + ":inherit").join(";") + "}"
        + "media-controls-backdrop{display:none}"
        + ":host(.video-mode) media-container{overflow:visible}"
        + ":host(.video-mode) media-controls-content{position:static}";
    skin.shadowRoot.appendChild(style);
}

// One day, try to move all globals under the ZenPlayer object
var ZenPlayer = {
    updated: false,
    isPlaying: false,
    isRepeat: false,

    init: function() {
        const that = this;

        customElements.whenDefined('video-player').then(() => {
            videoPlayer = document.querySelector('video-player');
            if (!videoPlayer) {
                console.log("Video.js player not found; skipping player initialization.");
                return;
            }

            // UI toggles work without video metadata; wire them once
            that.setupPlayerToggle();
            that.setupAutoplayToggle();

            // Wait for the media element to upgrade before touching its API
            customElements.whenDefined('youtube-video').then(() => {
                ytVideo = videoPlayer.querySelector('youtube-video');
                if (!ytVideo) {
                    return;
                }

                // Attach source after upgrade so the `src` accessor is live
                if (currentVideoID) {
                    ytVideo.src = "https://youtu.be/" + currentVideoID;
                }

                ytVideo.addEventListener("error", function() {
                    const err = ytVideo.error;
                    if (err && err.data && typeof err.data.youtubeErrorCode === "number") {
                        handleYouTubeError({ code: err.data.youtubeErrorCode });
                    }
                    else {
                        errorMessage.show("We couldn't start playback. Please try another video or reload the page.");
                    }

                    ZenPlayer.hide();
                });

                // loadedmetadata/loadcomplete fire before YT populates title/duration;
                // the later durationchange carries the real data. Gather when duration is valid.
                ytVideo.addEventListener("durationchange", function() {
                    // Noop if we have nothing to play
                    if (!currentVideoID || currentVideoID.length === 0) {
                        return;
                    }

                    if (!(ytVideo.duration > 0)) {
                        return;
                    }

                    const data = ytVideo.engine.getVideoData() || {};
                    that.videoTitle = data.title || ytVideo.engine.videoTitle || currentVideoID;
                    that.videoAuthor = data.author || "";
                    that.videoDuration = ytVideo.engine.getDuration();
                    that.videoUrl = ytVideo.engine.getVideoUrl();

                    // Updates the time position by a given argument in URL
                    // I.e. https://zenplayer.audio/?v=koJv-j1usoI&t=30 starts at 0:30
                    const t = getCurrentTimePosition();
                    if (t) {
                        that.videoPosition = t;
                        window.sessionStorage[currentVideoID] = t;
                    }

                    that.setupTitle();
                    that.getVideoDescription(currentVideoID);

                    // TODO: was this old behavior? If not, remove
                    // Fall back to oEmbed for the title when the engine
                    // did not provide one (title missing or just the video ID).
                    if (!that.videoTitle || that.videoTitle === currentVideoID) {
                        fetchOEmbedVideoTitle(currentVideoID, function(title) {
                            if (title && title !== that.videoTitle) {
                                that.videoTitle = title;
                                that.setupTitle();
                            }
                        });
                    }

                    // Start playback - YouTube iframe is ready
                    if (autoplayState) {
                        ytVideo.play();
                    }
                });

                ytVideo.addEventListener("playing", function() {
                    that.isPlaying = true;
                    if (that.updated) {
                        return;
                    }

                    const videoDuration = getPlayerDuration();
                    // Start video from where we left off, if it makes sense
                    if (window.sessionStorage && currentVideoID in window.sessionStorage) {
                        const resumeTime = window.sessionStorage[currentVideoID];
                        if (!isNaN(resumeTime) && videoDuration > 0 && resumeTime < videoDuration - 3) {
                            seekPlayerTo(resumeTime);
                        }
                    }

                    that.updated = true;

                    // Analytics
                    gtag("send", "event", "Playing YouTube video title", that.videoTitle);
                    gtag("send", "event", "Playing YouTube video author", that.videoAuthor);
                    gtag("send", "event", "Playing YouTube video duration (seconds)", that.videoDuration);

                    // Show player
                    that.show();
                    updateTweetMessage();
                });

                // when player has finished playing
                ytVideo.addEventListener("ended", function() {
                    if (that.isRepeat) {
                        seekPlayerTo(0);
                        ZenPlayer.play();
                        return;
                    }

                    if (autoplayState) {
                        if (playList.length === 0) {
                            fetchSuggestedVideoIds();
                        }
                        const newId = getNewVideoID();
                        that.playNext(newId);
                    }
                });

                ytVideo.addEventListener("timeupdate", function() {
                    // Store the current time of the video.
                    let resumeTime = 0;
                    const videoDuration = getPlayerDuration();
                    if (window.sessionStorage && videoDuration > 0) {
                        const currentTime = getPlayerCurrentTime();
                        /**
                         * Only store the current time if the video isn't done
                         * playing yet. If the video finished already, then it
                         * should start off at the beginning next time.
                         * There is a fuzzy 3 seconds because sometimes the video
                         * will end a few seconds before the video duration.
                         */
                        if (currentTime < videoDuration - 3) {
                            resumeTime = currentTime;
                        }
                        // check time and if isRepeat == true
                        if (currentTime >= videoDuration && that.isRepeat) {
                            resumeTime = 0;
                            seekPlayerTo(resumeTime);
                            ZenPlayer.play();
                        }
                        window.sessionStorage[currentVideoID] = resumeTime;
                    }
                    const baseUrl = that.videoUrl || getPlayerVideoUrl();
                    const href = resumeTime > 0 ? baseUrl + "&t=" + Math.round(resumeTime) : baseUrl;
                    $(".video-title").attr("href", href);
                });

                ytVideo.addEventListener("pause", function() {
                    that.isPlaying = false;
                });
            });
        });
    },
    // play next song from autoplay
    playNext: function(videoID) {
        $(".search-input").val(videoID);
        $(".search-form").submit();
    },
    show: function() {
        $(".audio-player").show();
        // Hide the demo link as some video is playing
        $(".demo-button").hide();
    },
    hide: function() {
        $(".audio-player").hide();
        // Show the demo link as no video is playing
        $(".demo-button").show();
    },
    setupTitle: function() {
        // Prepend music note only if title does not already begin with one.
        let tmpVideoTitle = this.videoTitle;
        if (!/^[\u2669\u266A\u266B\u266C\u266D\u266E\u266F]/.test(tmpVideoTitle)) {
            tmpVideoTitle = "<i class=\"fa fa-music\"></i> " + tmpVideoTitle;
        }
        $(".video-title").html(DOMPurify.sanitize(tmpVideoTitle));
        $(".video-title").attr("href", this.videoUrl);
    },
    setupVideoDescription: function(videoID) {
        let description = anchorURLs(this.videoDescription);
        description = anchorTimestamps(description, videoID);
        $(".video-description").html(DOMPurify.sanitize(description));
        $(".video-description").hide();

        $(".toggle-description-btn").off("click").on("click", function(event) {
            toggleElement(event, ".video-description", "Description");
        });
    },
    setupPlayerToggle: function() {
        // The neutral skin renders its controls inside shadow DOM,
        // absolutely positioned over the media. Global CSS can reach
        // the skin element and the slotted <youtube-video>, but not
        // the shadow-DOM poster or the control bar's box. So we:
        //  - toggle an "audio-mode" class (CSS hides the video and
        //    collapses the surface),
        //  - poke the shadow DOM to hide the poster,
        //  - hide the skin's control bar entirely in video mode so the
        //    video stays free of its gradient backdrop,
        //  - keep the control bar always visible in audio mode via the
        //    controls element's public "visibility" attribute, and
        //  - match the collapsed height to the control bar so the
        //    bar is never clipped (the bar wraps to multiple rows
        //    on narrow viewports, so its height is dynamic).
        const skin = document.querySelector("video-neutral-skin");
        let resizeObserver = null;

        const setControlsAlwaysVisible = () => {
            if (!skin || !skin.shadowRoot) {
                return;
            }
            const controls = skin.shadowRoot.querySelector("media-controls");
            if (controls) {
                controls.setAttribute("visibility", "always");
            }
        };

        const getControlsContent = () => {
            return skin && skin.shadowRoot ?
                skin.shadowRoot.querySelector("media-controls-content") : null;
        };

        const matchControlsHeight = () => {
            const content = getControlsContent();
            if (!content) {
                return;
            }
            const height = content.getBoundingClientRect().height;
            if (height > 0) {
                skin.style.height = height + "px";
            }
        };

        const setAudioMode = (audioMode) => {
            if (!skin) {
                return;
            }
            skin.classList.toggle("audio-mode", audioMode);
            if (skin.shadowRoot) {
                const poster = skin.shadowRoot.querySelector("media-poster");
                if (poster) {
                    poster.style.display = audioMode ? "none" : "";
                }

                skin.classList.toggle("video-mode", !audioMode);
            }
            if (audioMode) {
                setControlsAlwaysVisible();
                matchControlsHeight();
                const content = getControlsContent();
                if (content && !resizeObserver) {
                    resizeObserver = new ResizeObserver(() => {
                        if (skin.classList.contains("audio-mode")) {
                            matchControlsHeight();
                        }
                    });
                    resizeObserver.observe(content);
                }
            }
            else {
                skin.style.height = "";
            }
        };

        const init = () => {
            if (!skin || !skin.shadowRoot) {
                customElements.whenDefined("video-neutral-skin").then(() => {
                    Promise.resolve().then(init);
                });
                return;
            }
            setControlsAlwaysVisible();
            applySkinTheme(skin);
            // Start collapsed (audio-only) until "Show Player" is clicked.
            setAudioMode(true);
        };
        init();

        $(".toggle-player-btn").off("click").on("click", function(event) {
            event.preventDefault();
            const target = document.querySelector("video-neutral-skin");
            const audioMode = !target.classList.contains("audio-mode");
            setAudioMode(audioMode);
            $(event.currentTarget).text(audioMode ? "Show Player" : "Hide Player");
        });
    },
    setupAutoplayToggle: function() {
        // toggle auto next song playing
        $(".toggle-autoplay-btn").off("click").on("click", function(event) {
            const toggleTextElement = $(event.currentTarget);
            toggleTextElement.toggleClass("toggle-autoplay-active");
            const active = toggleTextElement.hasClass("toggle-autoplay-active");
            if (active) {
                toggleTextElement.html("&#10004; Autoplay");
                autoplayState = true;
                window.sessionStorage.setItem("autoPlay", true);
            }
            else {
                toggleTextElement.html("Autoplay");
                autoplayState = false;
                window.sessionStorage.removeItem("autoPlay");
                window.sessionStorage.removeItem("playList");
            }
        });
    },

    getVideoDescription: function(videoID) {
        const that = this;

        if (shouldSkipYouTubeDataApi()) {
            console.log("Skipping video description request as we're running the site locally.");
            $(".toggle-description-btn").hide();
            return "";
        }

        getYouTubeVideoDescription(
            videoID,
            youTubeDataApiKey,
            function(data) {
                if (data.items.length === 0) {
                    errorMessage.show("Video description not found");
                    $(".toggle-description-btn").hide();
                    return;
                }
                that.videoDescription = data.items[0].snippet.description;
                tags = data.items[0].snippet.tags;
                that.setupVideoDescription(videoID);
            },
            function(jqXHR, textStatus, errorThrown) {
                logError(jqXHR, textStatus, errorThrown, "Video Description error");
                $(".toggle-description-btn").hide();
            }
        );

        return that.videoDescription || "";
    },
    play: function() {
        if (ytVideo) {
            ytVideo.play();
        }
    },
    pause: function() {
        if (ytVideo) {
            ytVideo.pause();
        }
    }
};

/**
 * Create a twitter message with current song if we have one.
 */
function updateTweetMessage() {
    const url = URI("https://zen-audio-player.github.io");

    const opts = {
        text: "Listen to YouTube videos without the distracting visuals",
        hashTags: "ZenAudioPlayer",
        url: url.toString()
    };

    const id = getCurrentVideoID();
    if (id) {
        url.setSearch("v", id);
        opts.url = url.toString();
        opts.text = "I'm listening to " + getPlayerVideoData().title;
    }

    twttr.widgets.createHashtagButton(
        "ZenAudioPlayer",
        document.querySelector(".tweet-button"),
        opts
    );
}

function logError(jqXHR, textStatus, errorThrown, _errorMessage) {
    let parsedResponse;
    let message = "Something went wrong while contacting YouTube.";

    if (jqXHR && jqXHR.responseJSON) {
        parsedResponse = jqXHR.responseJSON;
    }
    else if (jqXHR && typeof jqXHR.responseText === "string") {
        try {
            parsedResponse = JSON.parse(jqXHR.responseText);
        }
        catch (_parseError) {
            void _parseError;
            parsedResponse = null;
        }
    }

    if (parsedResponse && parsedResponse.error && parsedResponse.error.errors && parsedResponse.error.errors[0] && parsedResponse.error.errors[0].message) {
        message = parsedResponse.error.errors[0].message;
    }
    else if (errorThrown) {
        message = errorThrown;
    }
    else if (textStatus) {
        message = textStatus;
    }

    errorMessage.show(message);
    console.log(_errorMessage, errorThrown);
}

function toggleElement(event, selector, buttonText) {
    event.preventDefault();

    const targetElement = $(selector);
    if (!targetElement.length) {
        return;
    }
    const toggleTextElement = $(event.currentTarget);
    targetElement.toggle("fast", function() {
        toggleTextElement.text((targetElement.is(":visible") ? "Hide " : "Show ") + buttonText);
    });
}

/**
 * wrapParseYouTubeVideoID the first v query value.
 * Will return null if there's no v query param
 * @return {string|null}
 */
function getCurrentVideoID() {
    const v = URI(window.location).search(true).v;

    // If the URL has multiple v parameters, take parsing the last one (usually when ?v=someurl&v=xyz)
    let r;
    if (Array.isArray(v)) {
        r = wrapParseYouTubeVideoID(v.pop());
    }
    else if (v) {
        r = wrapParseYouTubeVideoID(v);
    }
    return r;
}

/**
 * Return the current times position, provided by the t query param, parsed to seconds.
 * @returns {Number}
 */
function getCurrentTimePosition() {
    const t = parseInt(URI(window.location).search(true).t, 10);
    const timeContinue = parseInt(URI(window.location).search(true).time_continue, 10);
    if (t > 0 && t < Number.MAX_VALUE) {
        return t;
    }
    else if (timeContinue > 0 && timeContinue < Number.MAX_VALUE) {
        return timeContinue;
    }
    return 0;
}

/**
 * Return the q query param if one exists.
 * @returns {string|bool|null}
 */
function getCurrentSearchQuery() {
    return URI(window.location).search(true).q;
}

/**
 * Remove any search params or fragments from a URL.
 * @param url
 * @returns {string} The stripped URL
 */
function cleanURL(url) {
    return URI(url).search("").fragment("");
}

/**
 * Return the current URL, appending v=videoID and t=videoPosition, if set.
 * Remove hashes from the URL.
 * @param {string} videoID
 * @param {number} [videoPosition]
 * @returns {string}
 */
function makeListenURL(videoID, videoPosition) {
    const url = cleanURL(window.location);
    url.setSearch("v", videoID);
    if (videoPosition) {
        url.setSearch("t", videoPosition);
    }
    return url.toString();
}

/**
 * Return the current url with the Q query param set to the searchQuery.
 * Strip any hashes from the URL.
 * @param {string} searchQuery
 * @returns {string}
 */
function makeSearchURL(searchQuery) {
    return cleanURL(window.location).setSearch("q", searchQuery).toString();
}

function anchorURLs(text) {
    /* RegEx to match http or https addresses
    * This will currently only match TLD of two or three letters
    * Ends capture when:
    *    (1) it encounters a TLD
    *    (2) it encounters a period (.) or whitespace, if the TLD was followed by a forwardslash (/) */
    const re = /((?:http|https)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*[^\.\s])?)/g; // eslint-disable-line no-useless-escape
    /* Wraps all found URLs in <a> tags, do not encode display text */
    return text ? text.replace(re, function(u) {
        const uEncoded = encodeURI(u);
        return `<a href="${uEncoded}" target="_blank" rel="noopener noreferrer">${u}</a>`;
    }) : "";
}

function anchorTimestamps(text, videoID) {
    /* RegEx to match
      hh:mm:ss
      h:mm:ss
      mm:ss
      m:ss
    and wraps the timestamps in <a> tags
    RegEx explanation:
    ((?:[0-5]\d|\d|) either the string is "colon 00-59" or "0-9" or "blank"
    (?:\d|\:[0-5]\d) either the string is "colon 0-9" or "colon 00-59"
    (?:$|\:[0-5]\d)) either the string ends or is a a number between 00-59
    */
    const re = /((?:[0-5]\d|\d|)(?:\d|\:[0-5]\d)(?:$|\:[0-5]\d))/g; // eslint-disable-line no-useless-escape
    return text ? text.replace(re, function(match) {
        return "<a href=\"" + makeListenURL(videoID, convertTimestamp(match)) + "\">" + match + "</a>";
    }) : "";
}

function convertTimestamp(timestamp) {
    let seconds;
    let minutes;
    let hours;
    const timeComponents = timestamp.split(":");
    if (timeComponents.length === 3) {
        hours = convertHoursToSeconds(timeComponents[0]);
        minutes = convertMinutesToSeconds(timeComponents[1]);
        seconds = parseBase10Int(timeComponents[2]);
    }
    else {
        hours = 0;
        minutes = convertMinutesToSeconds(timeComponents[0]);
        seconds = parseBase10Int(timeComponents[1]);
    }
    return hours + minutes + seconds;
}

function convertHoursToSeconds(hours) {
    return parseBase10Int(hours) * timeIntervals.SECONDS * timeIntervals.SECONDS;
}

function convertMinutesToSeconds(minutes) {
    return parseBase10Int(minutes) * timeIntervals.SECONDS;
}

function parseBase10Int(value) {
    return parseInt(value, 10);
}

function wrapParseYouTubeVideoID(url) {
    if (currentVideoID && url === currentVideoID) {
        // We have already determined the video id
        return currentVideoID;
    }

    const info = parseYoutubeVideoID(url);
    if (info.id) {
        currentVideoID = info.id;
        gtag("send", "event", "video ID format", info.format);
        return info.id;
    }
    else {
        errorMessage.show("Failed to parse the video ID.");
    }
}

// The focus video ID
var focusId = "pJ5FD9_Orbg";
// The lofi video ID
var lofiId = "i43tkaTXtwI";

// Some demo video's audio, feel free to add more
var demos = [
    "koJv-j1usoI", // The Glitch Mob - Starve the Ego, Feed the Soul
    "EBerFisqduk", // Cazzette - Together (Lost Kings Remix)
    "jxKjOOR9sPU", // The Temper Trap - Sweet Disposition
    "03O2yKUgrKw"  // Mike Mago & Dragonette - Outlines
];

function pickDemo() {
    return demos[Math.floor(Math.random() * demos.length)];
}

function updateAutoplayToggle(state) {
    const toggleElement = $(".toggle-autoplay-btn");
    if (state) {
        toggleElement.addClass("toggle-autoplay-active");
        toggleElement.html("&#10004; Autoplay");
    }
    else {
        toggleElement.removeClass("toggle-autoplay-active");
        toggleElement.html("Autoplay");
    }
}

function getNewVideoID() {
    let nextID = playList.pop();
    while (nextID && currentVideoID === nextID) {
        nextID = playList.pop();
    }
    window.sessionStorage.setItem("playList", JSON.stringify(playList));
    return nextID;
}

function fetchSuggestedVideoIds() {
    if (playList.length === 0 && tags.length && !shouldSkipYouTubeDataApi()) {
        for (let index = 0; index < tags.length && index < MAX_TAGS; index++) {
            // get similar videos, populate playList
            $.ajax({
                url: "https://www.googleapis.com/youtube/v3/search",
                dataType: "json",
                async: false,
                data: {
                    key: youTubeDataApiKey,
                    part: "snippet",
                    type: "video",
                    order: "relevance",
                    q: tags[index],
                    maxResults: 2
                },
                success: onRelatedVideoFetchSuccess
            }).fail(function(jqXHR, textStatus, errorThrown) {
                logError(jqXHR, textStatus, errorThrown, "Related video lookup error");
            });
        }
        window.sessionStorage.setItem("playList", JSON.stringify(playList));
    }
}

function onRelatedVideoFetchSuccess(data) {
    // push items into playlist
    for (let i = 0; i < data.items.length; i++) {
        const id = data.items[i].id.videoId;
        if (id && id !== currentVideoID && !playList.includes(id)) {
            playList.push(id);
        }
    }
}

function loadAutoPlayDetails() {
    // load playList from session storage on reload
    if (window.sessionStorage.getItem("playList")) {
        playList = JSON.parse(window.sessionStorage.getItem("playList"));
    }

    // fetch autoPlay from session storage on reload
    if (window.sessionStorage.getItem("autoPlay") !== null) {
        autoplayState = window.sessionStorage.getItem("autoPlay") === "true";
        updateAutoplayToggle(autoplayState);
    }
}

function resetAutoPlayList() {
    playList = [];
    tags = [];
    window.sessionStorage.removeItem("playList");
}

$(function() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $("main").hide();
        $(".mobile-message").html("Sorry, we don't support mobile devices.");
        $(".mobile-message").show();
        return;
    }

    errorMessage.init();
    warningMessage.init();

    if (shouldSkipYouTubeDataApi()) {
        warningMessage.show("YouTube Data API features are disabled on localhost to preserve quota. Paste a video URL or ID to play directly.");
    }

    loadAutoPlayDetails();

    // How do we know if the value is truly invalid?
    // Preload the form from the URL
    const currentVideoID = getCurrentVideoID();
    if (currentVideoID) {
        $(".search-input").attr("value", currentVideoID);
        // Show the player only when a video is loaded.
        ZenPlayer.show();
    }
    else {
        // Fully hide the player until a video is loaded.
        ZenPlayer.hide();
        const currentSearchQuery = getCurrentSearchQuery();
        if (currentSearchQuery) {
            $(".search-input").attr("value", currentSearchQuery);
            if (shouldSkipYouTubeDataApi()) {
                warningMessage.show("Search is disabled on localhost to preserve YouTube API quota. Paste a video URL or ID to play directly.");
            }
            else {
                getSearchResults(
                    currentSearchQuery,
                    youTubeDataApiKey,
                    function(data) {
                        if (data.pageInfo.totalResults === 0) {
                            errorMessage.show("No results.");
                            return;
                        }
                        $(".search-results").show();
                        // Clear out results
                        $(".search-results ul").html("");

                        const start = "<li><h4><a href=?v=";
                        $.each(data.items, function(index, result) {
                            $(".search-results ul").append(start + result.id.videoId + ">" + result.snippet.title + "</a></h4><a href=?v=" + result.id.videoId + "><img src=" + result.snippet.thumbnails.medium.url + " alt='" + result.snippet.title + "'></a></li>");
                        });
                    },
                    function(jqXHR, textStatus, errorThrown) {
                        logError(jqXHR, textStatus, errorThrown, "Search error");
                    }
                );
            }
        }
    }

    // Autocomplete with youtube suggested queries
    if (!shouldSkipYouTubeDataApi()) {
        $(".search-input").typeahead({
            hint: false,
            highlight: true,
            minLength: 1
        }, {
            source: function (query, processSync, processAsync) {
                getAutocompleteSuggestions(query, function(data) {
                    return processAsync($.map(data[1], function(item) {
                        return item[0];
                    }));
                });
            }
        }).bind("typeahead:selected", function(obj, datum) {
            window.location.href = makeSearchURL(datum);
        });
    }

    // Handle form submission
    $(".search-form").submit(function(event) {
        event.preventDefault();
        let formValue = $.trim($(".search-input").val());
        let formValueTime = /[?&](t|time_continue)=(\d+)/g.exec(formValue);
        if (formValueTime && formValueTime.length > 2) {
            formValue = formValue.replace(formValueTime[0], "");
            formValueTime = parseInt(formValueTime[2], 10);
        }
        if (formValue) {
            const videoID = wrapParseYouTubeVideoID(formValue);
            gtag("send", "event", "form submitted", videoID);
            if (shouldSkipYouTubeDataApi()) {
                warningMessage.show("Skipping video lookup request while running locally.");
                window.location.href = makeListenURL(videoID, formValueTime);
            }
            else {
                $.ajax({
                    url: "https://www.googleapis.com/youtube/v3/videos",
                    dataType: "json",
                    async: false,
                    data: {
                        key: youTubeDataApiKey,
                        part: "snippet",
                        id: videoID
                    },
                    success: function(data) {
                        if (data.items.length === 0) {
                            window.location.href = makeSearchURL(formValue);
                        }
                        else {
                            tags = data.items[0].snippet.tags;
                            window.location.href = makeListenURL(videoID, formValueTime);
                        }
                    }
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    logError(jqXHR, textStatus, errorThrown, "Lookup error");
                });
                // fetching next videoIds for auto play
                fetchSuggestedVideoIds();
            }
        }
        else {
            // Show the Focus button If there is no search
            $(".focus-btn").show();
            $(".focus-btn").css("display", "inline");
            errorMessage.show("Try entering a YouTube video ID or URL!");
        }
    });

    // Reverts to Home when there is no text in input
    $(".search-input").on("input", function() {
        if ($(".search-input").val() === "") {
            $(".search-results").hide();
        }
    });

    $(".toggle-repeat-btn").click(function() {
        $(this).toggleClass("toggle-repeat-active");
        const active = $(this).hasClass("toggle-repeat-active");
        if (active) {
            $(this).html("&#10004; Repeat Track");
        }
        else {
            $(this).html("Repeat Track");
        }
        ZenPlayer.isRepeat = $(this).hasClass("toggle-repeat-active");
    });

    // Handle demo link click
    $(".demo-button").click(function(event) {
        event.preventDefault();
        resetAutoPlayList();

        gtag("send", "event", "demo", "clicked");

        // Don't continue appending to the URL if it appears "good enough".
        // This is likely only a problem if the demo link didn't work right the first time
        const pickedDemo = pickDemo();
        if (window.location.href.indexOf(demos) === -1) {
            window.location.href = makeListenURL(pickedDemo);
        }
        else {
            gtag("send", "event", "demo", "already had video ID in URL");
        }
    });

    // Handle focus link click
    $(".focus-btn").click(function(event) {
        event.preventDefault();
        resetAutoPlayList();

        gtag("send", "event", "focus", "clicked");
        // Redirect to the favorite "focus" URL
        window.location.href = makeListenURL(focusId);
    });

    // handle click on search icon
    $(".search-submit").click(function() {
        resetAutoPlayList();
    });

    // Check if the current ID is the focus ID
    $(window).on("load", function() {
        loadAutoPlayDetails();

        // Show Focus Button
        if (window.location.href.indexOf(focusId) === -1) {
            $(".focus-btn").show();
            $(".focus-btn").css("display", "inline");
        }
        else {
            // Hide Focus Button
            $(".focus-btn").hide();
        }
    });

    // Handle lofi link click
    $(".lofi-btn").click(function(event) {
        event.preventDefault();
        gtag("send", "event", "lofi", "clicked");
        // Redirect to the favorite "lofi" URL
        window.location.href = makeListenURL(lofiId);
    });

    // Check if the current ID is the lofi ID
    $(window).on("load", function() {
        // Show Lofi Button
        if (window.location.href.indexOf(lofiId) === -1) {
            $(".lofi-btn").show();
            $(".lofi-btn").css("display", "inline");
        }
        else {
            // Hide Lofi Button
            $(".lofi-btn").hide();
        }
    });

    // Load the player
    ZenPlayer.init(currentVideoID);

    $(document).on("keyup", function(evt) {
        // Toggle play/pause if not typing in the search box
        if (evt.keyCode === keyCodes.SPACEBAR && !$(".search-input").is(":focus")) {
            evt.preventDefault();
            if (ZenPlayer.isPlaying) {
                ZenPlayer.pause();
            }
            else {
                ZenPlayer.play();
            }
        }
    });

    $(document).on("keydown", function(evt) {
        // If not typing in the search prevent "page down" scrolling
        if (evt.keyCode === keyCodes.SPACEBAR && !$(".search-input").is(":focus")) {
            evt.preventDefault();
        }

        if (evt.keyCode === keyCodes.ENTER && $(".search-input").is(":focus")) {
            resetAutoPlayList();
        }
    });
});
