// Pointer to Keen client
var client;

/**
 * YouTube iframe API required setup
 */
var player;
var hasError = false;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '300',
        width: '400',
        // Parse the querystring and populate the video when loading the page
        videoId: getCurrentVideoID(),
        playerVars: { 'autoplay': 0, 'cc_load_policy': 0},
        events: {
            'onReady': onPlayerReady,
            'onStateChange': function onPlayerStateChange(event) {
                // Uncomment for debugging
                //console.log("State changed to " + event.data);
                var playerState = event.data;

                 if (playerState === YT.PlayerState.ENDED) {
                    showPlayButton();
                 }
            },
            'onError': function(event) {
                var message = "Got an unknown error, check the JS console.";
                var verboseMessage = message;
                hasError = true;

                // Handle the different error codes
                switch(event.data) {
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
                showErrorMessage(message);
                ga("send", "event", "YouTube iframe API error", verboseMessage);
                client.addEvent("YouTube iframe API error", {verbose: verboseMessage, message: message, code: event.data});

                // Log debug info
                console.log("Verbose debug error message: ", verboseMessage);
            }
        }
    });
}

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

function showPlayButton() {
    $("#play").show();
    $("#pause").hide();
}

function showPauseButton() {
    $("#pause").show();
    $("#play").hide();
}

function togglePlayer() {
    // TODO: google analytics
    var p = $("#player");
    p.toggle();
    if (p.is(":visible")) {
        $("#togglePlayer").text("Hide Player");
    }
    else {
        $("#togglePlayer").text("Show Player");
    }
}

function togglePlayPause() {
    // TODO: google analytics
    if ($("#play").is(":visible")) {
        player.playVideo();
        // Autoplay is disabled on mobile, double check before toggling
        setTimeout(function() {
            if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                showPauseButton();
            }
        }, 1000);
    }
    else {
        player.pauseVideo();
        setTimeout(function() {
            if (player.getPlayerState() === YT.PlayerState.PAUSED) {
                showPlayButton();
            }
        }, 1000);
    }
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

function updatePlayerTime() {
    $("#currentTime").text(cleanTime(player.getCurrentTime()));
    // TODO: after the video loads, player.getDuration() may have changed +/- 1
    $("#totalTime").text(cleanTime(player.getDuration()));
}

// Lock for updating the volume
var VOLUME_LOCKED = false;

function onPlayerReady(event) {
    // Only play the video if it's actually there
    if (getCurrentVideoID()) {
        $("#zen-video-error").text("");
        event.target.playVideo();
        ga("send", "event", "Playing YouTube video title", player.getVideoData().title);
        ga("send", "event", "Playing YouTube video author", player.getVideoData().author);
        ga("send", "event", "Playing YouTube video duration (seconds)", player.getDuration());

        client.addEvent("Playing YouTube video", {
            author: player.getVideoData().author,
            title: player.getVideoData().title,
            seconds: player.getDuration(),
            // Keen stuff
            page_url: window.location.href,
            user_agent: "${keen.user_agent}",
            ip_address: "${keen.ip}",
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
                            ua_string: "user_agent"
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
        }, function() { console.log(arguments);});

        $("#zen-video-title").html("<i class=\"fa fa-music\"></i> " + player.getVideoData().title);
        $("#zen-video-title").attr("href", player.getVideoUrl());
        togglePlayPause();

        $("#playerTime").show();

        updateTweetMessage();

        // Update the time(s) every 100ms
        setInterval(function() {
            if (!VOLUME_LOCKED) {
                $("#volume").slider("setValue", player.getVolume());
            }
            updatePlayerTime();
        }, 100);
    }
    else {
        // Clear the now playing text
        $("#zen-video-title").text("");
        $("#playerTime").hide();

        updateTweetMessage();
    }
}

function stopVideo() {
    player.stopVideo();
}

/**
 * Zen Audio Player functions
 */
function showErrorMessage(message) {
    $("#zen-video-error").text("ERROR: " + message);
    $("#zen-video-error").show();
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

function makeListenURL(videoID) {
    var url = window.location.href;
    if (window.location.search.length !== 0) {
        url = window.location.href.replace(window.location.search, "");
    }
    // Remove any #s which break functionality
    url = url.replace("#", "");
    return url + "?v=" + videoID;
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
            client.addEvent("Video ID format", {format: longUrlDomain});
            videoID = getParameterByName(url, "v");
            // If the URL had 2 v parameters, try parsing the second (usually when ?v=someurl&v=xyz)
            if (videoID === "") {
                videoID = getParameterByName(window.location.href.substring(window.location.href.indexOf(url)), "v");
            }
        }
        // youtu.be format
        else if (url.indexOf(shortUrlDomain) !== -1) {
            ga("send", "event", "video ID format", shortUrlDomain);
            client.addEvent("Video ID format", {format: shortUrlDomain});
            var endPosition = url.indexOf("?") === -1 ? url.length : url.indexOf("?");
            var offset = url.indexOf(shortUrlDomain) + shortUrlDomain.length + 1; // Skip over the slash also
            videoID = url.substring(offset, endPosition);
        }
        // Assume YouTube video ID string
        else {
            ga("send", "event", "video ID format", "video ID");
            client.addEvent("Video ID format", {format: "video ID"});
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
    showErrorMessage("Failed to parse the video ID.");
}

$(function() {
    // Keen.io
    client = new Keen({
        projectId: "561c5bdf2fd4b1643d829323", // String (required always)
        writeKey: "63a4473df5ec83ea8494a5845e2b46501238f6d5580f4953933ebd0cef786409716832cd147b09a29a5b2a80830f8154b772f88e55fd29d92022922993b96eac42cf8497db411a0831fd631e097b9711172b7210a0178b778b69f8ab60fa7eb9c37fdd949ec45d6791700575739dda15",   // String (required for sending data)
        // readKey: "YOUR_READ_KEY"      // String (required for querying data)

        // protocol: "https",         // String (optional: https | http | auto)
        // host: "api.keen.io/3.0",   // String (optional)
        // requestType: "jsonp"       // String (optional: jsonp, xhr, beacon)
    });
    
    var starveTheEgoFeedTheSoul_GlitchMob = "koJv-j1usoI";

    // Preload the form from the URL
    var currentVideoID = getCurrentVideoID();
    if (currentVideoID) {
        $("#v").attr("value", currentVideoID);
    }

    // Hide the demo link if playing the demo video's audio
    if (currentVideoID === starveTheEgoFeedTheSoul_GlitchMob) {
        $("#demo").hide();
    }

    // Handle form submission
    $("#form").submit(function(event) {
        event.preventDefault();
        var formValue = $.trim($("#v").val());
        if (formValue) {
            var videoID = parseYoutubeVideoID(formValue);
            ga("send", "event", "form submitted", videoID);
            client.addEvent("Form submitted", {videoID: videoID});
            window.location.href = makeListenURL(videoID);
        }
        else {
            showErrorMessage("Try entering a YouTube video ID or URL!");
        }
    });

    // Handle demo link click
    $("#demo").click(function(event) {
        event.preventDefault();
        ga("send", "event", "demo", "clicked");
        client.addEvent("Demo", {action: "clicked"});

        // Don't continue appending to the URL if it appears "good enough".
        // This is likely only a problem if the demo link didn't work right the first time
        if (window.location.href.indexOf(starveTheEgoFeedTheSoul_GlitchMob) === -1) {
            window.location.href = makeListenURL(starveTheEgoFeedTheSoul_GlitchMob);
        }
        else {
            ga("send", "event", "demo", "already had video ID in URL");
            client.addEvent("demo", {action: "already had video ID in URL"});
        }
    });

    // Initialize volume slider
    $("#volume").slider({
        min: 0,
        max: 100,
        setp: 1,
        value: 50,
        tooltip: "hide",
        id: "volumeSliderControl",
        formatter: function(){}
    });

    // Media controls
    $("#playPause").click(function(event) {
        togglePlayPause();
    });
    $("#togglePlayer").click(function(event) {
        togglePlayer();
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
});

/* jshint ignore:start */
// Google Analytics goodness
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-62983413-1', 'auto');
ga('send', 'pageview');
/* jshint ignore:end */
