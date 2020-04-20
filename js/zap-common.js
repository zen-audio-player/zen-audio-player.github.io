/* eslint-disable no-unused-vars*/
/* global URI */

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

/**
 * Given a YouTube video ID, YouTube.com video URL, or YouTu.Be video URL, return an object
 * containing the method used to derive the ID, and the ID itself. The following were used to test;
 * FdeioVndUhs
 * https://youtu.be/FdeioVndUhs
 * https://www.youtube.com/watch?v=FdeioVndUhs&feature=youtu.be
 *
 * @param {string} uri - YouTube video ID, YouTube.com url, or YouTu.be url.
 * @returns {{format: string, id: string}} - Object containing format and YouTube ID.
 */
function parseYoutubeVideoID(uri) {
    var videoInfo = {
        format: "other",
        id: null
    };
    var shortUrlDomain = "youtu.be";
    var longUrlDomain = "youtube.com";

    var url = URI(uri);
    var domain = url.domain();

    if (uri && uri.length > 0) {
        // youtube.com format
        if (domain === longUrlDomain) {
            videoInfo.format = longUrlDomain;
            videoInfo.id = url.search(true).v;
        }
        // youtu.be format
        else if (domain === shortUrlDomain) {
            videoInfo.format = shortUrlDomain;
            videoInfo.id = url.path().slice(1);
        }
        // Assume YouTube video ID string
        else {
            videoInfo.format = "video ID";
            videoInfo.id = uri;
        }

        var slashPos = videoInfo.id.indexOf("/");
        // We found a slash in the video ID (ex: real id is ABC123, but saw ABC123/zen)
        // So, only keep what's before the slash
        if (slashPos !== -1) {
            videoInfo.id = videoInfo.id.substring(0, slashPos);
        }

        return videoInfo;
    }
}/* eslint-enable */