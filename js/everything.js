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
        page_url: anonymizeFileUrl(), //eslint-disable-line camelcase
        user_agent: "${keen.user_agent}", //eslint-disable-line camelcase
        ip_address: "${keen.ip}", //eslint-disable-line camelcase
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
                        ua_string: "user_agent" //eslint-disable-line camelcase
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
var player;
var youTubeDataApiKey = "AIzaSyCxVxsC5k46b8I-CLXlF3cZHjpiqP_myVk";

function onYouTubeIframeAPIReady() { //eslint-disable-line no-unused-vars
    player = new YT.Player("player", {
        height: "300",
        width: "400",
        // Parse the querystring and populate the video when loading the page
        videoId: getCurrentVideoID(),
        playerVars: {
            "autoplay": 1,
            "cc_load_policy": 0
        },
        events: {
            "onReady": onPlayerReady,
            "onStateChange": function(event) {
                // Uncomment for debugging
                //console.log("State changed to " + event.data);
                var playerState = event.data;

                switch (playerState) {
                    case YT.PlayerState.PLAYING:
                        ZenPlayer.showPauseButton();
                        break;
                    default:
                        ZenPlayer.showPlayButton();
                }
            },
            "onError": function(event) {
                var message = "Got an unknown error, check the JS console.";
                var verboseMessage = message;

                // Handle the different error codes
                switch (event.data) {
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
                sendKeenEvent("YouTube iframe API error", {verbose: verboseMessage, message: message, code: event.data});

                // Log debug info
                console.log("Verbose debug error message: ", verboseMessage);
            }
        }
    });
}

function onPlayerReady(event) {
    var currentVideoID = getCurrentVideoID();

    updateTweetMessage();

    // If the video isn't going to play, then return.
    if (event.target.getPlayerState() !== YT.PlayerState.BUFFERING) {
        if (currentVideoID.length > 0) {
            errorMessage.show("Invalid YouTube videoID or URL.");
        }
        return;
    }

    // Google Analytics
    ga("send", "event", "Playing YouTube video title", this.videoTitle);
    ga("send", "event", "Playing YouTube video author", this.videoAuthor);
    ga("send", "event", "Playing YouTube video duration (seconds)", this.videoDuration);

    // Setup player
    if (currentVideoID) {
        ZenPlayer.init(currentVideoID);
    }
    sendKeenEvent("Playing YouTube video", {
        author: player.getVideoData().author,
        title: player.getVideoData().title,
        seconds: player.getDuration()
    });
}

var errorMessage = {
    init: function() {
        // nothing for now
    },
    show: function(message) {
        $("#zen-video-error").text("ERROR: " + message);
        $("#zen-video-error").show();

        // When the error message is shown, also hide the player
        ZenPlayer.hide();
    },
    hide: function() {
        $("#zen-video-error").text("").hide();
    }
};

function isFileProtocol() {
    return window.location.protocol === "file:";
}

// Lock for updating the volume
var VOLUME_LOCKED = false;

var ZenPlayer = {
    init: function(videoID) {
        // This should be called when the youtube player is done loading

        // Gather video info
        this.videoTitle = player.getVideoData().title;
        this.videoAuthor = player.getVideoData().author;
        this.videoDuration = player.getDuration();
        this.videoDescription = this.getVideoDescription(videoID);
        this.videoUrl = player.getVideoUrl();

        // Place stuff on page
        this.setupTitle();
        this.setupVideoDescription();
        this.setupMediaControls();
        this.setupVolumeSlider();

        // Start video from where we left off
        player.seekTo(loadTime());

        // When it is the player's first play, hide the youtube video
        $("#player").hide();

        // Everything available, ready to show now
        this.show();
    },
    show: function() {
        $("#audioplayer").show();
    },
    hide: function() {
        $("#audioplayer").hide();
    },
    showPauseButton: function() {
        $("#pause").show();
        $("#play").hide();
    },
    showPlayButton: function() {
        $("#play").show();
        $("#pause").hide();
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
            event.preventDefault();

            var descriptionElement = $("#zen-video-description");
            descriptionElement.toggle();

            if (descriptionElement.is(":visible")) {
                $("#toggleDescription").text("Hide Description");
            }
            else {
                $("#toggleDescription").text("Show Description");
            }
        });
    },
    setupMediaControls: function() {
        // play/pause button click event
        $("#playPause").click(function(event) {
            event.preventDefault();

            if ($("#play").is(":visible")) {
                player.playVideo();
            }
            else {
                player.pauseVideo();
            }
        });

        // Show player button click event
        $("#togglePlayer").click(function(event) {
            event.preventDefault();

            var p = $("#player");
            p.toggle();
            if (p.is(":visible")) {
                $("#togglePlayer").text("Hide Player");
            }
            else {
                $("#togglePlayer").text("Show Player");
            }
        });
    },
    setupVolumeSlider: function() {
        $("#volume").slider({
            min: 0,
            max: 100,
            setp: 1,
            value: 50,
            tooltip: "hide",
            id: "volumeSliderControl",
            formatter: function(){}
        });

        function updateVolumeFromSlider() {
            if (player) {
                player.setVolume($("#volume").slider("getValue"));
            }
        }

        $("#volume").on("slideStart", function() {
            VOLUME_LOCKED = true;
            updateVolumeFromSlider();
        });
        $("#volume").on("change", function() {
            updateVolumeFromSlider();
        });
        $("#volume").on("slideStop", function() {
            updateVolumeFromSlider();
            VOLUME_LOCKED = false;
        });

        // Update the time(s) every 100ms
        setInterval(function() {
            if (!VOLUME_LOCKED) {
                $("#volume").slider("setValue", player.getVolume());
            }
            updatePlayerTime();
        }, 100);
    },
    getVideoDescription: function(videoID) {
        var description = "";

        if (isFileProtocol()) {
            console.log("Skipping video description request as we're running the site locally.");
            $("#toggleDescription").hide();
        }
        else {
            // Request the video description
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
                        errorMessage.show("Video description not found");
                    }
                    else {
                        description = data.items[0].snippet.description;
                    }
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                var responseText = JSON.parse(jqXHR.error().responseText);
                errorMessage.show(responseText.error.errors[0].message);
                console.log("Video Description error", errorThrown);
            });
        }

        return description;
    }
};

function updateTweetMessage() {
    var url = "https://zen-audio-player.github.io";

    var opts = {
        text: "Listen to YouTube videos without the distracting visuals",
        hashTags: "ZenAudioPlayer",
        url: url
    };

    var id = getCurrentVideoID();
    if (id) {
        opts.url += "/?v=" + id;
        opts.text = "I'm listening to " + player.getVideoData().title;
    }

    twttr.widgets.createHashtagButton(
        "ZenAudioPlayer",
        document.getElementById("tweetButton"),
        opts
    );
}

// Takes seconds as a Number, returns a : delimited string
function cleanTime(time) {
    // Awesome hack for int->double cast http://stackoverflow.com/a/8388831/2785681
    var t = ~~time;

    var seconds = t % 60;
    var mins = (t - seconds) % (60 * 60) / 60;
    var hours = 0;

    var potentialHours = t - mins*60 - seconds;
    if (!isNaN(parseInt(potentialHours / 3600))) {
        hours = potentialHours / 3600;
    }

    var ret = "";
    if (hours > 0) {
        ret += hours + ":";
        if (mins < 10) {
            ret += "0";
        }
    }
    ret += mins + ":";
    if (seconds < 10) {
        ret += "0";
    }
    ret += seconds;

    return ret;
}

function storeTime(time) {
    var videoID = getCurrentVideoID();
    if (window.sessionStorage && videoID) {
        window.sessionStorage[videoID] = time;
    }
}

function updatePlayerTime() {
    var currentTime = player.getCurrentTime();
    $("#currentTime").text(cleanTime(currentTime));
    // after the video loads, player.getDuration() may have changed +/- 1
    $("#totalTime").text(cleanTime(player.getDuration()));
    storeTime(currentTime);
}

function loadTime() {
    var videoID = getCurrentVideoID();
    if (window.sessionStorage && window.sessionStorage.hasOwnProperty(videoID)) {
        time = window.sessionStorage[videoID];
        if (!isNaN(time)) {
            return parseInt(time, 10);
        }
    }
    else {
        return 0;
    }
}

function getParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getCurrentVideoID() {
    var v = getParameterByName(window.location.search, "v");
    if (v.length > 0) {
        return parseYoutubeVideoID(v);
    }
    return v;
}

function getCurrentSearchQuery() {
    var q = getParameterByName(window.location.search, "q");
    return q;
}

function makeListenURL(videoID) {
    var url = window.location.href;
    if (window.location.search.length !== 0) {
        url = window.location.href.replace(window.location.search, "");
    }
    // Remove any #s which break functionality
    url = url.replace("#", "");

    return url + "?v=" + videoID;
}

function makeSearchURL(searchQuery) {
    var url = window.location.href;
    if (window.location.search.length !== 0) {
        url = window.location.href.replace(window.location.search, "");
    }
    // Remove any #s which break functionality
    url = url.replace("#", "");

    return url + "?q=" + searchQuery;
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

// TODO: this function can go away, the YouTube API will let you play video by URL
// The url parameter could be the video ID
function parseYoutubeVideoID(url) {
    var videoID = null;

    var shortUrlDomain = "youtu.be";
    var longUrlDomain = "youtube.com";

    if (url && url.length > 0) {
        // youtube.com format
        if (url.indexOf(longUrlDomain) !== -1) {
            ga("send", "event", "video ID format", longUrlDomain);
            sendKeenEvent("Video ID format", {format: longUrlDomain});
            videoID = getParameterByName(url, "v");
            // If the URL had 2 v parameters, try parsing the second (usually when ?v=someurl&v=xyz)
            if (videoID === "") {
                videoID = getParameterByName(window.location.href.substring(window.location.href.indexOf(url)), "v");
            }
        }
        // youtu.be format
        else if (url.indexOf(shortUrlDomain) !== -1) {
            ga("send", "event", "video ID format", shortUrlDomain);
            sendKeenEvent("Video ID format", {format: shortUrlDomain});
            var endPosition = url.indexOf("?") === -1 ? url.length : url.indexOf("?");
            var offset = url.indexOf(shortUrlDomain) + shortUrlDomain.length + 1; // Skip over the slash also
            videoID = url.substring(offset, endPosition);
        }
        // Assume YouTube video ID string
        else {
            ga("send", "event", "video ID format", "video ID");
            sendKeenEvent("Video ID format", {format: "video ID"});
            videoID = url;
        }

        var slashPos = videoID.indexOf("/");
        // We found a slash in the video ID (ex: real id is ABC123, but saw ABC123/zen)
        // So, only keep what's before the slash
        if (slashPos !== -1) {
            videoID = videoID.substring(0, slashPos);
        }
        return videoID;
    }
    errorMessage.show("Failed to parse the video ID.");
}

function getSearchResults(query) {
    $.getJSON("https://www.googleapis.com/youtube/v3/search", {
        key: youTubeDataApiKey,
        part: "snippet",
        q: query,
        type: "video"
    }, function(data) {
        if (data.pageInfo.totalResults === 0) {
            errorMessage.show("No results.");
            return;
        }

        $("#search-results").show();
        // Clear out results
        $("#search-results ul").html("");
        $.each(data.items, function(index, result) {
            $("#search-results ul").append("<li><h4><a href=?v=" + result.id.videoId + ">" + result.snippet.title  + "</a></h4></li>");
        });
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var responseText = JSON.parse(jqXHR.error().responseText);
        errorMessage.show(responseText.error.errors[0].message);
        console.log("Search error", errorThrown);
    });
}

$(function() {
    // Keen.io
    client = new Keen({ //eslint-disable-line no-undef
        projectId: "5690c384c1e0ab0c8a6c59c4",
        writeKey: "630fa16847ce5ffb01c9cc00327498e4e7716e0f324fb14fdf0e83ffc06f9eacff5fad1313c2701efe4a91c88c34b8d8153cbb121c454056bb63caf60a46336dd9c9e9855ecc5202ef3151d798eda40896d5111f44005c707cbfb32c7ae31070d129d6f520d5604fdbce5ad31e9c7232"
    });

    errorMessage.init();

    // Preload the form from the URL
    var currentVideoID = getCurrentVideoID();
    if (currentVideoID) {
        $("#v").attr("value", currentVideoID);
    }
    else {
        var currentSearchQuery = getCurrentSearchQuery();
        if (currentSearchQuery) {
            $("#v").attr("value", currentSearchQuery);
            getSearchResults(currentSearchQuery);
        }
    }

    // Handle form submission
    $("#form").submit(function(event) {
        event.preventDefault();

        var formValue = $.trim($("#v").val());
        if (formValue) {
            var videoID = parseYoutubeVideoID(formValue);
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
                    var responseText = JSON.parse(jqXHR.error().responseText);
                    errorMessage.show(responseText.error.errors[0].message);
                    console.log("Search error", errorThrown);
                });
            }
        }
        else {
            errorMessage.show("Try entering a YouTube video ID or URL!");
        }
    });

    var starveTheEgoFeedTheSoulGlitchMob = "koJv-j1usoI";

    // Hide the demo link if playing the demo video's audio
    if (currentVideoID === starveTheEgoFeedTheSoulGlitchMob) {
        $("#demo").hide();
    }

    // Handle demo link click
    $("#demo").click(function(event) {
        event.preventDefault();
        ga("send", "event", "demo", "clicked");
        sendKeenEvent("Demo", {action: "clicked"});

        // Don't continue appending to the URL if it appears "good enough".
        // This is likely only a problem if the demo link didn't work right the first time
        if (window.location.href.indexOf(starveTheEgoFeedTheSoulGlitchMob) === -1) {
            window.location.href = makeListenURL(starveTheEgoFeedTheSoulGlitchMob);
        }
        else {
            ga("send", "event", "demo", "already had video ID in URL");
            sendKeenEvent("demo", {action: "already had video ID in URL"});
        }
    });
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
