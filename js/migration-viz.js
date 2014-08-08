function init() {

d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 9])
    .on("zoom", move);

var width = document.getElementById('container').offsetWidth;
var height = width / 2;

var topo,projection,path,svg,g;

var nameToFeatureMap = Array();

var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");
var flow_tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

// console.log('-----------------------------')
setup(width,height);
setupData();

// Create the arc creator function
var arc = d3.geo.greatArc().precision(1);

function setup(width,height){
  projection = d3.geo.mercator()
    .translate([(width/2), (height/2)])
    .scale( width / 3 / Math.PI);

  path = d3.geo.path().projection(projection);

  svg = d3.select("#container").append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(zoom)
      .on("click", click)
      .append("g");

  g = svg.append("g");

}


function setupData(){

	var setupCentroids = function(){
		d3.csv("data/country_centroids_all.csv", function(error, latlong) {
			_.each(latlong, function(val){
				var country = nameToFeatureMap[val.COUNTRY]
				if (country){
					country.centroid = [val.LONG, val.LAT]
			    }
		     });
		  });		
	}

	d3.json("data/world-topo-min.json", function(error, world) {
	  var countries = topojson.feature(world, world.objects.countries).features;
	  topo = countries;
	  draw(topo);
		
	  // Populate nameToFeatureMap for plotting arcs convenience
	  for (var i in countries) {
		feature = countries[i];
		nameToFeatureMap[feature.properties.name] = feature;
	  }
	  setupCentroids();
	});


}

function draw(topo) {

  var country = g.selectAll(".country").data(topo);
  country.enter().insert("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("title", function(d,i) { return d.properties.name; })
      .style("fill", function(d, i) { return d.properties.color; });



  
  //offsets for tooltips
  var offsetL = document.getElementById('container').offsetLeft+20;
  var offsetT = document.getElementById('container').offsetTop+10;

  //tooltips
  country
    .on("mousemove", function(d,i) {
    	var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
	tooltip.classed("hidden", false)
        	.attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
             	.html(d.properties.name);
    })
    .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true);
    })
    .on("click", plotFlows); 


} 


function redraw() {
  width = document.getElementById('container').offsetWidth;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo);
}


function move() {

  var t = d3.event.translate;
  var s = d3.event.scale; 

  zscale = s;
  var h = height/4;


  t[0] = Math.min(
    (width/height)  * (s - 1), 
    Math.max( width * (1 - s), t[0] )
  );

  t[1] = Math.min(
    h * (s - 1) + h * s, 
    Math.max(height  * (1 - s) - h * s, t[1])
  );

  zoom.translate(t);
  g.attr("transform", "translate(" + t + ")scale(" + s + ")");
  
  //adjust the country hover stroke width based on zoom level
  d3.selectAll(".country").style("stroke-width", 1.5 / s);

}




var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}


//geo translation on mouse click in map
function click() {
  var latlon = projection.invert(d3.mouse(this));
}

//function to plot migration flows on country click
function plotFlows(data) {
  // Remove existing flow arcs
  d3.selectAll(".flow").remove();
  var operationType = angular.element($("#control-panel")).scope().radioModel.toLowerCase();
  // Fetch the data and call plotLines() on callback
  $.ajax({
	type: "GET",
	 url: "php/data-fetch.php",
	 data: {
  		"operation": operationType,
		"origin": data.properties.name
	},
	dataType: "json",
	success: function (movingData) {
		plotLines(data.properties.name, operationType, movingData);
	}
  });
}

/**
* Input: SourceCountry name, Database rows for corresponding target country data
* Result: Plots arcs from source country to every target country.
*/

function getCentroid(country){
	if (typeof nameToFeatureMap[country] === 'undefined' ||
			typeof nameToFeatureMap[country].centroid === 'undefined'){
  		return projection.invert(path.centroid(nameToFeatureMap[country]));
  	}
	else{
		return nameToFeatureMap[country].centroid;
	}
}

function plotLines(sourceCountry, operationType, movingData) {
	if(operationType == "asylum") {
		var aggregateByTargetCountry = reduce(movingData, 'residence', 'applied_during_year');
	}
	else if (operationType == "migration") {
		var aggregateByTargetCountry = reduce(movingData,'country', 'value');
	} else {
		console.log("Neither migration nor asylum flows selected");
	}
  	var source = getCentroid(sourceCountry);
	var max = Math.log(d3.max(d3.values(aggregateByTargetCountry)));
	for (var targetCountry in aggregateByTargetCountry) {


		var target = getCentroid(targetCountry);
		// var target = projection.invert(projection(nameToFeatureMap[targetCountry].centroid));
		link = {'source': source, 'target': target};
		dValue = path(arc(link));

		var strokeValue = Math.log(aggregateByTargetCountry[targetCountry]+1)/max;
		strokeValue = 0.5 + 10*strokeValue;
	
	  	//offsets for tooltips
  		var offsetL = document.getElementById('container').offsetLeft+20;
  		var offsetT = document.getElementById('container').offsetTop+10;
			

		var mouseOverPath = function(d,i) {
			// console.log(d)
			// console.log(i)
			// console.log(this)
			$(this).addClass("flow-hightlight")
			$(this).attr("class","flow-hightlight")

			var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
			flow_tooltip.classed("hidden", false)
        			.attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
        			.html('Country: ' + d + ", Applicants: " + aggregateByTargetCountry[d]);
		}
    	var mouseExitPath = function(d,i) {
			flow_tooltip.classed("hidden", true);
			$(this).attr("class","flow")
		}
    					
		g.append("path")
			.datum(targetCountry)
			.attr("class","flow")
			.attr("d", dValue)
  			.style('stroke-width', strokeValue)
			.on("mouseover", mouseOverPath)
			.on("mouseout",  mouseExitPath)


	}
}


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
		.domain([0,d3.max(d3.values(data))])
		.range([h, 0]);

	// create a line function that can convert data[] into x and y points
	var line = d3.svg.line()
		// assign the X function to plot our line as we wish
		.x(function(d) { return x(d.key); })
		.y(function(d) { return y(d.value); });

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
	d3.select('#'+data.id).classed('selected', true);
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
		success: function (data) {
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
	$.find('.countries').forEach(function(elem) { elem.style.removeProperty('fill'); });
	var aggregateByTargetCountry = reduce(data, 'residence', 'applied_during_year');
	var scale = d3.scale
		.linear()
		.domain([0,d3.max(d3.values(aggregateByTargetCountry))])
		.range([0,256]);
	max = Math.log(d3.max(d3.values(aggregateByTargetCountry)));
	for (var country in aggregateByTargetCountry) {
		value = Math.log(aggregateByTargetCountry[country]+1)/max * 64;
		value = parseInt( + value);
		value = 'rgb(256,'+(256-(value*4))+','+(256-(value*4))+')';

		element = $.find("#"+nameToFeatureMap[country])[0];
		if ( element != undefined) { element.style.setProperty('fill', value); }
	}

}



}
