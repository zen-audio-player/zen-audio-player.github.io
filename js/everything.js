var plyrPlayer;
var currentVideoID;
var youTubeDataApiKey = "AIzaSyCxVxsC5k46b8I-CLXlF3cZHjpiqP_myVk";

function initPlayer() {
    var currentVideoID = getCurrentVideoID();

    // Setup player
    if (currentVideoID) {
        if (plyrPlayer) {
            return;
        }
        setupPlyr();
    }
}

function setupPlyr() {
    plyrPlayer = document.querySelector(".plyr");

    plyr.setup(plyrPlayer, {
        autoplay: true,
        controls:["play", "current-time", "duration", "mute", "volume"]
    });
    //Inject svg with controls' icons
    $("#plyr-svg").load("../bower_components/plyr/dist/sprite.svg");

    plyrPlayer.addEventListener("ready", function(event) {
        onEmbedReady();
    });

    //Load video into Plyr player
    if (plyrPlayer.plyr) {
        plyrPlayer.plyr.source({
            type: "video",
            title: "Title",
            sources: [{
                src: currentVideoID,
                type: "youtube"
            }]
        });
    }
    //Show player
    $("#audioplayer").show();
    // When it is the player's first play, hide the youtube video
    $(".plyr__video-wrapper").hide();
}

function onEmbedReady() {
    setupSite();
    updateTweetMessage();
}

function setupSite() {
    // Gather video info
    var videoData = plyrPlayer.plyr.embed.getVideoData();
    var videoTitle = videoData.title;
    var videoAuthor = videoData.author;
    var videoDuration = plyrPlayer.plyr.embed.getDuration();
    var videoUrl = plyrPlayer.plyr.embed.getVideoUrl();
    var videoDescription = getVideoDescription(currentVideoID);

    // Google Analytics
    ga("send", "event", "Playing YouTube video title", videoTitle);
    ga("send", "event", "Playing YouTube video author", videoAuthor);
    ga("send", "event", "Playing YouTube video duration (seconds)", videoDuration);

    // Place stuff on page
    setupTitle(videoTitle, videoUrl);
    setupVideoDescription(videoDescription);

    // Show player button click event
    $("#togglePlayer").click(function(event) {
        event.preventDefault();

        var p = $(".plyr__video-wrapper");
        p.toggle();
        if (p.is(":visible")) {
            $("#togglePlayer").text("Hide Player");
        }
        else {
            $("#togglePlayer").text("Show Player");
        }
    });

}

function getVideoDescription(videoID) {
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
                var responseText = JSON.parse(jqXHR.error().responseText);
                errorMessage.show(responseText.error.errors[0].message);
                console.log("Video Description error", errorThrown);
            }
        );
    }

    return description;
}

function setupTitle(title, url) {
    // Prepend music note only if title does not already begin with one.
    var tmpVideoTitle = title;
    if (!/^[\u2669\u266A\u266B\u266C\u266D\u266E\u266F]/.test(tmpVideoTitle)) {
        tmpVideoTitle = "<i class=\"fa fa-music\"></i> " + tmpVideoTitle;
    }
    $("#zen-video-title").html(tmpVideoTitle);
    $("#zen-video-title").attr("href", url);
}

function setupVideoDescription(videoDescription) {
    var description = anchorURLs(videoDescription);
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
}

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
        opts.text = "I'm listening to " + plyrPlayer.plyr.embed.getVideoData().title;
    }

    twttr.widgets.createHashtagButton(
        "ZenAudioPlayer",
        document.getElementById("tweetButton"),
        opts
    );
}

var errorMessage = {
    init: function() {
        // nothing for now
    },
    show: function(message) {
        $("#zen-error").text("ERROR: " + message);
        $("#zen-error").show();

        // When the error message is shown, also hide the player
        $("#audioplayer").hide();
    },
    hide: function() {
        $("#zen-error").text("").hide();
    }
};

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

$(function() {
    initPlayer();
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
