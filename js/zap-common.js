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

function getYouTubeListItems(listID, youTubeDataApiKey, onSuccess, onFail) {
    // Request the video description
    $.ajax({
        url: "https://www.googleapis.com/youtube/v3/playlistItems",
        dataType: "json",
        async: false,
        data: {
            key: youTubeDataApiKey,
            part: "snippet",
            id: listID
        },
        success: onSuccess
    }).fail(onFail);
}

// The url parameter could be the video ID
function parseYoutubeVideoID(url) {
    var videoInfo = {
        format: "other",
        id: null
    };
    var shortUrlDomain = "youtu.be";
    var longUrlDomain = "youtube.com";
    var playlistUrlElement = "&list=";

    if (url && url.length > 0) {
        // youtube playlist url
        if(url.indexOf(playlistUrlElement) !== -1) {
            videoInfo.format = "list";   
            videoInfo.listID = getParameterByName(url, "list");
            videoInfo.id = getParameterByName(url, "v");
        }
        // youtube.com format
        else if (url.indexOf(longUrlDomain) !== -1) {
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
        // Assume YouTube video ID string
        else {
            videoInfo.format = "video ID";
            videoInfo.id = url;
        }

        var slashPos = videoInfo.id.indexOf("/");
        // We found a slash in the video ID (ex: real id is ABC123, but saw ABC123/zen)
        // So, only keep what's before the slash
        if (slashPos !== -1) {
            videoInfo.id = videoInfo.id.substring(0, slashPos);
        }

        return videoInfo;
    }
}
/* eslint-enable */