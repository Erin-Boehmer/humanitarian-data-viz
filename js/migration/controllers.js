'use strict';
/* Controllers */

angular.module('myApp.controllers', ['ui.bootstrap'])
    .controller('ExploreController', ['$scope',
        function($scope, $http) {

	    $scope.panelToggleClass = "btn glyphicon glyphicon-chevron-up";
            $scope.operation = 'migration_to';
            $scope.action = "People Migrating to ";

	    var migration = viz.init(function() {
                migration.selectCountry('United States', $scope.operation)
            }, false)

	    $scope.controlPanelToggle = function() {
		$('#control-panel-body').toggle();
		if($scope.panelToggleClass == "btn glyphicon glyphicon-chevron-up") {
			$scope.panelToggleClass = "btn glyphicon glyphicon-chevron-down";
		} else {
			$scope.panelToggleClass = "btn glyphicon glyphicon-chevron-up";
		}
	    }
		
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
                    $scope.country.selected = true;
                    $scope.country.name = countryName;
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

            	$scope.year = 2003;
		    
		    $scope.yearChanged = function(){
		    	migration.onSelectOperation();
			console.log($scope.year);
		    	$scope.indicatorChanged();
		    }

		    $scope.indicatorChanged = function(){
                	if ($scope.indicator.selected ) {
                    		$.ajax({
                        		type: "GET",
                        		url: "php/data-fetch.php",
                        		data: {
                            			"operation": "indicator",
                            			"indicator": $scope.indicator.selected.column_name,
                            			"year": $scope.year
                        		},
                        		dataType: "json",
                        		success: function(indicatorData) {
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
         
	$scope.panelToggleClass = "btn glyphicon glyphicon-chevron-up";

	$scope.operation = 'asylum_from';
         var migration = viz.init(function() {
                migration.selectCountry('Zimbabwe', 'asylum_from')
         }, true)

	//Variables for title
	$scope.totalApplicants = 0;

	$scope.countries = [];
	$scope.addCountry = function(ctry) {
		$scope.countries.push(ctry);
              	$scope.countries = _.sortBy($scope.countries, function(ctry) {return -1 * ctry.count});
	}
        $scope.setCountryList = function(countryList) {
		$scope.countryList = _.sortBy($scope.countries, function(ctry) {
                	return ctry.name
                })
                $scope.countries = countryList;
	}

	$scope.$watch('countries', function() {
		$scope.totalApplicants = 0;
		$scope.countries.forEach(function(element, index, array) {
			if(element.count > 0) 
				$scope.totalApplicants += element.count;
		});
	});

        $scope.resetCountries = function() {
		$scope.countries = []
	}
	
	//Set function required in "ExploreController" to do nothing
        $scope.selectCountry = function(country) {}
	$scope.indicatorChanged = function(){}

       	$scope.year = 2003;

       	$scope.yearChanged = function(){
		migration.onSelectOperation();
                $scope.indicatorChanged();
        }

	$scope.controlPanelToggle = function() {
		$('#control-panel-body').toggle();
                if($scope.panelToggleClass == "btn glyphicon glyphicon-chevron-up") {
                        $scope.panelToggleClass = "btn glyphicon glyphicon-chevron-down";
                } else {
                        $scope.panelToggleClass = "btn glyphicon glyphicon-chevron-up";
                }
	}

	$scope.story = {"2003":{"imglink":"img/zimbabwe/2003.gif","text":"Under President Robert Mugabe, Zimbabwe withdraws from the Commonwealth of Nations. Black squatters continue to seize white-owned farms in a violent campaign to reclaim what they say was stolen by settlers, exacerbating food shortages and threatening famine."},
			"2004":{"imglink":"img/zimbabwe/2004.jpg","text":"Opposition leader Morgan Tsvangirai is acquitted of treason charges relating to an alleged plot to kill President Mugabe. He faces a separate treason charge."},
			"2005":{"imglink":"img/zimbabwe/2005.jpg","text":"The US labels Zimbabwe as one of the world's six 'outposts of tyranny' while UN humanitarian chief says Zimbabwe is in 'meltdown.' Zimbabwe launches a 'clean-up' program, destroying shanty dwellings and illegal street stalls leaving about 700,000 people homeless."},
			"2006":{"imglink":"img/zimbabwe/2006.png","text":"Economic crisis worsens as inflation exceeds 1,000%. New banknotes are introduced with three places deleted from their values in an attempt to help curb hyperinflation."},
			"2007":{"imglink":"img/zimbabwe/2007.jpeg","text":"Demonstrations and rallies are banned. The government warns of power cuts for up to 20 hours a day while electricity is diverted towards agriculture."},
			"2008":{"imglink":"img/zimbabwe/2008.jpg","text":"UN Security Council imposes sanctions on Zimbabwe. Mugabe declared the winner of elections as Tsvangirai pulls out due to intimidation. Zimbabwe declares a national emergency as cholera epidemic casues collapse of the health care system."},
			"2009":{"imglink":"img/zimbabwe/2009.jpg","text":"Tsvangirai sworn in as prime-minister after he and Mugabe sign power-sharing agreement. Retail prices fall, constitutional review begins, and Tsvangirai tours Europe and US to revive foreign relations and drive donor support."},
			"2010":{"imglink":"img/zimbabwe/2010.jpg","text":"Zimbabwe's High Court rules in favor of Mugabe's land-reform program while new 'indigenisation' law forces foreign-owned businesses to sell majority stake to locals. Zimbabwe resumes diamond sales at the Marange diamond fields amid allegations 'blood diamonds' and human rights abuses."},
			"2011":{"imglink":"img/zimbabwe/2011.jpg","text":"The Kimberly Process (diamond industry regulator) lifts the export ban from two of Zimbabwe's Marange fields. Mugabe condemns his power-sharing agreement with Tsvangirai and says he will run in the next election."},
			"2012":{"imglink":"img/zimbabwe/2012.jpg","text":"European Union eases sanctions while maintaining asset freeze and travel restrictions for President Mugabe. Political violence on the rise and repressive structures reappear in preparation for 2013 elections."},
			"2013":{"imglink":"img/zimbabwe/2013.jpg","text":"Talks involving President Mugabe and Prime Minister Tsvangirai result in the approval of a new constitution. Mugabe is fraudulently elected for his 7th term in office and his party receives 3/4 of the seats in parliament."},
			};
            

   } ])

.controller('CommonController', ['$scope',
    function($scope) {

    }
]);
