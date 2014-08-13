'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ui.bootstrap'])
    .controller('ExploreController', ['$scope',
        function($scope, $http) {

            var migration = viz.init();

            $scope.countries = []

            $scope.operation = 'Asylum_from';
            $scope.newValue = function(value) {
                console.log(value);
                migration.onSelectOperation(value)
            }
            $scope.addCountry = function(country){
            	$scope.countries.push(country);
            	$scope.countries = _.sortBy($scope.countries, function(country) {return -1*country.count})
            }
            $scope.resetCountries = function () {
            	$scope.countries= []
            }
            $scope.setCountryList = function(countryList){
            	$scope.countryList = _.sortBy($scope.countries, function(country) {return country.name})
            	$scope.countries = countryList
            	// $scope.countries = _.sortBy($scope.countries, function(country) {return -1*country.count})
            }
            $scope.selectCountry = function(country){
            	migration.selectCountry(country)
            }

            $scope.indicator = {};
            $.ajax({
                type: "GET",
                url: "php/data-fetch.php",
                data: {
                    "operation": "indicator_types"
                },
                dataType: "json",
                success: function(indicators) { // indicators is an array of column names from indicators_new returned from php/data-fetch.php 
                    var numItems = Object.keys(indicators).length;
                    // indicators has the form [{"column_name":"name_of_indicator_type"}]
                    for (var i = 0; i < numItems; i++) {
                        if (!(indicators[i].column_name.indexOf("asylum") == -1 && indicators[i].column_name.indexOf("mig") == -1)) {
                            delete indicators[i];
                        }
                        $scope.indicators = indicators;
                    }
                }
            });



            $scope.radioModel = 'Asylum_from';

            $scope.disabled = undefined;

            $scope.enable = function() {
                $scope.disabled = false;
            };

            $scope.disable = function() {
                $scope.disabled = true;
            };

            $scope.clear = function() {
                $scope.indicator.selected = undefined;
            };

        }
    ])
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
.controller('CommonController', ['$scope',
    function($scope) {

    }
]);