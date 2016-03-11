/*global getParameterByName, getSearchResults, getAutocompleteSuggestions, parseYoutubeVideoID, getYouTubeVideoDescription*/

var player;
var plyrPlayer;
var youTubeDataApiKey = "AIzaSyCxVxsC5k46b8I-CLXlF3cZHjpiqP_myVk";
var currentVideoID;

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
                // Look at playerState for debugging
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
    if (event.target.getPlayerState() === YT.PlayerState.UNSTARTED) {
        errorMessage.show("Invalid YouTube videoID or URL.");
        return;
    }

    // Setup player
    if (currentVideoID) {
        ZenPlayer.init(currentVideoID);
        if (plyrPlayer) {
            return;
        }
        setupPlyr();
    }
}

function setupPlyr() {
    //set up Plyr player
    plyrPlayer = plyr.setup({
        autoplay: true,
        controls:["play", "current-time", "duration", "mute", "volume"]
    })[0];
    //Load video into Plyr player
    if (plyrPlayer) {
        plyrPlayer.source({
            type: "video",
            title: player.getVideoData().title,
            sources: [{
                src: currentVideoID,
                type: "youtube"
            }]
        });
        //Inject svg with controls' icons
        $("#plyr-svg").load("../bower_components/plyr/dist/sprite.svg");
    }
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
        opts.text = "I'm listening to " + player.getVideoData().title;
    }

    twttr.widgets.createHashtagButton(
        "ZenAudioPlayer",
        document.getElementById("tweetButton"),
        opts
    );
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
        // TODO: analytics
        errorMessage.show("Failed to parse the video ID.");
    }
}

// TODO: this function can go away, the YouTube API will let you play video by URL

$(function() {
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
                    // TODO: refactor this to be less wide
                    $.each(data.items, function(index, result) {
                        $("#search-results ul").append("<li><h4><a href=?v=" + result.id.videoId + ">" + result.snippet.title  + "</a></h4></li>");
                    });
                },
                function(jqXHR, textStatus, errorThrown) {
                    var responseText = JSON.parse(jqXHR.error().responseText);
                    errorMessage.show(responseText.error.errors[0].message);
                    console.log("Search error", errorThrown);
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
                    console.log("Lookup error", errorThrown);
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

        // Don't continue appending to the URL if it appears "good enough".
        // This is likely only a problem if the demo link didn't work right the first time
        if (window.location.href.indexOf(starveTheEgoFeedTheSoulGlitchMob) === -1) {
            window.location.href = makeListenURL(starveTheEgoFeedTheSoulGlitchMob);
        }
        else {
            ga("send", "event", "demo", "already had video ID in URL");
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
