(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @module mfw-ionic.network.status
   * @name mfw-ionic.network.status
   *
   * @requires mfw.network.status
   * @requires ionic
   * @requires ngCordova
   *
   * @description
   * # Description
   *
   * This module provides an abstraction of ngCordova's {@link http://ngcordova.com/docs/plugins/network/ `$cordovaNetwork` plugin}.
   *
   * The module itself {@link mfw.network.status.$mfwNetworkProvider#methods_config configures}
   * {@link mfw-ionic.network.status.service:$mfwIonicNetworkStatus `$mfwNetwork`} by setting proper `networkStatusService` setting
   * to value `$mfwIonicNetworkStatus`.
   *
   *
   * # Plugins
   *
   * This module requires the following Cordova plugins:
   *
   * * {@link https://github.com/apache/cordova-plugin-network-information cordova-plugin-network-information}
   *
   */
  var NetworkModule = angular.module('mfw-ionic.network.status', [
    'mfw.network.status',
    'ionic',
    'ngCordova'
  ]);


  /**
   * CONFIG phase.
   * Set {@link mfw-ionic.network.status.service:$mfwIonicNetworkStatus `$mfwIonicNetworkStatus`} as network status implementation.
   */
  NetworkModule.config(registerAsNetworkStatusService);
  registerAsNetworkStatusService.$inject = ['$mfwNetworkProvider'];
  function registerAsNetworkStatusService($mfwNetworkProvider) {
    $mfwNetworkProvider.config({
      networkStatusService: '$mfwIonicNetworkStatus'
    });
  }

  /**
   * @ngdoc service
   * @name mfw-ionic.network.status.service:$mfwIonicNetworkStatus
   *
   * @description
   * Network status detection based on {@link http://ngcordova.com/docs/plugins/network/ `$cordovaNetwork` plugin}.
   */
  NetworkModule.factory('$mfwIonicNetworkStatus', ionicNetworkStatus);
  ionicNetworkStatus.$inject = ['$rootScope', '$cordovaNetwork'];
  function ionicNetworkStatus($rootScope, $cordovaNetwork) {
    var service = {
      /**
       * @ngdoc method
       * @name mfw-ionic.network.status.service:$mfwIonicNetworkStatus#isOnline
       * @methodOf mfw-ionic.network.status.service:$mfwIonicNetworkStatus
       *
       * @description
       * Returns whether the network is considered online or not.
       *
       * @returns {boolean} Whether network is online or not.
       */
      isOnline: function () {
        return $cordovaNetwork.isOnline();
      },
      /**
       * @ngdoc method
       * @name mfw-ionic.network.status.service:$mfwIonicNetworkStatus#isOffline
       * @methodOf mfw-ionic.network.status.service:$mfwIonicNetworkStatus
       *
       * @description
       * Returns whether the network is considered offline or not.
       *
       * @returns {boolean} Whether network is offline or not.
       */
      isOffline: function () {
        return $cordovaNetwork.isOffline();
      },
      /**
       * @ngdoc method
       * @name mfw-ionic.network.status.service:$mfwIonicNetworkStatus#onOnline
       * @methodOf mfw-ionic.network.status.service:$mfwIonicNetworkStatus
       *
       * @description
       * Register a new callback to be executed when network turns up.
       *
       * @param {Function} cb Callback.
       *
       * @returns {Function} Deregister callback.
       */
      onOnline: function (cb) {
        return $rootScope.$on('$cordovaNetwork:online', cb);
      },
      /**
       * @ngdoc method
       * @name mfw-ionic.network.status.service:$mfwIonicNetworkStatus#onOffline
       * @methodOf mfw-ionic.network.status.service:$mfwIonicNetworkStatus
       *
       * @description
       * Register a new callback to be executed when network turns down.
       *
       * @param {Function} cb Callback.
       *
       * @returns {Function} Deregister callback.
       */
      onOffline: function (cb) {
        return $rootScope.$on('$cordovaNetwork:offline', cb);
      }
    };
    return service;
  }
})();
