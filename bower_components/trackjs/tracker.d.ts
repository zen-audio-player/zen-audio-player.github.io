// Type definitions for tracker.js
// Project: https://github.com/TrackJS/trackjs-package

/** String formatted as an ISO-8601 Date. Example 0000-00-00T00:00:00.000Z */
interface ISO8601DateString extends String {}

/**
 * Payload of an error sent to TrackJS. Useful when manipulating errors via
 * the `onError` callback.
 */
interface TrackJSPayload {

  /**
   * Stack trace at time of asynchronous callback binding.
   */
  bindStack?: string;

  /**
   * Timestamp of the asynchronous callback binding.
   */
  bindTime?: ISO8601DateString;

  /**
   * Telemetry logs gathered from the console.
   */
  console: {

    /** Timestamp the event occurred */
    timestamp: ISO8601DateString;

    /** Console sevity of the event */
    severity: string;

    /** Formatted message captured */
    message: string;

  }[];

  /**
   * Context provided about the current customer (you)
   */
  customer: {

    /** Customer application id */
    application?: string;

    /** Unique Id describing the current page view */
    correlationId: string;

    /** Customer-provided visitor session ID */
    sessionId?: string;

    /** Customer token */
    token: string;

    /** Customer-provided visitor user ID */
    userId?: string;

    /** Customer-provided system version ID */
    version?: string;

  };

  /**
   * How the error was captured. Can be "window","direct","global", "ajax" or
   * "catch"
   */
  entry: string;

  /**
   * Context about the browser environment
   */
  environment: {

    /** How long the visitor has been on the page in MS */
    age: number;

    /**
     * Other discovered JavaScript libraries on the DOM. Hashmap of
     * name: version pairs.
     */
    dependencies: { [name: string]: string };

    /** browser userAgent string */
    userAgent: string;

    /** current window height */
    viewportHeight: number;

    /** current window width */
    viewportWidth: number;

  };

  /**
   * Custom environment metadata.
   */
  metadata: {

    /** metadata group name */
    key: string;

    /** metadata value */
    value: string;

  }[];

  /** Error message */
  message: string;

  /**
   * Telemetry logs gathered from the network.
   */
  network: {

    /** Timestamp the request started */
    startedOn: ISO8601DateString;

    /** Timestamp the request completed */
    completedOn: ISO8601DateString;

    /** HTTP Method used */
    method: string;

    /** URL Requested */
    url: string;

    /** HTTP Status Code */
    statusCode: number;

    /** HTTP Status Text */
    statusText: string;

  }[];

  /** location of the browser at the time of the error */
  url: string;

  /** stack trace */
  stack: string;

  /** client-reported time the error occurred */
  timestamp: ISO8601DateString;

  /**
   * Telemetry logs gathered from the visitor.
   */
  visitor: {

    /** timestamp the event occurred */
    timestamp: ISO8601DateString;

    /** visitor action taken. "input" or "click" */
    action: string;

    /** DOM element acted upon */
    element: {

      /** name of the element tag. IE "input" */
      tag: string;

      /** hashmap of element attributes */
      attributes: { [attributeName: string]: string };

      /** value of the element */
      value: {

        /** Number of characters in the value */
        length: number;

        /** Patterns describing the value. */
        pattern: string;

      };

    };

  }[];

  /** version of the tracker.js lib */
  version: string;

  /** Number of messages throttled clientside */
  throttled: number;

}

/**
 * Configuration options that can be passed to `trackJs.configure()`
 */
interface TrackJSOptions {

  /**
   * Whether duplicate errors should be suppressed before sending.
   * default true.
   */
  dedupe?: boolean;

  /**
   * Custom handler to be notified *before* an error is transmitted. Can be used
   * to modify or ignore error data.
   */
  onError?: (payload: TrackJSPayload) => boolean;

  /**
   * Custom handler for serializing non-string data in errors and telemetry
   * events.
   */
  serialize?: (what: any) => string;

  /**
   * Customer-provided identification of the visitor session. Use this to
   * correlate TrackJS Error reports with other reporting data.
   */
  sessionId?: string;

  /**
   * Customer-provided identification of the visitor. Use this to identify the
   * current user.
   */
  userId?: string;

  /**
   * Customer-provided identification of the running system. Use this to
   * identify the version of the code running. Recommend to use either a SEMVER
   * representation, or a VCS Hash Key.
   */
  version?: string;

}

/**
 * Configuration options that are initialized from `window._trackJs`
 */
interface TrackJSInitOptions extends TrackJSOptions {

  /**
   * Your account token. Get this from `https://my.trackjs.com/install`
   */
  token: string;

  /**
   * Whether the tracker script is enabled. Default true.
   */
  enabled?: boolean;

  /**
   * TrackJS Application token. Get this from `https://my.trackjs.com/Account/Applications`
   */
  application?: string;

  /**
   * Options for recording errors from native callback interfaces, such as
   * `setTimeout` and `addEventListener`.
   */
  callback?: {

    /**
     * Whether errors should be recorded when caught from callback functions.
     * default true.
     */
    enabled?: boolean;

    /**
     * Whether stack traces should be generated at the time of invocation of an
     * asynchronous action. This will produce stack traces similar to the
     * "async" traces in Chrome Developer tools.
     * There is a performance impact to enabling this. Confirm behavior in your
     * application before releasing.
     * default false.
     */
    bindStack?: boolean;

  };

  /**
   * Options for recording errors and telemetry from the console.
   */
  console?: {

    /**
     * Whether events should be recorded from the console.
     * default true.
     */
    enabled?: boolean;

    /**
     * Whether console messages should be passed through to the browser console
     * or hidden by TrackJS. Useful for removing debug messaging from production.
     * default true.
     */
    display?: boolean;

    /**
     * Whether an error should be recorded by a call to `console.error`.
     * default true.
     */
    error?: boolean;

    /**
     * Limit the console functions to be watched by whitelisting them here.
     * default ["log","debug","info","warn","error"]
     */
    watch?: string[];

  };

  /**
   * Options for recording errors and telemetry from the network.
   */
  network?: {

    /**
     * Whether events should be recorded from the network.
     * default true.
     */
    enabled?: boolean;

    /**
     * Whether an error should be recorded by XHR responses with status code
     * 400 or greater.
     * default true.
     */
    error?: boolean;

  };

  /**
   * Options for recording telemetry from the visitor.
   */
  visitor?: {

    /**
     * Whether events should be recorded from the visitor actions.
     * default true.
     */
    enabled?: boolean;

  };

  /**
   * Options for recording errors from the global window.
   */
  window?: {

    /**
     * Whether events should be recorded from globally unhandled errors.
     * default true.
     */
    enabled?: boolean;

    /**
      * Whether events should be recorded from globally unhandled promise
      * rejections, if supported. default true.
      */
    promise?: boolean;

  };

}

/**
 * The TrackJS global namespace for functions.
 */
interface TrackJSStatic {

  /**
   * Adds a new key-value pair to the metadata store. If the key already exists
   * it will be updated.
   *
   * @param {String} key
   * @param {String} value
   */
  addMetadata(key: string, value: string): void;

  /**
   * Invokes the provided function within a try/catch wrapper that forwards
   * the error to TrackJS.
   *
   * @param {Function} func The function to be invoked.
   * @param {Object} context The context to invoke the function with.
   * @param {...} Additional arguments passed to the function.
   * @return {*} Output of the function.
   */
  attempt(func: Function, context?: any, ...args: any[]): any;

  /**
   * Configures the instance of TrackJS with the provided configuration.
   *
   * @param {Object} options The Configuration object to apply
   * @returns {Boolean} True if the configuration was successful.
   */
  configure(options: TrackJSOptions): boolean;

  /**
    * Non-exposed browser console logging. Use this private console to prevent
    * messages from being exposed into the standard browser console.
    */
  console: {

    /**
      * Records context into the Telemetry log with normal severity
      *
      * @param {...} args Arguments to be serialized into the Telemetry log.
      */
    log(...args: any[]): void;

    /**
      * Records context into the Telemetry log with DEBUG severity
      *
      * @param {...} args Arguments to be serialized into the Telemetry log.
      */
    debug(...args: any[]): void;

    /**
     * Records context into the Telemetry log with INFO severity
     *
     * @param {...} args Arguments to be serialized into the Telemetry log.
     */
    info(...args: any[]): void;

    /**
     * Records context into the Telemetry log with WARN severity
     *
     * @param {...} args Arguments to be serialized into the Telemetry log.
     */
    warn(...args: any[]): void;

    /**
     * Records context into the Telemetry log with ERROR severity. If console
     * errors are enabled, which is default, this will also transmit an error.
     *
     * @param {...} args Arguments to be serialized into the Telemetry log.
     */
    error(...args: any[]): void;

  };

  /**
   * Removes a key from the metadata store, if it exists.
   *
   * @param {String} key
   */
  removeMetadata(key: string): void;

  /**
   * Directly invokes an error to be sent to TrackJS.
   *
   * @param {Error|Object|String} error The error to be tracked. If error does
   *        not have a stacktrace, will attempt to generate one.
   */
  track(error: Error | Object | String): void;

  /**
   * Returns a wrapped and watched version of the function to automatically
   * catch any errors that may arise.
   *
   * @param {Function} func The function to be watched.
   * @param {Object} context The context to invoke the function with.
   * @return {Function} Wrapped function
   */
  watch(func: Function, context?: any): Function;

  /**
   * Wrap and watch all of the functions on an object that will
   * automatically catch any errors that may arise.
   *
   * @param {Object} obj The Object containing functions to be watched
   * @return {Object} Object now containing wrapped functions.
   */
  watchAll(obj: Object): Object;

  /**
   * Running version of the tracker script
   */
  version: string;

}

/**
 * TrackJS initialization object, hanging off of the window.
 */
interface Window {
  _trackJs: TrackJSInitOptions
}

declare var trackJs: TrackJSStatic;
declare module "Tracker" {
  export = trackJs;
}
