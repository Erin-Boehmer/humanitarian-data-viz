'use strict';
/* Controllers */

angular.module('myApp.controllers', ['ui.bootstrap'])
    .controller('ExploreController', ['$scope',
        function($scope, $http) {

            $scope.operation = 'migration_to';
            $scope.action = "People Migrating to ";
			var migration = viz.init(function() {
                migration.selectCountry('United States', $scope.operation)
            }, false)

            $scope.newValue = function(value) {
                if ($scope.country.name != "") {
                    migration.onSelectOperation(value);
                }
                if ($scope.operation == "Asylum_from") {
                    $scope.action = "People Seeking Asylum from ";
                } else if ($scope.operation == "Asylum_to") {
                    $scope.action = "People Applying for Asylum in ";
                } else if ($scope.operation == "Migration_from") {
                    $scope.action = "People Migrating from ";
                } else {
                    $scope.action = "People Migrating to ";
                }                
            }

            $scope.countries = []


            $scope.addCountry = function(ctry) {
                $scope.countries.push(ctry);
                $scope.countries = _.sortBy($scope.countries, function(ctry) {
                    return -1 * ctry.count
                })
            }
            $scope.resetCountries = function() {
                $scope.countries = []
            }
            $scope.setCountryList = function(countryList) {
                $scope.countryList = _.sortBy($scope.countries, function(ctry) {
                    return ctry.name
                })
                $scope.countries = countryList
            }
            $scope.selectCountry = function(cntry) {
                migration.selectCountry(cntry)
            }

            $scope.country = [{
                "selected": false,
                "name": ""
            }];

            $scope.updateCountry = function(countryName) {
                $scope.$apply(function() {
                    $scope.country.selected = true;
                    $scope.country.name = countryName;
                });
            }

            $scope.indicator = {};
            // Derived from data in postgres DB indicators_new
		    $scope.indicators = [
		        {"column_name":"battle_deaths", "display":"Deaths in Battle", "description":"Deaths in battle-related conflicts between warring parties"},
		        {"column_name":"student_exp", "display":"Student Expenditure", "description":"Public expenditure per pupil as a % of GDP per capita"},
		        {"column_name":"infant_deaths", "display":"Infant Deaths", "description":"Number of infants dying before reaching one year of age"},
		        {"column_name":"mobile", "display":"Mobile Phone Users", "description":"Mobile cellular subscriptions (per 100 people), including prepaid and post-paid subscriptions"},
		        {"column_name":"employed_worker", "display":"Employed Workers", "description":"Wage and salaried workers as a percentage of total employed"},
		        {"column_name":"gdp", "display":"GDP", "description":"GDP per capita (current US$)"},
		        {"column_name":"life_exp", "display":"Life Expectancy", "description":" Life expectancy at birth, total (years)"},
		        {"column_name":"vehicles", "display":"Number of Vehicles", "description":"Four-wheeled motor vehicles (per 1,000 people) "},
		        {"column_name":"sanitization", "display":"Sanitization", "description":"Percent of population wtih access to improved sanitation facilities"}
		    ];

            $scope.explain = {};
            $scope.explain.migration = "Click the 'In' or 'Out' button and then click a country on the map to show the migrant flow for that area";
            $scope.explain.asylum = "Click the 'In' or 'Out' button and then click a country on the map to show the # of asylum applicants for that area";
            $scope.explain.indicator = "Select a world development indicator below to recolor the map on a relative scale for that variable";

            $scope.year = {};
		    // $scope.years = [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013]
		    $scope.years = [
		        {"year":"2003", "display":"2003"},
		        {"year":"2004", "display":"2004"},
		        {"year":"2005", "display":"2005"},
		        {"year":"2006", "display":"2006"},
		        {"year":"2007", "display":"2007"},
		        {"year":"2008", "display":"2008"},
		        {"year":"2009", "display":"2009"},
		        {"year":"2010", "display":"2010"},
		        {"year":"2011", "display":"2011"},
		        {"year":"2012", "display":"2012"},
		        {"year":"2013", "display":"2013"}
		    ];
            $scope.year.selected = $scope.years[7];
		    
		    $scope.yearChanged = function(){
		    	migration.onSelectOperation();
		    	$scope.indicatorChanged();
		    }

		    $scope.indicatorChanged = function(){
                console.log($scope.year.selected.yea);
                if ($scope.indicator.selected ) {
                    $.ajax({
                        type: "GET",
                        url: "php/data-fetch.php",
                        data: {
                            "operation": "indicator",
                            "indicator": $scope.indicator.selected.column_name,
                            "year": $scope.year.selected.year
                        },
                        dataType: "json",
                        success: function(indicatorData) {
                            // removeAllFlows();
                            migration.indicatorRecolor(indicatorData,$scope.indicator.selected.column_name);
                        }
                    });
                }
            };



            $scope.radioModel = 'Asylum_from';

            $scope.clear = function() {
                $scope.indicator.selected = undefined;
            };


        }
    ])
    .controller('ZimbabweController', ['$scope',
        function($scope) {
            var migration = viz.init(function() {
                migration.selectCountry('Zimbabwe', 'asylum_from')
            }, true)
            $scope.addCountry = function(country) {}
            $scope.resetCountries = function() {}
            $scope.setCountryList = function(countryList) {}
            $scope.selectCountry = function(country) {}
        }
    ])

.controller('CommonController', ['$scope',
    function($scope) {

    }
]);