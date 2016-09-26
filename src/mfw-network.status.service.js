(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @module mfw.network.status
   * @name mfw.network.status
   *
   * @description
   * # Description
   *
   * This module detects network status (online/offline).
   *
   * Service {@link mfw.network.status.service:$mfwNetwork `$mfwNetwork`} provides network status API and a callback
   * registration API to be notified when network status changes.
   *
   * # Features
   *
   * * Platform-dependent implementation of underlying network status.
   * * Event-driven API to detect status changes.
   * * Endpoint status based on HTTP response codes (Internet connection but server is down).
   */
  var NetworkModule = angular.module('mfw.network.status', []);

  /**
   * @ngdoc service
   * @name mfw.network.status.service:$mfwHtml5NetworkStatus
   *
   * @description
   * Network status detection based on {@link https://developer.mozilla.org/en-US/docs/Online_and_offline_events HTML5} API.
   */
  NetworkModule.factory('$mfwHtml5NetworkStatus', html5NetworkStatus);
  html5NetworkStatus.$inject = ['$log', '$window'];
  function html5NetworkStatus($log, $window) {
    var service = {
      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwHtml5NetworkStatus#isOnline
       * @methodOf mfw.network.status.service:$mfwHtml5NetworkStatus
       *
       * @description
       * Returns whether the network is considered online or not.
       *
       * @returns {boolean} Whether network is online or not.
       */
      isOnline: function () {
        return navigator.onLine;
      },
      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwHtml5NetworkStatus#isOffline
       * @methodOf mfw.network.status.service:$mfwHtml5NetworkStatus
       *
       * @description
       * Returns whether the network is considered offline or not.
       *
       * @returns {boolean} Whether network is offline or not.
       */
      isOffline: function () {
        return !navigator.onLine;
      },
      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwHtml5NetworkStatus#onOnline
       * @methodOf mfw.network.status.service:$mfwHtml5NetworkStatus
       *
       * @description
       * Register a new callback to be executed when network turns up.
       *
       * @param {Function} cb Callback.
       *
       * @returns {Function} Deregister callback.
       */
      onOnline: function (cb) {
        var listener = cb;
        $window.addEventListener('online', listener, false);

        return function deregisterOnOnline() {
          $window.removeEventListener('online', listener);
        };
      },
      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwHtml5NetworkStatus#onOffline
       * @methodOf mfw.network.status.service:$mfwHtml5NetworkStatus
       *
       * @description
       * Register a new callback to be executed when network turns down.
       *
       * @param {Function} cb Callback.
       *
       * @returns {Function} Deregister callback.
       */
      onOffline: function (cb) {
        var listener = cb;
        $window.addEventListener('offline', listener, false);

        return function deregisterOnOffline() {
          $window.removeEventListener('offline', listener);
        };
      }
    };
    return service;
  }


  /**
   * @ngdoc service
   * @name mfw.network.status.$mfwNetworkProvider
   *
   * @description
   * Provider of {@link mfw.network.status.service:$mfwNetwork `$mfwNetwork`} service.
   */
  NetworkModule.provider('$mfwNetwork', NetworkProvider);
  NetworkProvider.$inject = [];
  function NetworkProvider() {
    var defaultOptions = {
      networkStatusService: '$mfwHtml5NetworkStatus',
      downStatusCodes: [
        // No Internet
        0,
        // Bad Gateway
        502,
        // Service Unavailable
        503,
        // Gateway Timeout
        504
      ]
    };

    /**
     *
     * @type {Object.<string, boolean>}
     */
    var endpointStatus = {};

    /**
     * @ngdoc function
     * @name mfw.network.status.$mfwNetworkProvider#config
     * @methodOf mfw.network.status.$mfwNetworkProvider
     *
     * @description
     * Configure underlying network status detection and endpoint-specific status codes.
     *
     * @param {object} options Options
     * @param {string=} options.networkStatusService
     *    Name of the service implementing the underlying network status.
     *
     *    Defaults to `$mfwHtml5NetworkStatus`.
     * @param {number[]=} options.downStatusCodes
     *    Array of HTTP status codes that makes the server considered down.
     *
     *    Defaults to `[0, 502, 503, 504]`.
     */
    this.config = function (options) {
      defaultOptions = angular.extend({}, defaultOptions, options || {});
    };

    this.$get = ['$log', '$q', '$injector', '$rootScope', '$timeout', function ($log, $q, $injector, $rootScope, $timeout) {
      /**
       * @description
       * Registered callbacks for endpoint status changes.
       *
       * @type {{string, Function[]}}
       */
      var endpointStatusCallbacks = {};
      /**
       * @description
       * Registered callbacks for endpoint matchers status changes.
       *
       * @type {{string, Function[]}}
       */
      var matcherStatusCallbacks = {};

      /**
       * @description
       * Platform-specific implementation of network status.
       *
       * The service is retrieved using {@link mfw.network.status.$mfwNetworkProvider#methods_config configured} `networkStatusService`.
       */
      var networkStatusService = $injector.get(defaultOptions.networkStatusService);

      /**
       * @ngdoc service
       * @name mfw.network.status.service:$mfwNetwork
       *
       * @description
       *
       * Service that provides information and event-driven API about network status updates (online/offline) and
       * specific endpoint status depending on its status codes.
       *
       * ## Internet connection
       *
       * `$mfwNetwork` service relies on a platform-specific implementations of network status detection:
       *
       * * Plain {@link https://developer.mozilla.org/en-US/docs/Online_and_offline_events HTML5} implementation
       * * {@link mfw-ionic.network.status Ionic} implementation using plugins
       * * ...
       *
       * ### Platform specific implementation
       *
       * Configure the underlying implementation via {@link mfw.network.status.$mfwNetworkProvider#methods_config
       * `$mfwNetworkProvider.config(options)`} method by setting proper `networkStatusService` AngularJS service name.
       *
       *
       * Platform-specific implementations must implement the following methods:
       *
       * * `isOnline(): boolean`: `true` if network is online, `false` otherwise.
       * * `isOffline(): boolean`: `true` if network is offline, `false` otherwise.
       * * `onOnline(cb: Function): Function`: registers a `cb` callback function to be triggered when entering online mode
       *      and returns a deregistration function.
       * * `onOffline(cb: Function): Function`: registers a `cb` callback function to be triggered when entering offline mode
       *      and returns a deregistration function.
       *
       *
       * ## Endpoint status
       *
       * Consider your application is online (either mobile device or computer has Internet connection) but your server
       * endpoint (e.g. `http://yourdomain/your-api`) is down (bad gateway, service unavailable, etc.):
       *
       * * {@link mfw.network.status.service:$mfwNetwork#methods_isOnline `isOnline()`} will return `true`.
       * * {@link mfw.network.status.service:$mfwNetwork#methods_isEndpointUp `isEndpointUp('http://yourdomain/your-api')`} will return `false`.
       *
       * Endpoint status are calculated using interceptors of each HTTP status code.
       *
       * Provided implementations:
       *
       * * {@link mfw.network.status.service:$mfwNgHttpEndpointStatus `$mfwNgHttpEndpointStatus`}: implemented
       *    as a {@link https://docs.angularjs.org/api/ng/service/$http#interceptors `$http` interceptor}.
       * * {@link mfw.network.status-restangular.service:$mfwRestangularEndpointStatus `$mfwRestangularEndpointStatus`}:
       *    implemented as {@link https://github.com/mgonto/restangular Restangular}
       *    {@link https://github.com/mgonto/restangular#seterrorinterceptor error interceptor}
       *    and {@link https://github.com/mgonto/restangular#addresponseinterceptor response interceptor}.
       */
      var service = {
        isOnline: isOnline,
        isOffline: isOffline,
        isEndpointUp: isEndpointUp,

        onOnline: onOnline,
        onOffline: onOffline,

        onEndpointStatusChange: onEndpointStatusChange,
        setEndpointStatus: setEndpointStatus,
        endpointUrlMatcher: endpointUrlMatcher
      };

      initialize();

      return service;

      ////////////////////

      /**
       * @description
       * Initializer method, to be called when module is loaded.
       *
       * @private
       */
      function initialize() {
        networkStatusService.onOnline(function () {
          $log.debug('Network is UP: online mode.');
        });
        networkStatusService.onOffline(function () {
          $log.debug('Network is DOWN: offline mode.');
        });
      }

      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwNetwork#isOnline
       * @methodOf mfw.network.status.service:$mfwNetwork
       *
       * @description
       * Returns whether the network is considered online or not.
       *
       * @returns {boolean} Whether network is online or not.
       */
      function isOnline() {
        return networkStatusService.isOnline();
      }

      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwNetwork#isOffline
       * @methodOf mfw.network.status.service:$mfwNetwork
       *
       * @description
       * Returns whether the network is considered offline or not.
       *
       * @returns {boolean} Whether network is offline or not.
       */
      function isOffline() {
        return networkStatusService.isOffline();
      }

      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwNetwork#isEndpointUp
       * @methodOf mfw.network.status.service:$mfwNetwork
       *
       * @description
       * Returns whether an endpoint is {@link mfw.network.status.$mfwNetworkProvider#methods_config considered online}
       * or not based on recent HTTP requests.
       *
       * @param {string|RegExp} endpoint Endpoint URL string or
       *    {@link mfw.network.status.service:$mfwNetwork#methods_endpointUrlMatcher URL matcher}.
       *
       * @returns {boolean=} Whether endpoint is online or not.
       */
      function isEndpointUp(endpoint) {
        if (angular.isString(endpoint)) {
          // Specific URL
          if (endpoint in endpointStatus) {
            // Cached status
            return endpointStatus[endpoint];
          }
        } else {
          // RegExp
          var isUp;
          for (var cachedEndpoint in endpointStatus) {
            if (endpoint.exec(cachedEndpoint)) {
              if (endpointStatus[cachedEndpoint]) {
                // Found one endpoint online
                return true;
              } else {
                // Found one endpoint status but it was offline. Check next one.
                isUp = false;
              }
            }
          }
          return isUp;
        }
      }

      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwNetwork#onOnline
       * @methodOf mfw.network.status.service:$mfwNetwork
       *
       * @description
       * Register a new callback to be executed when network turns up.
       *
       * @param {Function} cb Callback.
       *
       * @returns {Function} Deregister callback.
       */
      function onOnline(cb) {
        return networkStatusService.onOnline(cb);
      }

      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwNetwork#onOffline
       * @methodOf mfw.network.status.service:$mfwNetwork
       *
       * @description
       * Register a new callback to be executed when network turns down.
       *
       * @param {Function} cb Callback.
       *
       * @returns {Function} Deregister callback.
       */
      function onOffline(cb) {
        return networkStatusService.onOffline(cb);
      }

      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwNetwork#onEndpointStatusChange
       * @methodOf mfw.network.status.service:$mfwNetwork
       *
       * @description
       * Register a new callback for online/offline status changes for a specific endpoint.
       *
       * @param {string|RegExp} endpoint Endpoint URL string or
       *    {@link mfw.network.status.service:$mfwNetwork#methods_endpointUrlMatcher URL matcher}.
       * @param {Function} cb Callback.
       *
       * @returns {Function} Deregister callback.
       */
      function onEndpointStatusChange(endpoint, cb) {
        _registerEndpointStatusListener(endpoint, cb);

        // Deregister callback. function
        return function deregisteronEndpointStatusChange() {
          _deregisterEndpointStatusListener(endpoint, cb);
        };
      }

      /**
       * @typedef {object} HttpResponse
       * The response object has these properties:
       *
       * @property {string|Object} data - The response body transformed with the transform functions.
       * @property {number} status - HTTP status code of the response.
       * @property {function} headers - Header getter function.
       * @property {Object} config - The configuration object that was used to generate the request.
       * @property {string} statusText - HTTP status text of the response.
       *
       * @see {@link https://docs.angularjs.org/api/ng/service/$http#general-usage}
       */
      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwNetwork#setEndpointStatus
       * @methodOf mfw.network.status.service:$mfwNetwork
       *
       * @description
       * Sets an specific endpoint status (online/offline) based on last request response.
       *
       * @param {string} endpoint Endpoint URL.
       * @param {HttpResponse} response Request {@link https://docs.angularjs.org/api/ng/service/$http#general-usage response}.
       * @returns {boolean} Whether response status is considered online or not.
       *
       * @see {@link mfw.network.status.$mfwNetworkProvider#config}
       */
      function setEndpointStatus(endpoint, response) {
        var currentStatus = endpointStatus[endpoint];
        if (arguments.length === 2) {
          var newStatus = _isOnlineStatus(response);
          endpointStatus[endpoint] = newStatus;

          if (currentStatus !== newStatus) {
            $log.debug('Endpoint', endpoint, 'status changed to online =', newStatus);
            currentStatus = newStatus;

            // Notify listeners
            $timeout(function notifyEndpointStatusChanged() {
              _triggerOnEndPointStatusChange(endpoint, newStatus);
            });
          }
        }
        return currentStatus;
      }

      /**
       * @ngdoc method
       * @name mfw.network.status.service:$mfwNetwork#endpointUrlMatcher
       * @methodOf mfw.network.status.service:$mfwNetwork
       *
       * @description
       * This function returns a `RegExp` object to match a specific URL address as base URL for other URL strings.
       *
       * @param {string} url URL to match.
       * @returns {RegExp} URL matcher.
       */
      function endpointUrlMatcher(url) {
        var regexpString = _endpointUrlRegExp(url);
        return new RegExp(regexpString);
      }

      function _endpointUrlRegExp(url) {
        return '^' + url.replace(/([\:\/\.\?])/g, '\\$1');
      }

      /**
       * @description
       *
       * @param {HttpResponse} response $http response.
       * @param {number} response.status HTTP status code.
       * @returns {boolean} Whether status code lets the endpoint to  be considered online or not.
       *
       * @see {@link mfw.network.status.$mfwNetworkProvider#config}
       *
       * @private
       */
      function _isOnlineStatus(response) {
        return defaultOptions.downStatusCodes.indexOf(response.status) === -1;
      }

      /**
       * @description
       *
       * @param {string|RegExp} endpoint Endpoint URL string or
       *    {@link mfw.network.status.service:$mfwNetwork#methods_endpointUrlMatcher URL matcher}.
       * @param {Function} cb Callback.
       * @private
       */
      function _registerEndpointStatusListener(endpoint, cb) {
        // Different storage: per-URL vs per-RegExp
        var storage;
        if (angular.isString(endpoint)) {
          storage = endpointStatusCallbacks;
        } else {
          storage = matcherStatusCallbacks;
          // Store regexp string
          endpoint = endpoint.source;
        }

        // Register
        if (!(endpoint in storage)) {
          storage[endpoint] = [];
        }
        storage[endpoint].push(cb);
      }

      /**
       * @description
       *
       * @param {string|RegExp} endpoint Endpoint URL string or
       *    {@link mfw.network.status.service:$mfwNetwork#methods_endpointUrlMatcher URL matcher}.
       * @param {Function} cb Callback.
       * @private
       */
      function _deregisterEndpointStatusListener(endpoint, cb) {
        // Different storage: per-URL vs per-RegExp
        var storage;
        if (angular.isString(endpoint)) {
          storage = endpointStatusCallbacks;
        } else {
          storage = matcherStatusCallbacks;
          // Store regexp string
          endpoint = endpoint.source;
        }

        // Deegister
        var index = storage[endpoint].indexOf(cb);
        storage[endpoint].splice(index, 1);
      }

      /**
       * @description
       * Invokes all registered callbacks for a specific endpoint with its new status.
       *
       * @param {string} endpoint Endpoint URL.
       * @param {boolean} isOnline Whether the endpoint is online or not.
       * @private
       */
      function _triggerOnEndPointStatusChange(endpoint, isOnline) {
        $log.debug('Triggering endpoint status changed for endpoint', endpoint, 'online =', isOnline);

        // Trigger listeners of that specific URL
        angular.forEach(endpointStatusCallbacks[endpoint], notifyEndpointListener);

        // Trigger listeners of URL matchers
        for (var regExp in matcherStatusCallbacks) {
          if (endpoint.match(regExp)) {
            angular.forEach(matcherStatusCallbacks[endpoint], notifyEndpointListener);
          }
        }

        function notifyEndpointListener(cb) {
          cb(isOnline, endpoint);
        }
      }
    }];
  }
})();
