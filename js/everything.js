/* global getParameterByName, getSearchResults, getAutocompleteSuggestions, parseYoutubeVideoID, getYouTubeVideoDescription */

// Pointer to Keen client
var client;

function anonymizeFileUrl() {
    var url = window.location.href;
    if (url.indexOf("file://") === 0) {
        url = "localhost";
    }
    return url;
}

function sendKeenEvent(_msg, _data) {
    var d = {
        page_url: anonymizeFileUrl(), // eslint-disable-line camelcase
        user_agent: "${keen.user_agent}", // eslint-disable-line camelcase
        ip_address: "${keen.ip}", // eslint-disable-line camelcase
        keen: {
            addons: [
                {
                    name: "keen:ip_to_geo",
                    input: {
                        ip: "ip_address"
                    },
                    output: "ip_geo_info"
                },
                {
                    name: "keen:ua_parser",
                    input: {
                        ua_string: "user_agent" // eslint-disable-line camelcase
                    },
                    output: "parsed_user_agent"
                },
                {
                    name: "keen:url_parser",
                    input: {
                        url: "page_url"
                    },
                    output: "parsed_page_url"
                }
            ]
        }
    };

    for (var _d in _data) {
        d[_d] = _data[_d];
    }
    client.addEvent(_msg, d);
}

/**
 * YouTube iframe API required setup
 */
// var player;
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
        ga("send", "event", "error", message);
        sendKeenEvent("error", {"message": message});
    },
    hide: function() {
        $("#zen-error").text("").hide();
        ZenPlayer.show();
    }
};

function isFileProtocol() {
    return window.location.protocol === "file:";
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
        ga("send", "event", "YouTube iframe API error", verboseMessage);
        sendKeenEvent("YouTube iframe API error", {verbose: verboseMessage, message: message, code: details.code});

        // Log debug info
        console.log("Verbose debug error message: ", verboseMessage);
    }
}

// One day, try to move all globals under the ZenPlayer object
var ZenPlayer = {
    updated: false,
    init: function(videoID) {
        // Inject svg with control icons
        $("#plyr-svg").load("../bower_components/plyr/dist/sprite.svg");

        plyrPlayer = document.querySelector(".plyr");

        plyr.setup(plyrPlayer, {
            autoplay: true,
            controls:["play", "progress", "current-time", "duration", "mute", "volume"],
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

                // Gather video info
                that.videoTitle = plyrPlayer.plyr.embed.getVideoData().title;
                that.videoAuthor = plyrPlayer.plyr.embed.getVideoData().author;
                that.videoDuration = plyrPlayer.plyr.embed.getDuration();
                that.videoDescription = that.getVideoDescription(videoID);
                that.videoUrl = plyrPlayer.plyr.embed.getVideoUrl();

                // Initialize UI
                that.setupTitle();
                that.setupVideoDescription();
                that.setupPlyrToggle();
            });

            plyrPlayer.addEventListener("playing", function() {
                if (that.updated) {
                    return;
                }

                // Start video from where we left off, if it makes sense
                if (window.sessionStorage && window.sessionStorage.hasOwnProperty(videoID)) {
                    var resumeTime = window.sessionStorage[videoID];
                    var videoDuration = plyrPlayer.plyr.embed.getDuration();
                    if (!isNaN(resumeTime) && resumeTime < videoDuration - 3) {
                        plyrPlayer.plyr.embed.seekTo(resumeTime);
                    }
                }

                that.updated = true;

                // Analytics
                ga("send", "event", "Playing YouTube video title", that.videoTitle);
                ga("send", "event", "Playing YouTube video author", that.videoAuthor);
                ga("send", "event", "Playing YouTube video duration (seconds)", that.videoDuration);
                // For some reason author is always an empty string, but not when inspected in the browser...
                sendKeenEvent("Playing YouTube video", {
                    author: plyrPlayer.plyr.embed.getVideoData().author,
                    title: plyrPlayer.plyr.embed.getVideoData().title,
                    seconds: plyrPlayer.plyr.embed.getDuration(),
                    youtubeID: plyrPlayer.plyr.embed.getVideoData().video_id
                });

                // Show player
                that.show();
                updateTweetMessage();
            });

            plyrPlayer.addEventListener("timeupdate", function() {
                // Store the current time of the video.
                if (window.sessionStorage) {
                    var currentTime = plyrPlayer.plyr.embed.getCurrentTime();
                    var videoDuration = plyrPlayer.plyr.embed.getDuration();
                    var resumeTime = 0;

                    // Only store the current time if the video isn't done
                    // playing yet. If the video finished already, then it
                    // should start off at the beginning next time.
                    // There is a fuzzy 3 seconds because sometimes the video
                    // will end a few seconds before the video duration.
                    if (currentTime < videoDuration - 3) {
                        resumeTime = currentTime;
                    }
                    window.sessionStorage[videoID] = resumeTime;
                }
            });

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
    },
    hide: function() {
        $("#audioplayer").hide();
    },
    setupTitle: function() {
        // Prepend music note only if title does not already begin with one.
        var tmpVideoTitle = this.videoTitle;
        if (!/^[\u2669\u266A\u266B\u266C\u266D\u266E\u266F]/.test(tmpVideoTitle)) {
            tmpVideoTitle = "<i class=\"fa fa-music\"></i> " + tmpVideoTitle;
        }
        $("#zen-video-title").html(tmpVideoTitle);
        $("#zen-video-title").attr("href", this.videoUrl);
    },
    setupVideoDescription: function() {
        var description = anchorURLs(this.videoDescription);
        $("#zen-video-description").html(description);
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
        if (description.trim().length) {
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

function updateTweetMessage() {
    var url = "https://ZenPlayer.Audio";

    var opts = {
        text: "Listen to YouTube videos without the distracting visuals",
        hashTags: "ZenAudioPlayer",
        url: url
    };

    var id = getCurrentVideoID();
    if (id) {
        opts.url += "/?v=" + id;
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
    toggleElement.toggle();

    var toggleTextElement = $("#" + event.currentTarget.id);

    if (toggleElement.is(":visible")) {
        toggleTextElement.text("Hide " + buttonText);
    }
    else {
        toggleTextElement.text("Show " + buttonText);
    }
}

function getCurrentVideoID() {
    var v = getParameterByName(window.location.search, "v");
    // If the URL had 2 v parameters, try parsing the second (usually when ?v=someurl&v=xyz)
    var vParams = window.location.search.match(/v=\w+/g);
    if (vParams && vParams.length > 1) {
        v = vParams[vParams.length - 1].replace("v=", "");
    }
    else if (v.length > 1) {
        return wrapParseYouTubeVideoID(v);
    }
    return v;
}

function getCurrentSearchQuery() {
    var q = getParameterByName(window.location.search, "q");
    return q;
}

function removeSearchQueryFromURL(url) {
    if (window.location.search.length !== 0) {
        url = window.location.href.replace(window.location.search, "");
    }
    return url;
}

function makeListenURL(videoID) {
    var url = removeSearchQueryFromURL(window.location.href);
    // Remove any #s which break functionality
    url = url.replace("#", "");

    return url + "?v=" + videoID;
}

function makeSearchURL(searchQuery) {
    var url = removeSearchQueryFromURL(window.location.href);
    // Remove any #s which break functionality
    url = url.replace("#", "");

    return url + "?q=" + encodeURIComponent(searchQuery);
}

function anchorURLs(text) {
    /* RegEx to match http or https addresses
    * This will currently only match TLD of two or three letters
    * Ends capture when:
    *    (1) it encounters a TLD
    *    (2) it encounters a period (.) or whitespace, if the TLD was followed by a forwardslash (/) */
    var re = /((?:http|https)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*[^\.\s])?)/g;
    /* Wraps all found URLs in <a> tags */
    return text.replace(re, "<a href=\"$1\" target=\"_blank\">$1</a>");
}

function wrapParseYouTubeVideoID(url) {
    if (currentVideoID && url === currentVideoID) {
        // We have already determined the video id
        return currentVideoID;
    }

    var info = parseYoutubeVideoID(url);

    if (info.id) {
        currentVideoID = info.id;
        ga("send", "event", "video ID format", info.format);
        return info.id;
    }
    else {
        errorMessage.show("Failed to parse the video ID.");
    }
}

// Some demo video's audio, feel free to add more
var demos = [
    "koJv-j1usoI", // The Glitch Mob - Starve the Ego, Feed the Soul
    "5cJIvC6AAkc", // Family Force 5 - Dance Or Die Official Music Video
    "EBerFisqduk", // Cazzette - Together (Lost Kings Remix)
    "DlKXJ906pd8" // Ronald Jenkees - Throwing Fire
];

function pickDemo() {
    return demos[Math.floor(Math.random() * demos.length)];
}

$(function() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.usersAgent))
    {
        $("#container").hide();
        $("#mobile-message").text("Whoops! Sorry , we don't support mobile devices.");
        return;
    }
    // Keen.io
    client = new Keen({ // eslint-disable-line no-undef
        projectId: "5690c384c1e0ab0c8a6c59c4",
        writeKey: "630fa16847ce5ffb01c9cc00327498e4e7716e0f324fb14fdf0e83ffc06f9eacff5fad1313c2701efe4a91c88c34b8d8153cbb121c454056bb63caf60a46336dd9c9e9855ecc5202ef3151d798eda40896d5111f44005c707cbfb32c7ae31070d129d6f520d5604fdbce5ad31e9c7232"
    });

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
                    var end = "</a></h4></li>";
                    $.each(data.items, function(index, result) {
                        $("#search-results ul").append(start + result.id.videoId + ">" + result.snippet.title  + end);
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
        if (formValue) {
            var videoID = wrapParseYouTubeVideoID(formValue, true);
            ga("send", "event", "form submitted", videoID);
            sendKeenEvent("Form submitted", {videoID: videoID});

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
                            window.location.href = makeListenURL(videoID);
                        }
                    }
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    logError(jqXHR, textStatus, errorThrown, "Lookup error");
                });
            }
        }
        else {
            errorMessage.show("Try entering a YouTube video ID or URL!");
        }
    });

    // Hide the demo link if playing any of the demo video's audio
    if ($.inArray(currentVideoID, demos) !== -1) {
        $("#demo").hide();
    }
    // Handle demo link click
    $("#demo").click(function(event) {
        event.preventDefault();
        ga("send", "event", "demo", "clicked");
        sendKeenEvent("Demo", {action: "clicked"});

        // Don't continue appending to the URL if it appears "good enough".
        // This is likely only a problem if the demo link didn't work right the first time
        var pickedDemo = pickDemo();
        if (window.location.href.indexOf(demos) === -1) {
            window.location.href = makeListenURL(pickedDemo);
        }
        else {
            ga("send", "event", "demo", "already had video ID in URL");
            sendKeenEvent("demo", {action: "already had video ID in URL"});
        }
    });

    // Load the player
    ZenPlayer.init(currentVideoID);
});

/*eslint-disable */
// Google Analytics goodness
(function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,"script","//www.google-analytics.com/analytics.js","ga");
ga("create", "UA-62983413-1", "auto");
ga("send", "pageview");
/*eslint-enable */
