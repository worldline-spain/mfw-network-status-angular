(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @module mfw.network.status-restangular
   * @name mfw.network.status-restangular
   *
   * @requires mfw.network.status
   * @requires restangular
   *
   * @description
   * # Description
   *
   * This module registers the following {@link https://github.com/mgonto/restangular Restangular} interceptors:
   *
   * * {@link https://github.com/mgonto/restangular#seterrorinterceptor error interceptor}
   * * {@link https://github.com/mgonto/restangular#addresponseinterceptor response interceptor}
   */
  var NetworkModule = angular.module('mfw.network.status-restangular', [
    'mfw.network.status',
    'restangular'
  ]);


  /**
   * Ensure service is instantiated at least once.
   */
  NetworkModule.run(instantiateService);
  instantiateService.$inject = ['$mfwRestangularEndpointStatus'];
  function instantiateService($mfwRestangularEndpointStatus) {
    // Do nothing
  }


  /**
   * @ngdoc service
   * @name mfw.network.status-restangular.$mfwRestangularEndpointStatusProvider
   *
   * @description
   * Provider of {@link mfw.network.status-restangular.service:$mfwRestangularEndpointStatus `$mfwRestangularEndpointStatus`} service.
   */
  NetworkModule.provider('$mfwRestangularEndpointStatus', restangularEndpointStatus);
  restangularEndpointStatus.$inject = ['RestangularProvider'];
  function restangularEndpointStatus() {
    /**
     * @type {Object}
     */
    var defaultOptions = {
      restangularConfig: []
    };

    /**
     * @ngdoc function
     * @name mfw.network.status-restangular.$mfwRestangularEndpointStatusProvider#config
     * @methodOf mfw.network.status-restangular.$mfwRestangularEndpointStatusProvider
     *
     * @description
     * Configure generic options to be used on each new browser launched.
     *
     * @param {object} options Options
     * @param {string[]=} options.restangularConfig Array of Restangular configuration service names.
     */
    this.config = function (options) {
      angular.extend(defaultOptions, options || {});
    };


    this.$get = ['$log', '$injector', '$mfwNetwork', function ($log, $injector, $mfwNetwork) {
      /**
       * @ngdoc service
       * @name mfw.network.status-restangular.service:$mfwRestangularEndpointStatus
       *
       * @description
       * Service that registers error and response interceptors for all specified Restangular configurations and
       * {@link mfw.network.status.service:$mfwNetwork#methods_setEndpointStatus notifies `$mfwNetwork`}
       * for each HTTP response.
       */
      var service = {};
      initialize();
      return service;

      //////////////////////////////

      function initialize() {
        var services = _restangularConfiguration();
        angular.forEach(services, function (serviceName) {
          $log.debug('Adding response interceptor to restangular service', serviceName);
          var restangular = $injector.get(serviceName);

          // Add error interceptor
          restangular.setErrorInterceptor(_restangularErrorInterceptor);
          restangular.addResponseInterceptor(_restangularResponseInterceptor);
        });
      }

      /**
       * @description
       * Restangular error interceptor.
       *
       * Notifies {@link mfw.network.status-restangular.service:$mfwNetwork#methods_setEndpointStatus `$mfwNetwork.setEndpointStatus()`} with
       * last request results.

       * @param response
       * @param deferred
       * @param responseHandler
       * @returns {boolean}
       * @private
       */
      function _restangularErrorInterceptor(response, deferred, responseHandler) {
        var url = response.config.url;
        $mfwNetwork.setEndpointStatus(url, response);
        // Error not handled
        return true;
      }

      /**
       * @description
       * Restangular response interceptor.
       *
       * Notifies {@link mfw.network.status-restangular.service:$mfwNetwork#methods_setEndpointStatus `$mfwNetwork.setEndpointStatus()`} with
       * last request results.
       *
       * @param data
       * @param operation
       * @param what
       * @param url
       * @param response
       * @param deferred
       * @returns {*}
       * @private
       */
      function _restangularResponseInterceptor(data, operation, what, url, response, deferred) {
        // Notify $mfwNetwork
        $mfwNetwork.setEndpointStatus(url, response);
        // Return the same data
        return data;
      }

      /**
       *
       * @returns {String[]}
       * @private
       */
      function _restangularConfiguration() {
        var restConf = defaultOptions.restangularConfig;
        var result = [];

        if (angular.isFunction(restConf)) {
          result = restConf();
        } else if (angular.isString(restConf)) {
          result.push(restConf);
        } else if (angular.isArray(restConf)) {
          result = result.concat(restConf);
        }

        return result;
      }
    }];
  }
})();
