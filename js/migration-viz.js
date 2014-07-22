/* migration-viz.js */

function init() {

// Create the canvas
var svg = d3.select('#map').append('svg')
    .attr('width', '100%')
    .attr('height', '100%');

// Choose the projection.
var projection = d3.geo.mercator();

// Set the created projection on the path.
var path = d3.geo.path()
    .projection(projection)
var unprojectedPath = d3.geo.path();

// Create the arc creator function
var arc = d3.geo.greatArc().precision(1);

// Store the map from country name to country code inside a variable map.
var nameToFeatureMap = Array();
$.getJSON(
	'ne_10m_admin_0_countries_lakes/countries.topo.json',
	function (countries) {
		features = topojson.feature(countries, countries.objects.countries).features;
		for (var i in features) {
			feature = features[i];
			nameToFeatureMap[feature.properties.NAME] = feature;
		}
	}
);

// Use the topojson file to render the map.
d3.json('ne_10m_admin_0_countries_lakes/countries.topo.json', function(error, countries) {
    svg.selectAll('.countries')
        .data(topojson.feature(countries, countries.objects.countries).features)
	.enter()
	.append('path')
        .attr('class', 'countries')
	.attr('id', function (d) {return d.id;})
        .attr('d', path)
	.on('mouseover', function() {
		d3.select(this).classed('hover', true);
	})
	.on('mouseout', function() {
		d3.select(this).classed('hover', false);
	})
	.on('click', plotFlows)
	.append('title').text(function(d) {return d.properties.NAME;});
});

/**
 * Input: TopoJSON Feature
 * Result: Plots arcs from source country to affected country.
 */
function plotFlows(data) {
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
		success: function (migration_data) {
			plotLines(data.properties.NAME, migration_data);
		}
	});
}

/**
 * Input: SourceCountry name, Database rows for corresponding target country data
 * Result: Plots arcs from source country to every target country.
 */
function plotLines(sourceCountry, migrationData) {
	var aggregateByTargetCountry = reduce(migrationData, 'residence', 'applied_during_year');
	console.log(aggregateByTargetCountry);	
	// Get the location of the source country.
	var source = projection.invert(path.centroid(nameToFeatureMap[sourceCountry]));
	console.log(nameToFeatureMap);
	for (var targetCountry in aggregateByTargetCountry) {
		var target = projection.invert(path.centroid(nameToFeatureMap[targetCountry]));
		link = {'source': source, 'target': target};
		dValue = path(arc(link));
		console.log(dValue);
		svg.append("path").attr("d", dValue).attr('stroke-width', 4);
	}
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

function plotAggregateGraph(data) {
	var aggregateByYear = reduce(data, 'year', 'applied_during_year');
	drawLineChart(aggregateByYear);
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

	
function drawLineChart(data) {	
	d3.select('#line_graph').remove();
	// define dimensions of graph
	var m = [80, 80, 80, 80]; // margins
	var w = 1000 - m[1] - m[3]; // width
	var h = 400 - m[0] - m[2]; // height

	// X scale will fit all values from data[] within pixels 0-w
	var x = d3.scale.
		linear().
		domain([d3.min(d3.keys(data)), d3.max(d3.keys(data))])
		.range([0, w]);
	// Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
	var y = d3.scale.
		linear().
		domain([0,d3.max(d3.values(data))])
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

}
