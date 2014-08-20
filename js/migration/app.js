'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'vr.directives.slider',
  'ngSanitize',
  'ui.select',
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/introduction', {templateUrl: 'partials/introduction.html', controller: 'CommonController'});
  $routeProvider.when('/zimbabwe', {templateUrl: 'partials/zimbabwe.html', controller: 'ZimbabweController'});
  $routeProvider.when('/sudan', {templateUrl: 'partials/sudan.html', controller: 'CommonController'});
  $routeProvider.when('/syria', {templateUrl: 'partials/syria.html', controller: 'CommonController'});
  $routeProvider.when('/explore', {templateUrl: 'partials/explore.html', controller: 'ExploreController'});
  $routeProvider.when('/datasources', {templateUrl: 'partials/datasources.html', controller: 'CommonController'});
  $routeProvider.when('/erin', {templateUrl: 'partials/erin.html', controller: 'CommonController'});
  $routeProvider.when('/kunal', {templateUrl: 'partials/kunal.html', controller: 'CommonController'});
  $routeProvider.when('/nikhil', {templateUrl: 'partials/nikhil.html', controller: 'CommonController'});
  $routeProvider.otherwise({redirectTo: '/introduction'});
}]);
