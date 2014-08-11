'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ui.bootstrap'])
  .controller('ExploreController', ['$scope', function($scope) {
  	console.log('ExploreController');
	$scope.operation = 'Asylum_from';
  	init();
	$scope.newValue = function(value) {
	     console.log(value);
	      window.onSelectOperation(value)
	}
  }])  
  .controller('CommonController', ['$scope', function($scope) {

  }]);
