'use strict';
/* Controllers */

angular.module('myApp.controllers', ['ui.bootstrap'])
  .controller('ExploreController', ['$scope', function($scope, $http) {
  	
	var migration = viz.init();
	$scope.operation = 'Asylum_from';
	$scope.newValue = function(value) {
	      window.onSelectOperation(value)
	}

	$scope.countries = []


	$scope.addCountry = function(ctry){
		$scope.countries.push(ctry);
		$scope.countries = _.sortBy($scope.countries, function(ctry) {return -1*ctry.count})
	}
	$scope.resetCountries = function () {
		$scope.countries= []
	}
	$scope.setCountryList = function(countryList){
		$scope.countryList = _.sortBy($scope.countries, function(ctry) {return ctry.name})
		$scope.countries = countryList
		// $scope.countries = _.sortBy($scope.countries, function(country) {return -1*country.count})
	}
	$scope.selectCountry = function(cntry){
		migration.selectCountry(cntry)
	}

	$scope.country = [{"selected": false, "name": ""}];

	$scope.updateCountry = function(countryName) {
		$scope.$apply(function() {
			$scope.country.selected = true;
			$scope.country.name = countryName;
		});
	}
	
	$scope.action = "";

  	$scope.indicator = {};
	// Derived from data in postgres DB indicators_new
	$scope.indicators = [
		{"column_name":"battle_deaths", "display":"Deaths in Battle"},
		{"column_name":"student_exp", "display":"Student Expectancy"},
		{"column_name":"infant_deaths", "display":"Infant Deaths"},
		{"column_name":"mobile", "display":"Mobile Phone Users"},
		{"column_name":"employed_worker", "display":"Employed Workers"},
		{"column_name":"gdp", "display":"GDP"},
		{"column_name":"life_exp", "display":"Life Expectancy"},
		{"column_name":"vehicles", "display":"Number of Vehicles"},
		{"column_name":"sanitization", "display":"Sanitization"}
	];
	
	$scope.$watch('indicator.selected', function() {
		if($scope.indicator.selected) {
			$.ajax({
				type: "GET",
			        url: "php/data-fetch.php",
            			data: {
                			"operation": "indicator",
					"indicator": $scope.indicator.selected.column_name,
					"year":"1990"
            			},
            			dataType: "json",
            			success: function(indicatorData) {
					removeAllFlows();
					indicatorRecolor(indicatorData, $scope.indicator.selected.column_name);
				}
			});
		}
	});

	$scope.$watch('operation', function() {
		if($scope.operation == "Asylum_from") {
			$scope.action = "People Seeking Asylum from ";
		}
		else if($scope.operation == "Asylum_to") {
			$scope.action = "People Applying for Asylum in ";
		} 
		else if($scope.operation == "Migration_from") {
			$scope.action = "People Migrating from ";
		}
		else if($scope.operation == "Migration_to") {
			$scope.action = "People Migrating to ";
		}
		else{
			$scope.action = "";
		};
	});
		
	$scope.radioModel = 'Asylum_from';

  	$scope.clear = function() {
    		$scope.indicator.selected = undefined;
  	};

  }])
	.controller('ZimbabweController', ['$scope',
	    function($scope) {
		var migration = viz.init(function(){
			migration.selectCountry('Zimbabwe', 'asylum_from')
		    }, true)
		$scope.addCountry = function(country){
		}
		$scope.resetCountries = function () {
		}
		$scope.setCountryList = function(countryList){
		}
		$scope.selectCountry = function(country){
		}	    
	    }
	])

	.controller('CommonController', ['$scope', function($scope) {

	}]);
