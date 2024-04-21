/* global gtag, URI, DOMPurify, getSearchResults, getAutocompleteSuggestions, parseYoutubeVideoID, getYouTubeVideoDescription */

var keyCodes = {
    SPACEBAR: 32
};

var timeIntervals = {
    SECONDS: 60
};

/**
 * YouTube iframe API required setup
 */
var plyrPlayer;
var youTubeDataApiKey = "AIzaSyCxVxsC5k46b8I-CLXlF3cZHjpiqP_myVk";
var currentVideoID;

var errorMessage = {
    init: function() {
        // nothing for now
    },
    show: function(message) {
        $("#zen-error").text("ERROR: " + message);
        $("#zen-error").show();

        // Pause if we got an error
        ZenPlayer.pause();

        // When the error message is shown, also hide the player
        ZenPlayer.hide();

        // Send the error to Google Analytics
        gtag("send", "event", "error", message);
    },
    hide: function() {
        $("#zen-error").text("").hide();
        ZenPlayer.show();
    }
};

/**
 * Are we serving the file over file://
 * @returns {boolean}
 */
function isFileProtocol() {
    return URI(window.location).protocol() === "file";
}

function handleYouTubeError(details) {
    if (typeof details.code === "number") {
        var message = "Got an unknown error, check the JS console.";
        var verboseMessage = message;

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

// One day, try to move all globals under the ZenPlayer object
var ZenPlayer = {
    updated: false,
    isPlaying: false,
    isRepeat: false,

    init: function(videoID) {
        // Inject svg with control icons
        $("#plyr-svg").load("../bower_components/plyr/dist/plyr.svg");

        plyrPlayer = document.querySelector(".plyr");

        plyr.setup(plyrPlayer, {
            autoplay: true,
            controls: ["play", "progress", "current-time", "duration", "mute", "volume"],
            hideControls: false
        });

        // Load video into Plyr player
        if (plyrPlayer.plyr) {
            var that = this;
            plyrPlayer.addEventListener("error", function(event) {
                if (event && event.detail && typeof event.detail.code === "number") {
                    handleYouTubeError(event.detail);
                    ZenPlayer.hide();
                }
            });

            plyrPlayer.addEventListener("ready", function() {
                // Noop if we have nothing to play
                if (!currentVideoID || currentVideoID.length === 0) {
                    return;
                }

                // gtagther video info
                that.videoTitle = plyrPlayer.plyr.embed.getVideoData().title;
                that.videoAuthor = plyrPlayer.plyr.embed.getVideoData().author;
                that.videoDuration = plyrPlayer.plyr.embed.getDuration();
                that.videoDescription = that.getVideoDescription(videoID);
                that.videoUrl = plyrPlayer.plyr.embed.getVideoUrl();

                // Updates the time position by a given argument in URL
                // IE https://zenplayer.audio/?v=koJv-j1usoI&t=30 starts at 0:30
                var t = getCurrentTimePosition();
                if (t) {
                    that.videoPosition = t;
                    window.sessionStorage[videoID] = t;
                }

                // Initialize UI
                that.setupTitle();
                that.setupVideoDescription(videoID);
                that.setupPlyrToggle();
            });

            plyrPlayer.addEventListener("playing", function() {
                var videoDuration = plyrPlayer.plyr.embed.getDuration();
                if (that.updated || videoDuration === 0) {
                    return;
                }

                // Start video from where we left off, if it makes sense
                if (window.sessionStorage && videoID in window.sessionStorage) {
                    var resumeTime = window.sessionStorage[videoID];
                    if (!isNaN(resumeTime) && resumeTime < videoDuration - 3) {
                        plyrPlayer.plyr.embed.seekTo(resumeTime);
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

            plyrPlayer.addEventListener("timeupdate", function() {
                // Nothing is playing
                if (!plyrPlayer.plyr || !plyrPlayer.plyr.embed) {
                    return;
                }

                // Store the current time of the video.
                var resumeTime = 0;
                var videoDuration = plyrPlayer.plyr.embed.getDuration();
                if (window.sessionStorage && videoDuration > 0) {
                    var currentTime = plyrPlayer.plyr.embed.getCurrentTime();
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
                        plyrPlayer.plyr.embed.seekTo(resumeTime);
                        ZenPlayer.play();
                    }
                    window.sessionStorage[videoID] = resumeTime;
                }
                var updatedUrl = that.videoUrl;
                if (resumeTime > 0) {
                    updatedUrl = that.videoUrl + "&t=" + Math.round(resumeTime);
                    $("#zen-video-title").attr("href", updatedUrl);
                }
                else if (resumeTime <= 0 && $("#zen-video-title").attr("href") !== that.videoUrl) {
                    updatedUrl = that.videoUrl;
                }
                $("#zen-video-title").attr("href", updatedUrl);
            });

            plyrPlayer.addEventListener("playing", function() {
                this.isPlaying = true;
            }.bind(this));

            plyrPlayer.addEventListener("pause", function() {
                this.isPlaying = false;
            }.bind(this));

            plyrPlayer.plyr.source({
                type: "video",
                title: "Title",
                sources: [{
                    src: currentVideoID,
                    type: "youtube"
                }]
            });
        }
    },
    show: function() {
        $("#audioplayer").show();
        // Hide the demo link as some video is playing
        $("#demo").hide();
    },
    hide: function() {
        $("#audioplayer").hide();
        // Show the demo link as no video is playing
        $("#demo").show();
    },
    setupTitle: function() {
        // Prepend music note only if title does not already begin with one.
        var tmpVideoTitle = this.videoTitle;
        if (!/^[\u2669\u266A\u266B\u266C\u266D\u266E\u266F]/.test(tmpVideoTitle)) {
            tmpVideoTitle = "<i class=\"fa fa-music\"></i> " + tmpVideoTitle;
        }
        $("#zen-video-title").html(DOMPurify.sanitize(tmpVideoTitle));
        $("#zen-video-title").attr("href", this.videoUrl);
    },
    setupVideoDescription: function(videoID) {
        var description = anchorURLs(this.videoDescription);
        description = anchorTimestamps(description, videoID);
        $("#zen-video-description").html(DOMPurify.sanitize(description));
        $("#zen-video-description").hide();

        $("#toggleDescription").click(function(event) {
            toggleElement(event, "#zen-video-description", "Description");
        });
    },
    setupPlyrToggle: function() {
        // Show player button click event
        $("#togglePlayer").click(function(event) {
            toggleElement(event, ".plyr__video-wrapper", "Player");
        });
    },
    getVideoDescription: function(videoID) {
        var description = "";

        if (isFileProtocol()) {
            console.log("Skipping video description request as we're running the site locally.");
            $("#toggleDescription").hide();
        }
        else {
            getYouTubeVideoDescription(
                videoID,
                youTubeDataApiKey,
                function(data) {
                    if (data.items.length === 0) {
                        errorMessage.show("Video description not found");
                    }
                    else {
                        description = data.items[0].snippet.description;
                    }
                },
                function(jqXHR, textStatus, errorThrown) {
                    logError(jqXHR, textStatus, errorThrown, "Video Description error");
                }
            );
        }

        // If there's no description to show, don't pretend there is
        if (description.trim().length === 0) {
            $("#toggleDescription").hide();
        }

        return description;
    },
    play: function() {
        plyrPlayer.plyr.embed.playVideo();
    },
    pause: function() {
        plyrPlayer.plyr.embed.pauseVideo();
    }
};

/**
 * Create a twitter message with current song if we have one.
 */
function updateTweetMessage() {
    var url = URI("https://zen-audio-player.github.io");

    var opts = {
        text: "Listen to YouTube videos without the distracting visuals",
        hashTags: "ZenAudioPlayer",
        url: url.toString()
    };

    var id = getCurrentVideoID();
    if (id) {
        url.setSearch("v", id);
        opts.url = url.toString();
        opts.text = "I'm listening to " + plyrPlayer.plyr.embed.getVideoData().title;
    }

    twttr.widgets.createHashtagButton(
        "ZenAudioPlayer",
        document.getElementById("tweetButton"),
        opts
    );
}

function logError(jqXHR, textStatus, errorThrown, _errorMessage) {
    var responseText = JSON.parse(jqXHR.error().responseText);
    errorMessage.show(responseText.error.errors[0].message);
    console.log(_errorMessage, errorThrown);
}

function toggleElement(event, toggleID, buttonText) {
    event.preventDefault();

    var toggleElement = $(toggleID);
    toggleElement.toggle("fast");

    var toggleTextElement = $("#" + event.currentTarget.id);

    if (toggleElement.is(":visible")) {
        // Check for current state(Hide/Show) and toggle it
        if (toggleTextElement.is(":contains(Hide)")) {
            toggleTextElement.text("Show " + buttonText);
        }
        else if (toggleTextElement.is(":contains(Show)")) {
            toggleTextElement.text("Hide " + buttonText);
        }
    }
    else {
        toggleTextElement.text("Show " + buttonText);
    }
}

/**
 * wrapParseYouTubeVideoID the first v query value.
 * Will return null if there's no v query param
 * @return {string|null}
 */
function getCurrentVideoID() {
    var v = URI(window.location).search(true).v;

    // If the URL has multiple v parameters, take parsing the last one (usually when ?v=someurl&v=xyz)
    var r;
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
    var t = parseInt(URI(window.location).search(true).t, 10);
    var timeContinue = parseInt(URI(window.location).search(true).time_continue, 10);
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
    var url = cleanURL(window.location);

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
    var re = /((?:http|https)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*[^\.\s])?)/g; // eslint-disable-line no-useless-escape
    /* Wraps all found URLs in <a> tags */
    return text.replace(re, "<a href=\"$1\" target=\"_blank\">$1</a>");
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
    var re = /((?:[0-5]\d|\d|)(?:\d|\:[0-5]\d)(?:$|\:[0-5]\d))/g; // eslint-disable-line no-useless-escape
    return text.replace(re, function(match) {
        return "<a href=\"" + makeListenURL(videoID, convertTimestamp(match)) + "\">" + match + "</a>";
    });
}

function convertTimestamp(timestamp) {
    var seconds = 0;
    var minutes = 0;
    var hours = 0;
    var timeComponents = timestamp.split(":");
    if (timeComponents.length === 3) {
        hours = convertHoursToSeconds(timeComponents[0]);
        minutes = convertMinutesToSeconds(timeComponents[1]);
        seconds = parseBase10Int(timeComponents[2]);
    }
    else {
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

    var info = parseYoutubeVideoID(url);

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

$(function() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $("#container").hide();
        $("#mobile-message").html("Sorry, we don't support mobile devices.");
        $("#mobile-message").show();
        return;
    }

    errorMessage.init();

    // How do we know if the value is truly invalid?
    // Preload the form from the URL
    var currentVideoID = getCurrentVideoID();
    if (currentVideoID) {
        $("#v").attr("value", currentVideoID);
    }
    else {
        var currentSearchQuery = getCurrentSearchQuery();
        if (currentSearchQuery) {
            $("#v").attr("value", currentSearchQuery);
            getSearchResults(
                currentSearchQuery,
                youTubeDataApiKey,
                function(data) {
                    if (data.pageInfo.totalResults === 0) {
                        errorMessage.show("No results.");
                        return;
                    }
                    $("#search-results").show();
                    // Clear out results
                    $("#search-results ul").html("");

                    var start = "<li><h4><a href=?v=";
                    $.each(data.items, function(index, result) {
                        $("#search-results ul").append(start + result.id.videoId + ">" + result.snippet.title + "</a></h4><a href=?v=" + result.id.videoId + "><img src=" + result.snippet.thumbnails.medium.url + " alt='" + result.snippet.title + "'></a></li>");
                    });
                },
                function(jqXHR, textStatus, errorThrown) {
                    logError(jqXHR, textStatus, errorThrown, "Search error");
                }
            );
        }
    }

    // Autocomplete with youtube suggested queries
    $("#v").typeahead({
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

    // Handle form submission
    $("#form").submit(function(event) {
        event.preventDefault();
        var formValue = $.trim($("#v").val());
        var formValueTime = /[?&](t|time_continue)=(\d+)/g.exec(formValue);
        if (formValueTime && formValueTime.length > 2) {
            formValue = formValue.replace(formValueTime[0], "");
            formValueTime = parseInt(formValueTime[2], 10);
        }
        if (formValue) {
            var videoID = wrapParseYouTubeVideoID(formValue, true);
            gtag("send", "event", "form submitted", videoID);
            if (isFileProtocol()) {
                errorMessage.show("Skipping video lookup request as we're running the site locally.");
            }
            else {
                $.ajax({
                    url: "https://www.googleapis.com/youtube/v3/videos",
                    dataType: "json",
                    async: false,
                    data: {
                        key: youTubeDataApiKey,
                        part: "snippet",
                        fields: "items/snippet/description",
                        id: videoID
                    },
                    success: function(data) {
                        if (data.items.length === 0) {
                            window.location.href = makeSearchURL(formValue);
                        }
                        else {
                            window.location.href = makeListenURL(videoID, formValueTime);
                        }
                    }
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    logError(jqXHR, textStatus, errorThrown, "Lookup error");
                });
            }
        }
        else {
            // Show the Focus button If there is no search
            $("#focus-btn").show();
            $("#focus-btn").css("display", "inline");
            errorMessage.show("Try entering a YouTube video ID or URL!");
        }
    });


    // Reverts to Home when there is no text in input
    $("#v").on("input", function() {
        if ($("#v").val() === "") {
            $("#search-results").hide();
        }
    });

    $("#toggleRepeat").click(function() {
        $(this).toggleClass("toggleRepeatActive");
        var active = $(this).hasClass("toggleRepeatActive");
        if (active) {
            $(this).html("&#10004; Repeat Track");
        }
        else {
            $(this).html("Repeat Track");
        }
        ZenPlayer.isRepeat = $(this).hasClass("toggleRepeatActive");
    });

    // Handle demo link click
    $("#demo").click(function(event) {
        event.preventDefault();
        gtag("send", "event", "demo", "clicked");

        // Don't continue appending to the URL if it appears "good enough".
        // This is likely only a problem if the demo link didn't work right the first time
        var pickedDemo = pickDemo();
        if (window.location.href.indexOf(demos) === -1) {
            window.location.href = makeListenURL(pickedDemo);
        }
        else {
            gtag("send", "event", "demo", "already had video ID in URL");
        }
    });

    // Handle focus link click
    $("#focus-btn").click(function(event) {
        event.preventDefault();
        gtag("send", "event", "focus", "clicked");
        // Redirect to the favorite "focus" URL
        window.location.href = makeListenURL(focusId);
    });

    // Check if the current ID is the focus ID
    $(window).on("load", function() {
        // Show Focus Button
        if (window.location.href.indexOf(focusId) === -1) {
            $("#focus-btn").show();
            $("#focus-btn").css("display", "inline");
        }
        else {
            // Hide Focus Button
            $("#focus-btn").hide();
        }
    });

    // Handle lofi link click
    $("#lofi-btn").click(function(event) {
        event.preventDefault();
        gtag("send", "event", "lofi", "clicked");
        // Redirect to the favorite "lofi" URL
        window.location.href = makeListenURL(lofiId);
    });

    // Check if the current ID is the lofi ID
    $(window).on("load", function() {
        // Show Lofi Button
        if (window.location.href.indexOf(lofiId) === -1) {
            $("#lofi-btn").show();
            $("#lofi-btn").css("display", "inline");
        }
        else {
            // Hide Lofi Button
            $("#lofi-btn").hide();
        }
    });

    // Load the player
    ZenPlayer.init(currentVideoID);

    $(document).on("keyup", function(evt) {
        // Toggle play/pause if not typing in the search box
        if (evt.keyCode === keyCodes.SPACEBAR && !$("#v").is(":focus")) {
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
        if (evt.keyCode === keyCodes.SPACEBAR && !$("#v").is(":focus")) {
            evt.preventDefault();
        }
    });
});
