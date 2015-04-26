function getParameterByName(url, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var head = "http://www.youtube.com/embed/";
var tail = "?enablejsapi=1&origin=shakeelmohamed.com&autoplay=1";

$(function() {
    $("#form").submit(function(event) {
        event.preventDefault();
        var formValue = $("#query").val();
        if (formValue) {
            var shortUrlDomain = "youtu.be";
            var url = head;
            
            // YouTube video URL string, parse the v parameter
            if (formValue.indexOf("youtube.com") !== -1) {
                 url += getParameterByName(formValue, "v");
            }
            else if (formValue.indexOf(shortUrlDomain) !== -1) {
                var endPosition = formValue.indexOf("?") === -1 ? formValue.length : formValue.indexOf("?");
                var offset = formValue.indexOf(shortUrlDomain) + shortUrlDomain.length + 1; // Skip over the slash also
                url += formValue.substring(offset, endPosition);
            }
            else {
                // YouTube video ID string
                url += formValue;
            }
            
            $("#player").attr("src", url + tail);
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