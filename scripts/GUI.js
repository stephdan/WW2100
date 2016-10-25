
// This module contains all code pertaining to the graphical user interface.
App.GUI = (function($){

"use strict";

var currentSWEChart, // More than one function needs access to this.
	selectedScenario, // Same here
	my = {}; // returned at the end of the module. 

// Helper function for determining if an html element has overflow content.
$.fn.overflown = function() {
	var e = this[0];
	return e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth;
};

// Enable bootstrap.js popovers
$(document).ready(function(){
    $('[data-toggle="popover"]').popover({html: true});
});

// Require manual triggers for popovers so they don't appear when
// scenario buttons are clicked.
$(".scenarioButton").popover({trigger: "manual"});

// Do stuff when the window is resized
$(window).on('resize', function () {
	// remove popovers
    $(".explainerButton").blur();
    // Ensure the sidebar is the correct height.
    my.updateSidebarLayout();
});

// Sets the height and width of the sidebar based on the window height.
// Increases the width slightly if the sidebar needs a scroll bar. 
my.updateSidebarLayout = function() {
	var sidebar = $("#dataSelectUIContainer");
	
	// The sidebar should never be taller than the window - 20px.
	sidebar.css("max-height", function() {
		return $(window).height() - 20;
	});
	
    // If the sidebar is overflown, make it wider to make room for the scrollbar.
    if(sidebar.overflown()) {
    	sidebar.width(208);
    	$("#showChartButton").css("right", 250);
    } else {
    	sidebar.width(188);
    	$("#showChartButton").css("right", 230);
    }
};

// Create a movable/resizable window to hold text about the current data layer.
// Inspired by cartovis.com
my.makeStoryWindow = function() {
	// Create the window html and append it to the page. 
	var storyWindow = $(
		"<div id='storyWindow' class='ui-widget-content resizable movable'>" + 
		  "<div id='storyTitleBar' class='movableWindowTitleBar'>" + 
		    "<div id='storyTitleText' class='movableWindowTitleText'>What To Look For</div>" + 
		    "<div id='closeStoryWindow' class='closeWindow'><span class='ui-icon ui-icon-close'></span></div>" + 
		  "</div>" + 
		  "<div id='storyWindowContent' class='resizableContent'>" + 
		  "</div>" + 
		"</div>"
	).appendTo("body");

	// Set the window content height. It's made complicated by the fact that
	// the window size is adjustable and the content is scrollable.
	$("#storyWindowContent").height(function() {
		var storyWindowHeight = $("#storyWindow").height(),
			storyTitleBarHeight = $("#storyTitleBar").height(),
			padding = $("#storyWindowContent").innerHeight() - $("#storyWindowContent").height();		
		return storyWindowHeight - (storyTitleBarHeight + (padding));
	});

	// Make the window resizable
	storyWindow.resizable({
		minHeight: 200, 
		minWidth: 200,
		resize: function(event, ui) {
			// Set the height of the content
			$("#storyWindowContent").height(function() {
				var storyWindowHeight = $("#storyWindow").height(),
					storyTitleBarHeight = $("#storyTitleBar").height(),
					padding = $("#storyWindowContent").innerHeight() - $("#storyWindowContent").height();
				return storyWindowHeight - (storyTitleBarHeight + (padding));
			});
		}
	});
	
	// Make the window draggable.
	storyWindow.draggable({
		containment: "parent",
		handle: "#storyTitleBar",
		start: function() {
			storyWindow.css("opacity", "0.7");
		},
		stop: function() {
			storyWindow.css("opacity", "1");
		}
	});

	// Add text to the window.
	my.updateStoryWindow();
	
	// Make the window closable by clicking the x. Show the button for
	// opening it again.
	$("#closeStoryWindow").click(function() {
		storyWindow.remove();
		$("#info").show();
	});
};

// Updates the content of the story window based on current data settings.
// Loads a text file from the dataLayerStories folder as html.
my.updateStoryWindow = function() {
	// Check if there is a window
	if( $("#storyWindow").length ) {
		// build a path to the correct .txt file
		var storyTextFilePath = "dataLayerStories/" + $("#dataTypeSelect").val() + ".txt";
	
		// Get the .txt file, load it into the window as html. 
		$.get(storyTextFilePath)
		    .done(function() { 
		        $("#storyWindowContent").load(storyTextFilePath);
		    }).fail(function() { 
		         $("#storyWindowContent").load("dataLayerStories/doesNotExist.txt");
		    });
	}
};

// Format the SWEdata to be compatible with D3 in order to make a nice 
// line chart.
my.formatSWEdata = function(SWEdata) {
	var newData = [],
		year,
		years = Object.keys(SWEdata),
		yearSWEpair, 
		i;
	for (i = 0; i < years.length; i += 1) {
		if(years[i] !== "huc") {
			yearSWEpair = {
				year: years[i],
				SWE: SWEdata[years[i]]
			};
			newData.push(yearSWEpair);
		}
	}
	return newData;
};

// Constructor for a line chart of SWE data associated with the passed-in
// feature. Creates and displays the chart. Is dependant on there being a
// #chartWindowContent div element.
my.SWEChart = function (feature){
	
	var self, data, svg, margins, padding, width, height,
		xScale, yScale, xAxis, yAxis, line, chart;
	
	// store "this" (the chart) in a variable to avoid weird d3 conflicts.
	self = this;
	
	// Format the SWE data for d3
	data = my.formatSWEdata(feature.properties.SWEdata);

	// Append an svg to the chart window.
	svg = d3.select("#chartWindowContent")
				.append("svg")
				.attr("id", "SWEchart");

	// Margins around the chart to make room for labels
	margins = {top: 6, right: 24, bottom: 20, left: 40};
	
	// The padding of the content window
	padding = $("#chartWindowContent").innerHeight() - $("#chartWindowContent").height();
	
	// Chart width and height
	width = parseInt(d3.select("#chartWindowContent").style("width")) - (margins.left + margins.right) - padding;
	height = parseInt(d3.select("#chartWindowContent").style("height")) - (margins.top + margins.bottom) - padding;

	// Make a scale for the axes. 
	xScale = d3.scale.linear().range([0, width]).nice(d3.time.year);
	yScale = d3.scale.linear().range([height, 0]).nice();

	// Create the axes
	xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient("bottom")
	    .tickFormat(d3.format("d"))
	    .ticks(Math.max(width/50, 2));
	yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient("left")
	    .ticks(Math.max(height/50, 2));

	// Create the line of the line chart
	line = d3.svg.line()
	    .x(function(d) { 
	      return xScale(d.year); 
	    })
	    .y(function(d) { 
	      return yScale(d.SWE); 
	    });

	// Add and lay out the svg for the chart
	chart = svg.attr("width", width + margins.left * 2)
					.attr("height", height + margins.left * 2)
					.append("g")
					.attr("transform", "translate(" + margins.left + "," + margins.top + ")");

	// Format the SWE data a bit more. Make sure the years are numbers, and 
	// that the SWE is in millimeters.
	data.forEach(function(d) {
        d.year = Number(d.year);
        d.SWE = +d.SWE/100000;
    });

	// Set up the scales for the axes. The y axis is a little special, and
	// depends on the maximum SWE value for this feature. 
	xScale.domain(d3.extent(data, function(d) { return d.year; }));
    yScale.domain([0, Math.ceil(d3.extent(data, function(d) {
    		if(d.SWE<=1) {
    			return 1;
    		} else if (d.SWE <= 10) {
    			return 10;
    		} else if (d.SWE <= 50) {
    			return 50;
    		} else {
    			return d.SWE;
    		}
    	})[1] ) ]);
    
    // Add the axes and line to the chart.
	chart.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);
	chart.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	    .append("text")
	      .style("font-size", 10)
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .style("text-anchor", "end")
	      .text("Max SWE (mm)");
	chart.append("path")
	      .datum(data)
	      .attr("class", "line")
	      .attr("d", line);
	
	// Expose the variables of this chart object.
	// TODO It doesn't have to be this way.
	self.data = data;
	self.chart = chart;
	self.line = line;
	self.margins = margins;
	self.width = width;
	self.height = height;
	self.xScale = xScale;
	self.yScale = yScale;
	self.xAxis = xAxis;
	self.yAxis = yAxis;
	self.svg = svg;
};

// Function for resizing the SWEChart. It is dependent on a "#chartWindowContent"
// div element.
// TODO It might be better if the dimensions were passed in, which would allow
// this function to be independant of the window. For example, I could change
// the id of the window without breaking this. 
my.SWEChart.prototype.resize = function() {
	var self = this;
	var padding = $("#chartWindowContent").innerHeight() - $("#chartWindowContent").height();
	/* Find the new window dimensions */
	self.width = parseInt(d3.select("#chartWindowContent").style("width")) - (self.margins.left + self.margins.right) - padding;
	self.height = parseInt(d3.select("#chartWindowContent").style("height")) - (self.margins.top + self.margins.bottom) - padding;
	
	self.svg.attr("width", self.width + self.margins.left + self.margins.right)
					.attr("height", self.height + self.margins.top + self.margins.bottom)
					.append("g")
					.attr("transform", "translate(" + self.margins.top + "," + self.margins.left + ")");
	   
	/* Update the range of the scale with new width/height */
	self.xScale.range([0, self.width]).nice(d3.time.year);
	self.yScale.range([self.height, 0]).nice();
	   
	  /* Update the axis with the new scale */
	self.chart.select('.x.axis')
	    .attr("transform", "translate(0," + self.height + ")")
	    .call(self.xAxis);
	   
	self.chart.select('.y.axis')
	    .call(self.yAxis);
	   
	  /* Force D3 to recalculate and update the line */
	self.chart.selectAll('.line')
	    .attr("d", self.line);
	
	self.xAxis.ticks(Math.max(self.width/50, 2));
	self.yAxis.ticks(Math.max(self.height/50, 2));
};

// Create a new chart.
my.makeSWEChart = function(feature) {
	// Only make the chart if the chart window exists.
	if($("#chartWindow").length) {
		d3.select("#SWEchart").remove();
		d3.select("#chartWindowContent").text("");
		currentSWEChart = new my.SWEChart(feature);
	}
};

// Creates and adds a resizable/movable window to hold the SWEchart. 
// Very similar to makeStoryWindow.
my.makeChartWindow = function() {
	var chartWindow = $(
		"<div id='chartWindow' class='ui-widget-content resizable movable'>" + 
		  "<div id='chartTitleBar' class='movableWindowTitleBar'>" + 
		    "<div id='chartTitleText' class='movableWindowTitleText'>Average Max SWE by decade</div>" + 
		    "<div id='closeChartWindow' class='closeWindow'><span class='ui-icon ui-icon-close'></span></div>" + 
		  "</div>" + 
		  "<div id='chartWindowContent' class='resizableContent'>Hover over map features to see change in max SWE over time." + 
		  "</div>" + 
		"</div>"
	);

	chartWindow.css("left", function() {
		var sidebar = $("#dataSelectUIContainer");
		
		if(sidebar.overflown()) {
			return $(window).width() - 550;
		}
		return $(window).width() - 530;
		
	});

	chartWindow.appendTo("body");

	$("#chartWindowContent").height(function() {
		var chartWindowHeight = $("#chartWindow").height(),
			chartTitleBarHeight = $("#chartTitleBar").height(),
			padding = $("#chartWindowContent").innerHeight() - $("#chartWindowContent").height();
		return chartWindowHeight - (chartTitleBarHeight + (padding));
	});

	chartWindow.resizable({
		minHeight: 200, 
		minWidth: 250,
		maxWidth: 500,
		maxHeight: 460,
		resize: function(event, ui) {
			// Set the height of the content to match the resized window.
			
			$("#chartWindowContent").height(function() {
				var chartWindowHeight = $("#chartWindow").height(),
					chartTitleBarHeight = $("#chartTitleBar").height(),
					padding = $("#chartWindowContent").innerHeight() - $("#chartWindowContent").height();
				
				return chartWindowHeight - (chartTitleBarHeight + (padding));
			});
			// Resize the Chart if it exists
			if($("#SWEchart").length) {
				currentSWEChart.resize();
			}
		}
	});

	chartWindow.draggable({
		containment: "parent",
		handle: "#chartTitleBar",
		start: function() {
			chartWindow.css("opacity", "0.7");
		},
		stop: function() {
			chartWindow.css("opacity", "1");
		}
	});

	$("#closeChartWindow").click(function() {
		chartWindow.remove();
		$("#showChartButton").show();
	});
};

// Add focus to a scenarioButtonExplainer when it's clicked.
// FIXME The buttons already get focus in Firefox, but not in chrome. Maybe
// it would be better to figure out why they're not getting focus in chrome. 
$(".explainerButton").on("click", function() {
	if($(this).is(":focus")) {
		return;
	}
	$(this).focus();
});

// Show the correct popover when an explainerButton gets focus. 
$(".explainerButton").focusin(function() {
	// Figure out which button this is
	var id = $(this).prop("id");
	// chop off the word explainer
	var idWithoutExplainer = id.slice(0, id.length - 9);
	
	// Show the popover with the matching id
	$("#" + idWithoutExplainer).popover("show");
});

// Hide the correct popover when an explainerButton loses focus. 
$(".explainerButton").focusout(function() {
	// Figure out which one this is
	var id = $(this).prop("id");
	// chop off the word explainer
	var idWithoutExplainer = id.slice(0, id.length - 9);
	// Hide the popover with the matching id
	$("#" + idWithoutExplainer).popover("hide");
});

// Do stuff when the "Select Data Layer" dropdown is changed.
// Loads and displays the appropriate data layer, updates the scenario buttons,
// and updates the story window. Creates a chart window if it's the SWE data.
$("#dataTypeSelect").on("change", function(event, ui) {
	var dataLayer = $(this).val();	
	// If the currently selected scenario isn't used by this dataLayer, change
	// it to the reference scenario by manually clicking the reference case
	// button. The class list of the selected scenario
	// button includes the names of the data layers that use that scenario.
	if($("#" + selectedScenario + "Button").hasClass(dataLayer)){
		my.loadDataByGUI(); 
	} else {
		$("#refButton").click();
	}
	my.showHideScenarioButtons(dataLayer);
	my.updateTimePeriodLabels(dataLayer);
	my.updateStoryWindow();
	
	if(dataLayer === "maxSWE") {
		my.makeChartWindow();
	} else {
		$("#chartWindow").remove();
		$("#showChartButton").hide();
	}
	my.updateSidebarLayout();
});

// Change the labels of the time period slider based on the currently selected
// data layer. 
my.updateTimePeriodLabels = function(dataLayer) {
	var early = $("#earlyTimePeriodLabel"),
		mid = $("#midTimePeriodLabel"),
		late = $("#lateTimePeriodLabel");

	if(dataLayer === "maxSWE" || dataLayer === "et") {
		early.text("2010s");
		mid.text("2050s");
		late.text("2090s");
	} else {
		early.text("2010");
		mid.text("2050");
		late.text("2099");
	}
};

// When the time slider changes, update the map
$("#timeRange").on("change", function() {
	my.loadDataByGUI();
});

//When the info button is clicked, open the story window
$("#info").on("click", function() {
	my.makeStoryWindow();
	$(this).hide();
});

// When the chart button is clicked, show the SWE chart.
$("#showChartButton").on("click", function() {
	my.makeChartWindow();
	$(this).hide();
});

// When the base layer selector changes, change the base layer
$("#baseLayerSelect").on("change", function(event, ui) {
	App.setBaseLayer($(this).val());
});


// When a scenario button is clicked, load the correct data to the map.
$(".scenarioButton").on("click", function() {
	// Which button is it?
	var id = $(this)[0].id,
		scenario = id.slice(0, -6);
	console.log(scenario);
	if(selectedScenario !== scenario) {
		selectedScenario = scenario;
		my.loadDataByGUI();
	}
});

// Change opacity when the opacity slider changes.
$("#opacitySlider").on("input", function() {
	App.setDataLayerOpacity($(this).val());
});

// Load the correct data layer based on current GUI settings. 
my.loadDataByGUI = function() {
	var settings = {},
		timeRangeSliderValue = $("#timeRange").val();
	
	settings.type = $("#dataTypeSelect").val();
	settings.scenario = selectedScenario;
	
	if(timeRangeSliderValue === "1") {
		settings.date = "early";
	} else if (timeRangeSliderValue === "2") {
		settings.date = "mid";
	} else {
		settings.date = "late";
	}
	App.addWW2100DataLayer(settings);
};

// Checkboxes for adding/removing cities reference layer
$("#citiesLayerCheckbox").on("click", function() {
	App.settings.showCities = $(this).prop("checked");
	App.addReferenceLayers();
});

// Checkboxes for adding/removing streams reference layer
$("#streamsLayerCheckbox").on("click", function() {
	App.settings.showStreams = $(this).prop("checked");
	App.addReferenceLayers();
});

// Hide the scenario button with the matching id
my.hideButtonById = function(buttonId) {
	var button = $("#" + buttonId);	
	button.hide();	
};

// Show the scenario button with the matching id
my.showButtonById = function(buttonId) {
	var button = $("#" + buttonId);	
	button.show();	
};

// Show or hide the correct scenario buttons based on the type of data 
// currently on display.
my.showHideScenarioButtons = function(type) {
	// Show and hide buttons based on the current scenario
	$(".scenarioButton").each(function(i) {
		var id = $(this).prop("id");
		
		if($(this).hasClass(type)) {
			$(this).show();
			$("#" + id + "Explainer").show();
		} else {
			$(this).hide();
			$("#" + id + "Explainer").hide();
		}
	});
};

// Initialize the GUI
my.init = function() {
	selectedScenario = "ref";
	my.makeStoryWindow();
	my.updateSidebarLayout();
};

return my;

}($));
