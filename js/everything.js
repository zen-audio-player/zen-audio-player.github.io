/*global getParameterByName, getSearchResults, getAutocompleteSuggestions, parseYoutubeVideoID, parseSoundcloudVideoID, getYouTubeVideoDescription*/

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
// var player;
var plyrPlayer;
var youTubeDataApiKey = "AIzaSyCxVxsC5k46b8I-CLXlF3cZHjpiqP_myVk";
var soundcloudClientID = "3edf3ef1a8b45ca19d2d53100544e969";
var currentVideoID;

// function onYouTubeIframeAPIReady() { //eslint-disable-line no-unused-vars
//     player = new YT.Player("player", {
//         height: "300",
//         width: "400",
//         // Parse the querystring and populate the video when loading the page
//         videoId: getCurrentVideoID(),
//         playerVars: {
//             "autoplay": 1,
//             "cc_load_policy": 0
//         },
//         events: {
//             "onReady": onPlayerReady,
//             "onStateChange": function(event) {
//                 // Look at playerState for debugging
//                 var playerState = event.data;

//                 switch (playerState) {
//                     case YT.PlayerState.PLAYING:
//                         ZenPlayer.showPauseButton();
//                         break;
//                     default:
//                         ZenPlayer.showPlayButton();
//                 }
//             },
//             "onError": function(event) {
//                 // TODO: how can we replicate this?
//                 var message = "Got an unknown error, check the JS console.";
//                 var verboseMessage = message;

//                 // Handle the different error codes
//                 switch (event.data) {
//                     case 2:
//                         verboseMessage = "The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.";
//                         message = "looks like an invalid video ID";
//                         break;
//                     case 5:
//                         verboseMessage = "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.";
//                         message = "we can't play that video here, or something is wrong with YouTube's iframe API";
//                         break;
//                     case 100:
//                         verboseMessage = "The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.";
//                         message = "we can't find that video, it might be private or removed";
//                         break;
//                     case 101:
//                         verboseMessage = "The owner of the requested video does not allow it to be played in embedded players.";
//                         message = "the video owner won't allow us to play that video";
//                         break;
//                     case 150:
//                         verboseMessage = "This error is the same as 101. It's just a 101 error in disguise!";
//                         message = "the video owner won't allow us to play that video";
//                         break;
//                 }

//                 // Update the UI w/ error
//                 errorMessage.show(message);
//                 ga("send", "event", "YouTube iframe API error", verboseMessage);
//                 sendKeenEvent("YouTube iframe API error", {verbose: verboseMessage, message: message, code: event.data});

//                 // Log debug info
//                 console.log("Verbose debug error message: ", verboseMessage);
//             }
//         }
//     });
// }

// TODO: refactor away
// function onPlayerReady(event) {
//     var currentVideoID = getCurrentVideoID();

//     updateTweetMessage();

//     // If the video isn't going to play, then return.
//     if (event && event.target && event.target.getPlayerState() === YT.PlayerState.UNSTARTED) {
//         errorMessage.show("Invalid YouTube videoID or URL.");
//         return;
//     }

//     // Setup player
//     if (currentVideoID) {
//         if (plyrPlayer) {
//             return;
//         }
//         // setupPlyr();
//         alert("death");
//     }
// }

var errorMessage = {
    init: function() {
        // nothing for now
    },
    show: function(message) {
        $("#zen-error").text("ERROR: " + message);
        $("#zen-error").show();

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

var ZenPlayer = {
    init: function(videoID) {
        // Determine youtube or soundcloud
        // If the id is all numbers, then it's probably soundcloud.
        var format;
        if (isNaN(videoID)) {
            format = "youtube";
        }
        else {
            format = "soundcloud";
        }

        // Inject svg with control icons
        $("#plyr-svg").load("../bower_components/plyr/dist/sprite.svg");

        plyrPlayer = document.querySelector(".plyr");

        plyr.setup(plyrPlayer, {
            autoplay: true,
            controls:["play", "current-time", "duration", "mute", "volume"]
        });

        // Load video into Plyr player
        if (plyrPlayer.plyr) {
            var that = this;
            plyrPlayer.addEventListener("error", function(event) {
                // TODO: how do we see the real error message?
                console.log("error");
                console.log(event);
                console.log(event.target.plyr);
            });

            plyrPlayer.addEventListener("ready", function() {
                // Noop if we have nothing to play
                if (!currentVideoID || currentVideoID.length === 0) {
                    return;
                }

                // Gather video info
                if (format === "youtube") {
                    that.videoTitle = plyrPlayer.plyr.embed.getVideoData().title;
                    that.videoAuthor = plyrPlayer.plyr.embed.getVideoData().author;
                    that.videoDuration = plyrPlayer.plyr.embed.getDuration();
                    that.videoDescription = that.getVideoDescription(videoID);
                    that.videoUrl = plyrPlayer.plyr.embed.getVideoUrl();

                    // Initialize UI
                    that.setupTitle();
                    that.setupVideoDescription();
                    that.setupPlyrToggle();
                }
                else if (format === "soundcloud") {
                    $.ajax({
                        url: "https://api.soundcloud.com/tracks/" + currentVideoID,
                        dataType: "json",
                        data : {
                            client_id: soundcloudClientID //eslint-disable-line camelcase
                        },
                        success: function(data) {
                            that.videoTitle = data.title;
                            that.videoAuthor = data.user_id;
                            that.videoDuration = data.duration;
                            that.videoDescription = data.description;
                            that.videoUrl = data.permalink_url;

                            // Initialize UI
                            that.setupTitle();
                            that.setupVideoDescription();
                            that.setupPlyrToggle();
                        }
                    });
                }

                // Start video from where we left off, if it makes sense
                if (window.sessionStorage && window.sessionStorage.hasOwnProperty(videoID)) {
                    var resumeTime = window.sessionStorage[videoID];
                    var videoDuration = plyrPlayer.plyr.embed.getDuration();
                    if (!isNaN(resumeTime) && resumeTime < videoDuration - 3) {
                        plyrPlayer.plyr.embed.seekTo(resumeTime);
                    }
                }

                // Analytics
                ga("send", "event", "Playing YouTube video title", that.videoTitle);
                ga("send", "event", "Playing YouTube video author", that.videoAuthor);
                ga("send", "event", "Playing YouTube video duration (seconds)", that.videoDuration);
                // For some reason author is always an empty string, but not when inspected in the browser...
                // TODO: Commented out because need to implement for soundcloud too
/*
                sendKeenEvent("Playing YouTube video", {
                    author: plyrPlayer.plyr.embed.getVideoData().author,
                    title: plyrPlayer.plyr.embed.getVideoData().title,
                    seconds: plyrPlayer.plyr.embed.getDuration(),
                    youtubeID: plyrPlayer.plyr.embed.getVideoData().video_id
                });
*/

                // TODO: if there was a video error it will happen before here, check that and avoid showing the player
                // Show player
                that.show();
                updateTweetMessage();
            });

            plyrPlayer.addEventListener("timeupdate", function() {
                // Store the current time of the video.
                // TODO: Fix this for soundcloud too
/*
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
*/
            });

            plyrPlayer.plyr.source({
                type: "video",
                title: "Title",
                sources: [{
                    src: currentVideoID,
                    type: format
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

        return description;
    }
};

// TODO this is broken
function updateTweetMessage() {
/*
    var url = "https://ZenPlayer.Audio";

    var opts = {
        text: "Listen to YouTube videos without the distracting visuals",
        hashTags: "ZenAudioPlayer",
        url: url
    };

    getCurrentVideoID(
        {
            success: function(id) {
                opts.url += "/?v=" + id;
        //        opts.text = "I'm listening to " + plyrPlayer.plyr.embed.getVideoData().title;

                twttr.widgets.createHashtagButton(
                    "ZenAudioPlayer",
                    document.getElementById("tweetButton"),
                    opts
                );
            },
            fail: function(id) {
            }
        }
    );
*/
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

function getCurrentVideoID(success, error) {
    var v = getParameterByName(window.location.search, "v");
    // If the URL had 2 v parameters, try parsing the second (usually when ?v=someurl&v=xyz)
    var vParams = window.location.search.match(/v=\w+/g);
    if (vParams && vParams.length > 1) {
        v = vParams[vParams.length - 1].replace("v=", "");
    }

    if (v.length > 1) {
        wrapParseVideoID(
            v,
            function(id) {
                success(id);
            },
            function() {
                error(v);
            }
        );
    }
    else {
        error();
    }
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

function wrapParseVideoID(url, success, error) {
    if (currentVideoID && url === currentVideoID) {
        // We have already determined the video id
        success(currentVideoID);
    }
    else {
        // First try parse Soundcloud id from URL.
        parseSoundcloudVideoID(
            url,
            soundcloudClientID,
            function(info) {
                // Success parsed ID from Soundcloud URL.

                if (info.format === "soundcloud.com") {
                    // Don't need to verify from this format
                    // because the id was request from Soundcloud API
                    // which means that it is already valid.
                    success(info.id);
                }
                else {
                    // Verify id from all other format
                    verifyID(
                        info.id,
                        function() {
                            ga("send", "event", "video ID format", info.format);
                            currentVideoID = info.id;
                            success(info.id);
                        },
                        error
                    );
                }
            },
            function(info) {
                // Failed, so next try parse Youtube ID from URL.
                info = parseYoutubeVideoID(url);

                var id;

                // If success parse ID from a Youtube URL, verify it.
                // Otherwise, verify the original string incase it is already an ID.
                if (info.id) {
                    id = info.id;
                }
                else {
                    id = url;
                }

                verifyID(
                    id,
                    function() {
                        // Success parsed Youtube ID.
                        ga("send", "event", "video ID format", info.format);
                        currentVideoID = id;
                        success(id);
                    },
                    error
                );
            }
        );
    }
}

function verifyYoutubeID(id, success, error) {
    $.ajax({
        url: "https://www.googleapis.com/youtube/v3/videos",
        dataType: "json",
        data: {
            key: youTubeDataApiKey,
            part: "snippet",
            fields: "items/snippet/description",
            id: id
        },
        success: function(data) {
            if (data.items.length === 0) {
                error();
            }
            else {
                success();
            }
        }
    }).fail(error);
}

function verifySoundcloudID(id, success, error) {
    $.ajax({
        url: "https://api.soundcloud.com/tracks/" + id + "?client_id=" + soundcloudClientID,
        dataType: "json",
        success: function(data) {
            if (data.id && data.id.toString() === id.toString()) {
                success();
            }
            else {
                error();
            }
        }
    }).fail(error);
}

// Verifies ID for youtube and soundcloud
function verifyID(id, success, error) {
    verifyYoutubeID(
        id,
        success,
        function() {
            verifySoundcloudID(
                id,
                success,
                error
            );
        });
}

$(function() {
    // Keen.io
    client = new Keen({ //eslint-disable-line no-undef
        projectId: "5690c384c1e0ab0c8a6c59c4",
        writeKey: "630fa16847ce5ffb01c9cc00327498e4e7716e0f324fb14fdf0e83ffc06f9eacff5fad1313c2701efe4a91c88c34b8d8153cbb121c454056bb63caf60a46336dd9c9e9855ecc5202ef3151d798eda40896d5111f44005c707cbfb32c7ae31070d129d6f520d5604fdbce5ad31e9c7232"
    });

    errorMessage.init();

    /*
     * Check if we should play a video/track.
     * If there's no id (v=), then we may get search results for the query (q=).
     */
    getCurrentVideoID(
        function(videoID) {
            // Able to get an id (v=) from the url.
            // Proceed to set up a player and try to play it.

            // Set the global current video id.
            currentVideoID = videoID;

            // Preload the form from the URL.
            $("#v").attr("value", currentVideoID);

            // Load the player.
            ZenPlayer.init(currentVideoID);
        },
        function(value) {
            // Couldn't get an id (v=) from the url.
            // If there was a v=, then try to get search results for it.
            // If there wasn't a v=, then get search requests for q=
            var currentSearchQuery;

            if (value) {
                currentSearchQuery = value;
            }
            else {
                currentSearchQuery = getCurrentSearchQuery();
            }

            if (currentSearchQuery) {
                // Preload the form with the search query from the URL.
                $("#v").attr("value", currentSearchQuery);

                // Get search results using the search query string.
                getSearchResults(
                    currentSearchQuery,
                    youTubeDataApiKey,
                    // Success
                    function(data) {
                        if (data.pageInfo.totalResults === 0) {
                            errorMessage.show("No results.");
                        }
                        else {

                            $("#search-results").show();

                            // Clear out results
                            $("#search-results ul").html("");

                            // Add each result to the results list.
                            var start = "<li><h4><a href=?v=";
                            var end = "</a></h4></li>";
                            $.each(data.items, function(index, result) {
                                $("#search-results ul").append(start + result.id.videoId + ">" + result.snippet.title  + end);
                            });
                        }
                    },
                    // Fail
                    function(jqXHR, textStatus, errorThrown) {
                        logError(jqXHR, textStatus, errorThrown, "Search error");
                    }
                );
            }
        }
    );

    /*
     * Autocomplete with youtube suggested queries.
     */
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


    /*
     * Handle form submission.
     */
    // TODO: Need to test this to make sure that nothing broke.
    $("#form").submit(function(event) {
        event.preventDefault();

        // Get the value in the form and if possible, play it by redirecting with (v=).
        // Otherwise search for the term by redirecting with (q=).
        var formValue = $.trim($("#v").val());
        if (formValue) {
            ga("send", "event", "form submitted", formValue);
            sendKeenEvent("Form submitted", {videoID: formValue});

            // Assume that the value is a URL, and try to get an ID from it.
            wrapParseVideoID(
                formValue,
                function(id) {
                    // Success parsed a valid id.
                    window.location.href = makeListenURL(id);
                },
                function() {
                    // Couldn't parse an ID, form value might already be an ID
                    window.location.href = makeSearchURL(formValue);
                }
            );
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
