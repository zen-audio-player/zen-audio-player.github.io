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

function makeYoutubeEmbedURL(videoID) {
    var head = "http://www.youtube.com/embed/";
    var tail = "?enablejsapi=1&origin=shakeelmohamed.com&autoplay=1";
    if (videoID) {
        return head + videoID + tail;
    }
    else {
        // Swallow error
        console.log("The videoID in makeYoutubeEmbedURL was bad");
    }
}

function makeListenURL(videoID) {
    var url = window.location.href;
    if (window.location.search.length !== 0) {
        url = window.location.href.replace(window.location.search, "");
    }
    return url + "?v=" + videoID;
}

// The url parameter could be the video ID
function parseYoutubeVideoID(url) {
    var videoID = null;

    var shortUrlDomain = "youtu.be";
    var longUrlDomain = "youtube.com";

    if (url) {
        // youtube.com format
        if (url.indexOf(longUrlDomain) !== -1) {
             videoID = getParameterByName(url, "v");
        }
        // youtu.be format
        else if (url.indexOf(shortUrlDomain) !== -1) {
            var endPosition = url.indexOf("?") === -1 ? url.length : url.indexOf("?");
            var offset = url.indexOf(shortUrlDomain) + shortUrlDomain.length + 1; // Skip over the slash also
            videoID = url.substring(offset, endPosition);
        }
        // Assume YouTube video ID string
        else {
            videoID = url;
        }
        return videoID;
    }
    alert("Failed to parse the video ID.");
}

$(function() {
    // Parse the querystring and populate the video when loading the page
    var currentVideoID = getCurrentVideoID();
    if (currentVideoID) {
        $("#player").attr("src", makeYoutubeEmbedURL(currentVideoID));
        $("#query").attr("value", currentVideoID);
    }

    // Handle form submission
    $("#form").submit(function(event) {
        event.preventDefault();
        var formValue = $("#query").val();
        if (formValue) {
            var videoID = parseYoutubeVideoID(formValue);
            window.location.href = makeListenURL(videoID);
        }
        else {
            alert("Try entering a YouTube video id or URL!");
        }
    });
});

// Google Analytics goodness
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-36907845-2', 'shakeelmohamed.com');
ga('require', 'displayfeatures');
ga('send', 'pageview');