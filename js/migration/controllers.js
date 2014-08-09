'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ui.bootstrap'])
  .controller('ExploreController', ['$scope', function($scope) {
  	console.log('ExploreController');
	$scope.radioModel = 'Asylum_from';
  	init();
  }])  
  .controller('CommonController', ['$scope', function($scope) {

  }]);
