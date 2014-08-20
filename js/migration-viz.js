var nameToFeatureMap = Array();
var tooltip;

viz = {
        init: function(afterDataLoad, preventCountrySelection) {

            /////////////////////////////////////////////////////////////////////////
            //////////////////////      INIT and SETUP         //////////////////////
            /////////////////////////////////////////////////////////////////////////

	    // Color constants
	    var yellow = "#FFB524";
	    var lightBlack = "#333";
	    var grey = "#646464";

            var zoom = d3.behavior.zoom()
                .scaleExtent([1, 9])
                .on("zoom", move);
            var width = document.getElementById('container').offsetWidth;
            var height = width / 2;
            var topo, projection, path, svg, g;
            tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");
            var flow_tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");
            // Create the arc creator function
            var arc = d3.geo.greatArc().precision(1);
	    var bundle = d3.layout.bundle();
            setup(width, height);

            function setup(width, height) {
                projection = d3.geo.mercator()
                    .translate([(width / 2), (height / 2)])
                    .scale(width / 3 / Math.PI);

                path = d3.geo.path().projection(projection);

                svg = d3.select("#container").append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .call(zoom)
                    .on("click", click)
                    .append("g");

                g = svg.append("g");
                window.g = g;
            }

            /////////////////////////////////////////////////////////////////////////
            //////////////////////          DATA SETUP         //////////////////////
            /////////////////////////////////////////////////////////////////////////

            setupData();

            function setupData() {
                var setupCentroids = function() {
                    d3.csv("data/country_centroids_all.csv", function(error, latlong) {
                        _.each(latlong, function(val) {
                            var country = nameToFeatureMap[val.COUNTRY]
                            if (country) {
                                country.centroid = [val.LONG, val.LAT]
                            }
                        });
                    });

                    if (typeof afterDataLoad === 'function')
                        afterDataLoad();
                }
		
		var setupContinents = function() { 
			d3.csv("data/country-continent.csv", function(error, data) {
				_.each(data, function(val) {
					var country = nameToFeatureMap[val.COUNTRY];
					if(country) {
						country.continent = val.CONTINENT;
					} else {
						console.log(val);
					}
				})
			});
		}

                d3.json("data/world-topo-min.json", function(error, world) {
                    var countries = topojson.feature(world, world.objects.countries).features;
                    topo = countries;
                    draw(topo);

                    // Populate nameToFeatureMap for plotting arcs convenience
                    var countryList = []
                    for (var i in countries) {
                        feature = countries[i];
                        nameToFeatureMap[feature.properties.name] = feature;
                        countryList.push({
                            name: feature.properties.name
                        })
                    }
                    var scope = angular.element($("#control-panel")).scope();
                    if (typeof scope != 'undefined')
                        scope.$apply(function() {
                            scope.setCountryList(countryList);
                        })
                    setupCentroids();
		    setupContinents();
                });
            }

            /////////////////////////////////////////////////////////////////////////
            //////////////////////      Global MAP Actions      /////////////////////
            /////////////////////////////////////////////////////////////////////////

            function draw(topo) {
                var country = g.selectAll(".country").data(topo);
                country.enter().insert("path")
                    .attr("class", "country")
                    .attr("d", path)
                    .attr("id", function(d, i) {
                        return d.id;
                    })
                    .attr("title", function(d, i) {
                        return d.properties.name;
                    })
                    .style("fill", grey/*function(d, i) {
                        // d.properties.color = "#333";
                        //d.properties.originalcolor = d.properties.color
                        //return shade(d.properties.color, 0.25);
                    }*/);

                //offsets for tooltips
                var offsetL = document.getElementById('container').offsetLeft + 20;
                var offsetT = document.getElementById('container').offsetTop + 10;

                //tooltips
                country
                    .on("mousemove", function(d, i) {
                        var mouse = d3.mouse(svg.node()).map(function(d) {
                            return parseInt(d);
                        });
                        tooltip.classed("hidden", false)
                            .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                            .html(d.properties.name);
                    })
                    .on("mouseout", function(d, i) {
                        tooltip.classed("hidden", true);
                    })
                    .on("click", onMapCountrySelect);
            }

            function redraw() {
                width = document.getElementById('container').offsetWidth;
                height = width / 2;
                d3.select('svg').remove();
                setup(width, height);
                draw(topo);
            }

            function move() {
                var t = d3.event.translate;
                var s = d3.event.scale;
                var zscale = s;
                var h = height / 4;

                t[0] = Math.min(
                    (width / height) * (s - 1),
                    Math.max(width * (1 - s), t[0])
                );

                t[1] = Math.min(
                    h * (s - 1) + h * s,
                    Math.max(height * (1 - s) - h * s, t[1])
                );

                zoom.translate(t);
                g.attr("transform", "translate(" + t + ")scale(" + s + ")");

                //adjust the country hover stroke width based on zoom level
                d3.selectAll(".country").style("stroke-width", 1.5 / s);
            }


            d3.select(window).on("resize", throttle);
            var throttleTimer;

            function throttle() {
                window.clearTimeout(throttleTimer);
                throttleTimer = window.setTimeout(function() {
                    redraw();
                }, 200);
            }

            //geo translation on mouse click in map
            function click() {
                // var latlon = projection.invert(d3.mouse(this));
            }

            /////////////////////////////////////////////////////////////////////////
            //////////////////////      User Actions            /////////////////////
            /////////////////////////////////////////////////////////////////////////

            var selectedCountryData = null;

            //On selecting an operation
            this.onSelectOperation = function(operation) {
                    if (selectedCountryData != null)
                        plotFlows(selectedCountryData, null, null, operation)
                }
                //When a country is selected from the data panel
            this.selectCountry = function(country, operationType) {
                plotFlows(nameToFeatureMap[country], null, null, operationType);
            }

            // this.yearChanged = function(){
            //     plotFlows(nameToFeatureMap[this.selectedcountry])
            // }

            //function to plot migration flows on country click
            function onMapCountrySelect(data, countryCode, arg3, operationType) {
                if (preventCountrySelection)
                    return
                else {
		    plotFlows(data, countryCode, arg3, operationType)
		}
            }

            function plotFlows(data, countryCode, arg3, operationType) {
                var scope = angular.element($("#control-panel")).scope();
		if (typeof scope.updateCountry != 'undefined') {
			if(scope.country.name) {
				$("#"+nameToFeatureMap[scope.country.name].id).css('stroke', lightBlack).css('stroke-width', 1);
                	}
			scope.updateCountry(data.properties.name);
		}
                selectedCountryData = data;
                //Make current country's borders yellow
                var ele = $("#"+data.id);
		ele.css('stroke', yellow);
                ele.css('stroke-width', 3);


                // Remove existing flow arcs
		//d3.selectAll('.flow').style('stroke-opacity',0);
		var flows = $(".flow");
		flowLength = flows.length;

		flows.each(function() {
			$(this).fadeOut(2500, function() { 
				$(this).remove();
			})
		});
                if (typeof operationType === 'undefined')
                    operationType = scope.operation.toLowerCase();
                if(flowLength < 1) $('#vizLoading').modal('show');


                // Fetch the data and call plotLines() on callback
                $.ajax({
                    type: "GET",
                    url: "php/data-fetch.php",
                    data: {
                        "operation": operationType,
                        "origin": data.properties.name
                    },
                    dataType: "json",
                    success: function(movingData) {
                        if (movingData.length == 0) {
                            var modal = $('#noDataModal').modal('show')
                            modal.css('margin-top', ($(window).height() - modal.height()) / 2 - parseInt(modal.css('padding-top')))

                        }
                        var scope = angular.element($("#container")).scope();
                        var year = scope.year
                        var movingDataYear = _.filter(movingData, function(datum){ return datum.year == year; });

                        plotLines(data.properties.name, operationType, movingDataYear);
                        $('#vizLoading').modal('hide')
                    },
                    error: function(err) {
                    }
                });
            }


            /**
             * Input: SourceCountry name, Database rows for corresponding target country data
             * Result: Plots arcs from source country to every target country.
             */
            function plotLines(sourceCountry, operationType, movingData) {
                    this.selectedcountry = sourceCountry;
                    var to = false;
                    if (operationType == "asylum_from") {
                        var aggregateByTargetCountry = reduce(movingData, 'residence', 'applied_during_year');
                    } else if (operationType == "asylum_to") {
                        to = true;
                        var aggregateByTargetCountry = reduce(movingData, 'origin', 'applied_during_year');
                    } else if (operationType == "migration_from") {
                        var aggregateByTargetCountry = reduce(movingData, 'country', 'value');
                    } else if (operationType == "migration_to") {
                        to = true;
                        var aggregateByTargetCountry = reduce(movingData, 'country_of_origin', 'value');
                    } else {
                    }
                    var source = getCentroid(sourceCountry);
                    var max = Math.log(d3.max(d3.values(aggregateByTargetCountry)));
                    var scope = angular.element($("#control-panel")).scope();
                    scope.$apply(function() {
                        scope.resetCountries();
                    });
                    for (var targetCountry in aggregateByTargetCountry) {

                        if (aggregateByTargetCountry[targetCountry]==0)
                            continue;

                        var target = getCentroid(targetCountry);
                        // var target = projection.invert(projection(nameToFeatureMap[targetCountry].centroid));
                        link = {
                            'source': source,
                            'target': target
                        };
                        dValue = path(arc(link));

                        var strokeValue = Math.log(aggregateByTargetCountry[targetCountry] + 1) / max;
			scope.$apply(function() {
                            scope.addCountry({
                                name: targetCountry,
                                count: aggregateByTargetCountry[targetCountry]
                            });
                        })

                        strokeValue = 0.5 + 10 * strokeValue;

                        //offsets for tooltips
                        var offsetL = document.getElementById('container').offsetLeft + 40;
                        var offsetT = document.getElementById('container').offsetTop + 100;

                        var mouseOverPath = function(d, i, j) {
                            //Darken the current country
                            var ele = $("#" + nameToFeatureMap[d].id);
                            ele.css('stroke', yellow);

                            // $(this).addClass("flow-hightlight_"+operationType)
                            $(this).attr("class", "flow-hightlight")

                            var mouse = d3.mouse(svg.node()).map(function(d) {
                                return parseInt(d);
                            });
                            flow_tooltip.classed("hidden", false)
                                .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                                .html(function() {
                                    if (to) {
                                        return d + " &#8594;  " + sourceCountry + " |  Applicants: " + aggregateByTargetCountry[d];
                                    } else {
                                        return sourceCountry + " &#8594; " + d + " |  Applicants: " + aggregateByTargetCountry[d];
                                    }
                                }); 
                        }
                        var mouseExitPath = function(d, i) {
                            var ele = $("#" + nameToFeatureMap[d].id);
                            ele.css('stroke', lightBlack);
                            flow_tooltip.classed("hidden", true);
                            $(this).attr("class", "flow")
                        }
                        
			g.append("path")
                            .datum(targetCountry) 
                            .attr("class", "flow")
                            .attr("d", dValue)
			    .style('stroke-width', strokeValue)
                            .on("mouseover", mouseOverPath)
                            .on("mouseout", mouseExitPath);
                    }
                }
                /////////////////////////////////////////////////////////////////////////
                //////////////////////      Utility Functions       /////////////////////
                /////////////////////////////////////////////////////////////////////////

            function reduce(data, key, value) {
                var aggregatedData = new Array();
                for (var i in data) {
                    row = data[i];
                    if (aggregatedData[row[key]] == undefined) {
                        aggregatedData[row[key]] = parseInt(row[value]);
                    } else {
                        aggregatedData[row[key]] += parseInt(row[value]);
                    }
                }
                return aggregatedData;
            }

            function getCentroid(country) {
                if (typeof nameToFeatureMap[country] === 'undefined' ||
                    typeof nameToFeatureMap[country].centroid === 'undefined') {
                    return projection.invert(path.centroid(nameToFeatureMap[country]));
                } else {
                    return nameToFeatureMap[country].centroid;
                }
            }


            //http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
            function shadeColor2(color, percent) {
                var f = parseInt(color.slice(1), 16),
                    t = percent < 0 ? 0 : 255,
                    p = percent < 0 ? percent * -1 : percent,
                    R = f >> 16,
                    G = f >> 8 & 0x00FF,
                    B = f & 0x0000FF;
                return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
            }

            function blendColors(c0, c1, p) {
                var f = parseInt(c0.slice(1), 16),
                    t = parseInt(c1.slice(1), 16),
                    R1 = f >> 16,
                    G1 = f >> 8 & 0x00FF,
                    B1 = f & 0x0000FF,
                    R2 = t >> 16,
                    G2 = t >> 8 & 0x00FF,
                    B2 = t & 0x0000FF;
                return "#" + (0x1000000 + (Math.round((R2 - R1) * p) + R1) * 0x10000 + (Math.round((G2 - G1) * p) + G1) * 0x100 + (Math.round((B2 - B1) * p) + B1)).toString(16).slice(1);
            }

            function shadeRGBColor(color, percent) {
                var f = color.split(","),
                    t = percent < 0 ? 0 : 255,
                    p = percent < 0 ? percent * -1 : percent,
                    R = parseInt(f[0].slice(4)),
                    G = parseInt(f[1]),
                    B = parseInt(f[2]);
                return "rgb(" + (Math.round((t - R) * p) + R) + "," + (Math.round((t - G) * p) + G) + "," + (Math.round((t - B) * p) + B) + ")";
            }

            function blendRGBColors(c0, c1, p) {
                var f = c0.split(","),
                    t = c1.split(","),
                    R = parseInt(f[0].slice(4)),
                    G = parseInt(f[1]),
                    B = parseInt(f[2]);
                return "rgb(" + (Math.round((parseInt(t[0].slice(4)) - R) * p) + R) + "," + (Math.round((parseInt(t[1]) - G) * p) + G) + "," + (Math.round((parseInt(t[2]) - B) * p) + B) + ")";
            }

            function shade(color, percent) {
                if (color.length > 7) return shadeRGBColor(color, percent);
                else return shadeColor2(color, percent);
            }

            function blend(color1, color2, percent) {
                if (color1.length > 7) return blendRGBColors(color1, color2, percent);
                else return blendColors(color1, color2, percent);
            }

            /////////////////////////////////////////////////////////////////////////
            //////////////////////                              /////////////////////
            /////////////////////////////////////////////////////////////////////////
            /** AFTER THIS POINT, FUNCTIONS NOT CALLED YET **/



            function drawLineChart(data) {
                d3.select('#line_graph').remove();
                // define dimensions of graph
                var m = [80, 80, 80, 80]; // margins
                var w = 1000 - m[1] - m[3]; // width
                var h = 400 - m[0] - m[2]; // height

                // X scale will fit all values from data[] within pixels 0-w
                var x = d3.scale.linear()
                    .domain([d3.min(d3.keys(data)), d3.max(d3.keys(data))])
                    .range([0, w]);

                // Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
                var y = d3.scale.linear()
                    .domain([0, d3.max(d3.values(data))])
                    .range([h, 0]);

                // create a line function that can convert data[] into x and y points
                var line = d3.svg.line()
                    // assign the X function to plot our line as we wish
                    .x(function(d) {
                        return x(d.key);
                    })
                    .y(function(d) {
                        return y(d.value);
                    });

                // Add an SVG element with the desired dimensions and margin.
                var graph = d3.select("#graph")
                    .append("svg:svg")
                    .attr("width", w + m[1] + m[3])
                    .attr("height", h + m[0] + m[2])
                    .attr("id", "line_graph")
                    .append("svg:g")
                    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

                // create yAxis
                var xAxis = d3.svg.axis().scale(x).tickSize(-h).tickSubdivide(true);
                // Add the x-axis.
                graph.append("svg:g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + h + ")")
                    .call(xAxis);


                // create left yAxis
                var yAxisLeft = d3.svg.axis().scale(y).ticks(4).orient("left");
                // Add the y-axis to the left
                graph.append("svg:g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(-25,0)")
                    .call(yAxisLeft);

                // Add the line by appending an svg:path element with the data line we created above
                // do this AFTER the axes above so that the line is above the tick-lines
                graph.append("svg:path").attr("d", line(d3.entries(data)));
            }

            /**
             * Input: TopoJSON feature of selected country
             * Result: Shades target countries by data weight, and plots aggregate for source country.
             */
            function onSelectCountry(data) {
                // Remove current selection, and mark clicked country as selected.
                d3.select('.selected').classed('selected', false);
                d3.select('#' + data.id).classed('selected', true);
                // Fetch the data, and run two different callbacks. One callback should
                // color the countries, and the second should render the aggregate graph.
                $.ajax({
                    type: "GET",
                    url: "php/data-fetch.php",
                    data: {
                        "operation": 'asylum',
                        "origin": data.properties.NAME
                    },
                    dataType: "json",
                    success: function(data) {
                        colorCountries(data);
                        plotAggregateGraph(data);
                    }
                });
            }

            /**
             * Input: Associative array of country name to value
             * Result: Colors country by size of value.
             */
            function colorCountries(data) {
                $.find('.countries').forEach(function(elem) {
                    elem.style.removeProperty('fill');
                });
                var aggregateByTargetCountry = reduce(data, 'residence', 'applied_during_year');
                var scale = d3.scale.linear()
                    .domain([0, d3.max(d3.values(aggregateByTargetCountry))])
                    .range([0, 256]);
                max = Math.log(d3.max(d3.values(aggregateByTargetCountry)));
                for (var country in aggregateByTargetCountry) {
                    value = Math.log(aggregateByTargetCountry[country] + 1) / max * 64;
                    value = parseInt(+value);
                    value = 'rgb(256,' + (256 - (value * 4)) + ',' + (256 - (value * 4)) + ')';

                    element = $.find("#" + nameToFeatureMap[country])[0];
                    if (element != undefined) {
                        element.style.setProperty('fill', value);
                    }
                }

            }


            this.indicatorRecolor = function(indicatorData, indicatorType) {
                d3.selectAll(".country").style("fill", '#FFF');
                var rawValues = indicatorData.map(function(o){return o[indicatorType]});
                var max = Math.max.apply(Math, rawValues);
                var min = Math.min.apply(Math,rawValues);
		var blackConst = 51;
                var blueR = 111, blueG = 175, blueB = 194;
                var r,g,b, newColor;
                for(var i = 0; i < indicatorData.length; i++) {
                    var obj = indicatorData[i];
                    if(typeof nameToFeatureMap[obj.country] != 'undefined') {
                        var multiplier = Math.pow(((max-min) - (obj[indicatorType]-min))/(max-min), 3);
                        r = parseInt(blackConst+((blueR-blackConst)*multiplier));
                        g = parseInt(blackConst+((blueG-blackConst)*multiplier));
			//g = parseInt(blackConst*multiplier);
                        b = parseInt(blackConst+((blueB-blackConst)*multiplier));
			
                        newColor = 'rgb(' +r+ ',' +g+ ',' +b+')';
                        nameToFeatureMap[obj.country].properties.color = newColor
                        var element = $('#'+nameToFeatureMap[obj.country].id);
                        element.css('fill', newColor);
                    }
                }
            }

            return this;

        }
    }
