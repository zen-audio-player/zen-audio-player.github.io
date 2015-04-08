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
            var url = head;
            // YouTube video ID string
            if (formValue.indexOf("youtube.com") === -1) {
                 url += formValue;
            }
            // YouTube video URL string, parse the v parameter
            else {
                url += getParameterByName(formValue, "v");
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