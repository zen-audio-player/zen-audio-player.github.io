/* eslint-disable no-unused-vars */
function getParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getSearchResults(query, youTubeDataApiKey, onData, onFail) {
    $.getJSON("https://www.googleapis.com/youtube/v3/search", {
        key: youTubeDataApiKey,
        part: "snippet",
        q: query,
        type: "video"
    }, onData).fail(onFail);
}

function getAutocompleteSuggestions(query, callback) {
    $.getJSON("https://suggestqueries.google.com/complete/search?callback=?", {
        q: query,
        client: "youtube",
        ds: "yt"
    }, callback);
}

function getYouTubeVideoDescription(videoID, youTubeDataApiKey, onSuccess, onFail) {
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
        success: onSuccess
    }).fail(onFail);
}

function verifySoundcloudID(id, clientID, success, error) {
    $.ajax({
        url: "https://api.soundcloud.com/tracks/" + id + "?client_id=" + clientID,
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

function parseSoundcloudVideoID(url, clientID, success, error) {
    var videoInfo = {
        format: null,
        id: null
    };

    // https://api.soundcloud.com/tracks/123456
    var apiUrl = "api.soundcloud.com";
    // https://soundcloud.com/user-123/track-abc
    var trackUrl = "soundcloud.com";

    if (url && url.length > 0) {
        // soundcloud.com format
        if (url.indexOf(apiUrl) !== -1) {
            videoInfo.format = apiUrl;
            videoInfo.id = url.split("api.soundcloud.com/tracks/")[1];

            // Got the ID from the URL. Now verify it.
            verifySoundcloudID(
                videoInfo.id,
                clientID,
                function() {
                    success(videoInfo);
                },
                error
            );
        }
        // api.soundcloud.com format
        else if (url.indexOf(trackUrl) !== -1) {
            videoInfo.format = trackUrl;
            // id is not available in url, so request it
            $.ajax({
                url: "http://api.soundcloud.com/resolve",
                dataType: "json",
                data: {
                    url: url,
                    client_id: clientID // eslint-disable-line camelcase
                },
                success: function(data) {
                    videoInfo.id = data.id;
                    success(videoInfo);
                }
            }).fail(error);
        }
        else {
            error();
        }
    }
    else {
        error();
    }
}

// The url parameter could be the video ID
function parseYoutubeVideoID(url, soundcloudClientID, success, error) {
    var videoInfo = {
        format: null,
        id: null
    };
    var shortUrlDomain = "youtu.be";
    var longUrlDomain = "youtube.com";

    if (url && url.length > 0) {
        // youtube.com format
        if (url.indexOf(longUrlDomain) !== -1) {
            videoInfo.format = longUrlDomain;
            videoInfo.id = getParameterByName(url, "v");
        }
        // youtu.be format
        else if (url.indexOf(shortUrlDomain) !== -1) {
            videoInfo.format = shortUrlDomain;
            var endPosition = url.indexOf("?") === -1 ? url.length : url.indexOf("?");
            var offset = url.indexOf(shortUrlDomain) + shortUrlDomain.length + 1; // Skip over the slash also
            videoInfo.id = url.substring(offset, endPosition);
        }
        else {
            // format and id are null
        }
    }

    if (videoInfo.id) {
        var slashPos = videoInfo.id.indexOf("/");
        // We found a slash in the video ID (ex: real id is ABC123, but saw ABC123/zen)
        // So, only keep what's before the slash
        if (slashPos !== -1) {
            videoInfo.id = videoInfo.id.substring(0, slashPos);
        }

        // Parsed an ID from the URL, verify it.
        verifySoundcloudID(
            videoInfo.id,
            soundcloudClientID,
            function() {
                success(videoInfo);
            },
            error
        );
    }
    else {
        error();
    }
}

/* eslint-enable */