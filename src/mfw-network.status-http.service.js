(function () {
  'use strict';

  var NetworkModule = angular.module('mfw.network.status');

  /**
   * This configuration method adds a new interceptor to all $http requests.
   *
   * The interceptor determines endpoint status based on status codes.
   */
  NetworkModule.config(addHttpInterceptor);
  addHttpInterceptor.$inject = ['$provide', '$httpProvider'];
  function addHttpInterceptor($provide, $httpProvider) {
    /**
     * @ngdoc service
     * @name mfw.network.status.service:$mfwNgHttpEndpointStatus
     *
     * @description
     * Service that implements {@link mfw.network.status.service:$mfwNetwork#description_endpoint-status endpoint status}
     * based on {@link https://docs.angularjs.org/api/ng/service/$http `$http`} service.
     *
     * The service itself is a {@link https://docs.angularjs.org/api/ng/service/$http#interceptors `$http` interceptor}
     * that {@link mfw.network.status.service:$mfwNetwork#methods_setEndpointStatus notifies `$mfwNetwork`}
     * for each HTTP response.
     *
     * Implemented interceptors:
     *
     * * `response`
     * * `responseError`
     */
    $provide.factory('$mfwNgHttpEndpointStatus', ['$q', '$log', '$mfwNetwork',
      function ($q, $log, $mfwNetwork) {
        return {
          // // optional method
          // 'request': function (config) {
          //   $log.debug('$mfwNgHttpEndpointStatus: New request', config);
          //   return config;
          // },
          //
          // // optional method
          // 'requestError': function (rejection) {
          //   $log.debug('$mfwNgHttpEndpointStatus: Request error', rejection);
          //   return rejection;
          // },

          // optional method
          'response': function (response) {
            // do something on success
            var endpoint = '';
            $mfwNetwork.setEndpointStatus(endpoint, response);
            return response;
          },

          // optional method
          'responseError': function (rejection) {
            var endpoint = '';
            $mfwNetwork.setEndpointStatus(endpoint, rejection);
            return rejection;
          }
        };
      }]);

    $httpProvider.interceptors.push('$mfwNgHttpEndpointStatus');
  }
})();
