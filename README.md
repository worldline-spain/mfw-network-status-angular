# MFW Network Status for AngularJS and Ionic v1.0.0

This AngularJS module provides a way to detect whether network is online or not as part of **Mobile FrameWork (MFW)**
for **AngularJS** and **Ionic** applications.



## Features


This module offers an abstraction of ngCordova's [`$cordovaNetwork`](http://ngcordova.com/docs/plugins/network/).




## Installation

### Plugins

If you are in an Ionic environment and you want to use `mfw-ionic.network.status` module you'll need the following Cordova plugins:

* [cordova-plugin-network-information](https://github.com/apache/cordova-plugin-network-information)


### Via Bower

Get module from Bower registry.

```shell
$ bower install --save mfw-network-status-angular
```


### Other

Download source files and include them into your project sources.



### Dependency

Once dependency has been downloaded, configure your application module(s) to require:

* `mfw.network.status` module: main module with `$mfwNetwork` service.
* `mfw.network.status-restangular` module: include it detect endpoint status based on
    [Restangular](https://github.com/mgonto/restangular) interceptors.
* `mfw-ionic.network.status` module: Ionic implementation of network status based on ngCordova's
    [$cordovaNetwork](http://ngcordova.com/docs/plugins/network/) service.

```js
angular
  .module('your-module', [
      // Your other dependencies
      'mfw.network.status',
      // If using Restangular
      'mfw.network.status-restangular',
      // If Ionic app
      'mfw-ionic.network.status'
  ]);
```

Now you can inject `$mfwNetwork` service.


> For further documentation, please read the generated `ngDocs` documentation inside `docs/` folder.


## Usage

### Configure

Configure default options for each module.


* Configure platform-dependent network status detection.
* Configure endpoint status detection based on HTTP status codes.

```js
angular
  .module('your-module')
  .config(configNetworkStatus);

configNetworkStatus.$inject = ['$mfwNetworkProvider'];
function configNetworkStatus($mfwNetworkProvider) {
  $mfwNetworkProvider.config({
    // Set a custom network status detector
    networkStatusService: 'myCustomNetworkStatusDetector',
    // Assuming your server does not use 404 for REST requests, it's considered down when 404 is returned
    downStatusCodes: [0, 404, 502, 503, 504]
  });
}
```

* If you are using Restangular, configure all Restangular configurations you want to intercept:

```js
angular
  .module('your-module')
  .config(configEndpointStatus);

configEndpointStatus.$inject = ['$mfwRestangularEndpointStatusProvider'];
function configEndpointStatus($mfwRestangularEndpointStatusProvider) {
  $mfwRestangularEndpointStatusProvider.config({
    restangularConfig: ['BaseRestangular', 'AuthRestangular']
  });
}
```


### Check network status

```js
/*
 * E.g.
 * API_BASE_ENDPOINT: https://your-domain/context
 * GET_RECENT_MESSAGES_ENDPOINT: https://your-domain/context/messages/last
 */
Controller.$inject = ['$log', '$scope', '$mwfNetwork', 'API_BASE_ENDPOINT', 'GET_RECENT_MESSAGES_ENDPOINT'];
function Controller($log, $scope, $mwfNetwork, API_BASE_ENDPOINT, GET_RECENT_MESSAGES_ENDPOINT) {
  // To be notified when app enterns online mode
  var deregisterOnOnline = $mfwNetwork.onOnline(function () {
    $log.log('ONLINE MODE');
  });
  
  // To be notified when app enterns offline mode
  var deregisterOffOnline = $mfwNetwork.onOffline(function () {
    $log.log('OFFLINE MODE');  
  });
  
  // urlMatcher is a `RegExp` object that accepts URLs with base = https://your-domain/context
  // urlMatcher.exec(GET_RECENT_MESSAGES_ENDPOINT) != null
  // Endpoint status update: to be notified when endpoint status changes
  // Listen for URL pattern (all API)
  var urlMatcher = $mfwNetwork.endpointUrlMatcher(API_BASE_ENDPOINT);
  var deregisterMatcherEndpointStatus = $mfwNetwork.onEndpointStatusChange(urlMatcher, function (isOnline, endpoint) {
    $log.log('Endpoint matcher ' + urlMatcher.source, 'for endpoint' +  endpoint + ' online = ' + isOnline);
  });
  // Listen for a specific endpoint URL
  var deregisterEndpointStatus = $mfwNetwork.onEndpointStatusChange(GET_RECENT_MESSAGES_ENDPOINT, function (isOnline) {
    $log.log('Endpoint ' + GET_RECENT_MESSAGES_ENDPOINT + ' online = ' + isOnline);
  });

  // Check current status
  if ($mfwNetwork.isOnline()) {
    $log.log('Currently network is online');
  } else {
    $log.log('Currently network is offline');
  }

  // Clean up
  $scope.$on('$destroy', function cleanUp() {
    deregisterOnOnline();
    deregisterOffOnline();
    deregisterMatcherEndpointStatus();
    deregisterEndpointStatus();
  });
}
```


## Development

* Use Gitflow
* Update package.json version
* Tag Git with same version numbers as NPM
* Check for valid `ngDocs` output inside `docs/` folder

> **Important**: Run `npm install` before anything. This will install NPM and Bower dependencies.

> **Important**: Run `npm run deliver` before committing anything. This will build documentation and distribution files.
> It's a shortcut for running both `docs` and `build` scripts.


### NPM commands

* Bower: install Bower dependencies in `bower_components/` folder:

```shell
$ npm run bower
```

* Build: build distributable binaries in `dist/` folder:

```shell
$ npm run build
```

* Documentation: generate user documentation (using `ngDocs`):

```shell
$ npm run docs
```

* Linting: run *linter* (currently JSHint):

```shell
$ npm run lint
```

* Deliver: **run it before committing to Git**. It's a shortcut for `docs` and `build` scripts:

```shell
$ npm run deliver
```
