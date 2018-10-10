TrackJS
===============

The JavaScript Browser Agent for JavaScript Browser Error Monitoring from TrackJS.

The agent wraps the Browser's API to record context about your application, the network, and the visitor leading up to errors, allowing you to recreate and debug errors fast.

**[Signup for TrackJS](https://trackjs.com/signup?utm_source=repository)**.

**[Documentation](http://docs.trackjs.com/)**

## Quickstart

1. [Signup for TrackJS](https://trackjs.com/signup?utm_source=repository) and get your token.
2. Create a `_trackJs` initialization object in your app:

    ```javascript
    window._trackJs = { // Complete reference at http://docs.trackjs.com/
      token: 'YOUR_TOKEN_HERE'
    };
    ```

3. Include the `tracker.js` script in your app, after the initialization object. You can either reference directly, or bundle it into your other sources. We recommend that `tracker.js` be the first script to execute so that it can catch errors from everything else.

4. Test it out by tracking an error, either in your code or from the console: `trackJs.track('testing!')`

5. See the new error in your [TrackJS Recent Errors](https://my.trackjs.com/recent) within a few seconds.

If you run into any trouble, let us know right away at `hello@trackjs.com`
