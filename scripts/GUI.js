// NOTES -----------------------------------------------
// how to remove single selectmenu option:
//$("#layerSelect option[value='Pecan']").remove();
// end NOTES -------------------------------------------

App.GUI = (function($){

"use strict";

var layerSelectMenu,
	dataTypeSelectMenu,
	scenarioSelectMenu,
	testSelectMenu,
	currentSWEChart,
	my = {},
	selectedScenario = "ref";

// Enable popovers
$(document).ready(function(){
    $('[data-toggle="popover"]').popover({html: true});
    // $(".resizable").resizable({
		// minHeight: 200, 
		// minWidth: 200,
		// constrainment: "#map"
    // });
});

// $(".closeStoryWindow").click(function() {
	// $("#storyWindow").hide();
	// $("#info").show();
// })

// Programmatically creating story windows.
// Learned it from cartovis!
my.makeStoryWindow = function() {
	var storyWindow = $(
		"<div id='storyWindow' class='ui-widget-content resizable movable'>" + 
		  "<div id='storyTitleBar' class='movableWindowTitleBar'>" + 
		    "<div id='storyTitleText' class='movableWindowTitleText'>What To Look For</div>" + 
		    "<div id='closeStoryWindow' class='closeWindow'><span class='ui-icon ui-icon-close'></span></div>" + 
		  "</div>" + 
		  "<div id='storyWindowContent' class='resizableContent'>" + 
		  "</div>" + 
		"</div>"
	);
	
	storyWindow.appendTo("body");

	$("#storyWindowContent").height(function() {
		var storyWindowHeight = $("#storyWindow").height(),
			storyTitleBarHeight = $("#storyTitleBar").height(),
			padding = $("#storyWindowContent").innerHeight() - $("#storyWindowContent").height();
		
		return storyWindowHeight - (storyTitleBarHeight + (padding));
	});

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

	my.updateStoryWindow();
	    
	$("#closeStoryWindow").click(function() {
		storyWindow.remove();
		$("#info").show();
	});
};

my.updateStoryWindow = function() {
	if( $("#storyWindow").length ) {
		var storyTextFilePath = "dataLayerStories/" + dataTypeSelectMenu.val() + ".txt";
	
		$.get(storyTextFilePath)
		    .done(function() { 
		        $("#storyWindowContent").load(storyTextFilePath);
		    }).fail(function() { 
		         $("#storyWindowContent").load("dataLayerStories/doesNotExist.txt");
		    });
		
		// Update the title text of the story box. 
		// TODO Title will probably remain constant now, so this can be deleted.
		//$("#storyTitleText").text($("#dataTypeSelect option:selected").text());
	}
};

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

my.SWEGraph = function (feature){
	var self = this;
	var data = my.formatSWEdata(feature.properties.SWEdata);

		// Append an svg to the chart window.
	var svg = d3.select("#chartWindowContent")
				.append("svg")
				.attr("id", "SWEchart");

	var margin = 40,
		margins = {top: 6, right: 24, bottom: 20, left: 40},
		padding = $("#chartWindowContent").innerHeight() - $("#chartWindowContent").height(),
	    width = parseInt(d3.select("#chartWindowContent").style("width")) - (margins.left + margins.right) - padding,
	    height = parseInt(d3.select("#chartWindowContent").style("height")) - (margins.top + margins.bottom) -  padding;

	// Make a scale for the x-axis. Right now this is time. 
	var xScale = d3.scale.linear().range([0, width]).nice(d3.time.year);

	var yScale = d3.scale.linear().range([height, 0]).nice();

	var xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient("bottom")
	    .tickFormat(d3.format("d"))
	    .ticks(Math.max(width/50, 2));

	var yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient("left")
	    .ticks(Math.max(height/50, 2));

	var line = d3.svg.line()
	    .x(function(d) { 
	      // console.log(d);
	      return xScale(d.year); 
	    })
	    .y(function(d) { 
	      return yScale(d.SWE); 
	    });

	var graph = svg.attr("width", width + margin*2)
					.attr("height", height + margin*2)
					.append("g")
					.attr("transform", "translate(" + margins.left + "," + margins.top + ")");

	data.forEach(function(d) {
      d.year = Number(d.year);
      d.SWE = +d.SWE/100000;
    });

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
    



    // yScale.domain([0, 200]);
	
	graph.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);
	graph.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	    .append("text")
	      .style("font-size", 10)
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .style("text-anchor", "end")
	      .text("Max SWE (mm)");
	graph.append("path")
	      .datum(data)
	      .attr("class", "line")
	      .attr("d", line);
	      
	self.data = data;
	self.graph = graph;
	self.line = line;
	self.margin = margin;
	self.margins = margins;
	self.width = width;
	self.height = height;
	self.xScale = xScale;
	self.yScale = yScale;
	self.xAxis = xAxis;
	self.yAxis = yAxis;
	self.svg = svg;
};

my.SWEGraph.prototype.resize = function() {
	var self = this;
	var padding = $("#chartWindowContent").innerHeight() - $("#chartWindowContent").height();
	/* Find the new window dimensions */
	self.width = parseInt(d3.select("#chartWindowContent").style("width")) - (self.margins.left + self.margins.right) - padding;
	self.height = parseInt(d3.select("#chartWindowContent").style("height")) - (self.margins.top + self.margins.bottom) - padding;
	
	self.svg.attr("width", self.width + self.margin*2)
					.attr("height", self.height + self.margin*2)
					.append("g")
					.attr("transform", "translate(" + self.margin + "," + self.margin + ")");
	   
	/* Update the range of the scale with new width/height */
	self.xScale.range([0, self.width]).nice(d3.time.year);
	self.yScale.range([self.height, 0]).nice();
	   
	  /* Update the axis with the new scale */
	self.graph.select('.x.axis')
	    .attr("transform", "translate(0," + self.height + ")")
	    .call(self.xAxis);
	   
	self.graph.select('.y.axis')
	    .call(self.yAxis);
	   
	  /* Force D3 to recalculate and update the line */
	self.graph.selectAll('.line')
	    .attr("d", self.line);
	
	self.xAxis.ticks(Math.max(self.width/50, 2));
	self.yAxis.ticks(Math.max(self.height/50, 2));
};

my.makeSWEGraph = function(feature) {

	// Only make the graph if the chart window exists.
	// TODO is it a chart or a graph? Decide!
	if($("#chartWindow").length) {
		d3.select("#SWEchart").remove();
		d3.select("#chartWindowContent").text("");
		currentSWEChart = new my.SWEGraph(feature);
	}
};



my.makeChartWindow = function() {
	var chartWindow = $(
		"<div id='chartWindow' class='ui-widget-content resizable movable'>" + 
		  "<div id='chartTitleBar' class='movableWindowTitleBar'>" + 
		    "<div id='chartTitleText' class='movableWindowTitleText'>Max SWE by decade</div>" + 
		    "<div id='closeChartWindow' class='closeWindow'><span class='ui-icon ui-icon-close'></span></div>" + 
		  "</div>" + 
		  "<div id='chartWindowContent' class='resizableContent'>Hover over map features to see change in max SWE over time." + 
		  "</div>" + 
		"</div>"
	);

	chartWindow.css("left", function() {
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
			currentSWEChart.resize();
			$("#chartWindowContent").height(function() {
				var chartWindowHeight = $("#chartWindow").height(),
					chartTitleBarHeight = $("#chartTitleBar").height(),
					padding = $("#chartWindowContent").innerHeight() - $("#chartWindowContent").height();
				
				return chartWindowHeight - (chartTitleBarHeight + (padding));
			});
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
		$("#showGraphButton").show();
	});
};

// remove popovers when the window is resized
$(window).on('resize', function () {
    $(".explainerButton").blur();
});

// Require manual triggers for popovers so they don't appear when
// scenario buttons are clicked.
$(".scenarioButton").popover({trigger: "manual"});

// Add focus to a scenarioButtonExplainer when it's clicked.
// FIXME The buttons already get focus in Firefox, but not in chrome. Maybe
// it would be better to figure out why they're not getting focus in chrome. 
$(".scenarioExplainerButton").on("click", function() {
	if($(this).is(":focus")) {
		return;
	}
	$(this).focus();
});

$(".explainerButton").focusin(function() {
	// Figure out which one this is
	var id = $(this).prop("id");
	// chop off the word explainer
	var idWithoutExplainer = id.slice(0, id.length - 9);
	
	$("#" + idWithoutExplainer).popover("show");
});

$(".explainerButton").focusout(function() {
	// Figure out which one this is
	var id = $(this).prop("id");
	// chop off the word explainer
	var idWithoutExplainer = id.slice(0, id.length - 9);
	
	$("#" + idWithoutExplainer).popover("hide");
});

dataTypeSelectMenu = $("#dataTypeSelect").on("change", function(event, ui) {
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
		$("#showGraphButton").hide();
	}
});

// Change the labels of the time period slider based on the currently selected
// data layer. 
my.updateTimePeriodLabels = function(dataLayer) {
	var early = $("#earlyTimePeriodLabel"),
		mid = $("#midTimePeriodLabel"),
		late = $("#lateTimePeriodLabel");

	if(dataLayer === "maxSWE") {
		early.text("2010s");
		mid.text("2050s");
		late.text("2090s");
	} else {
		early.text("2010");
		mid.text("2050");
		late.text("2099");
	}
};

$("#timeRange").on("change", function() {
	my.loadDataByGUI();
});

$("#info").on("click", function() {
	my.makeStoryWindow();
	$(this).hide();
});

$("#showGraphButton").on("click", function() {
	my.makeChartWindow();
	$(this).hide();
});

$("#baseLayerSelect").on("change", function(event, ui) {
	App.setBaseLayer($(this).val());
});


// SCENARIO BUTTONS ------------------------------------------------------------
// TODO these can be consolidated into a single event listener. Later.

$("#lowClimButton").on("click", function() {
	if(selectedScenario !== "lowClim") {
		selectedScenario = "lowClim";
		my.loadDataByGUI();
	}
});

$("#refButton").on("click", function() {
	if(selectedScenario !== "ref") {
		selectedScenario = "ref";
		my.loadDataByGUI();
	}
});

$("#econExtremeButton").on("click", function() {
	if(selectedScenario !== "econExtreme") {
		selectedScenario = "econExtreme";
		my.loadDataByGUI();
	}
});

$("#highPopButton").on("click", function() {
	if(selectedScenario !== "highPop") {
		selectedScenario = "highPop";
		my.loadDataByGUI();
	}
});

$("#fireSuppressButton").on("click", function() {
	if(selectedScenario !== "fireSuppress") {
		selectedScenario = "fireSuppress";
		my.loadDataByGUI();
	}
});

$("#highClimButton").on("click", function() {
	if(selectedScenario !== "highClim") {
		selectedScenario = "highClim";
		my.loadDataByGUI();
	}
});

$("#econExtremeButton").on("click", function() {
	if(selectedScenario !== "econExtreme") {
		selectedScenario = "econExtreme";
		my.loadDataByGUI();
	}
});

$("#urbExpandButton").on("click", function() {
	if(selectedScenario !== "urbanExpand") {
		selectedScenario = "urbanExpand";
		my.loadDataByGUI();
	}
});

$("#managedButton").on("click", function() {
	if(selectedScenario !== "managed") {
		selectedScenario = "managed";
		my.loadDataByGUI();
	}
});

// end scenario buttons -------------------------------------------------------


$("#opacitySlider").on("input", function() {
	App.setDataLayerOpacity($(this).val());
});

my.loadDataByGUI = function() {
	var settings = {},
		timeRangeSliderValue = $("#timeRange").val();
	
	settings.type = dataTypeSelectMenu.val();
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

// Checkboxes for adding/removing reference layers
$("#citiesLayerCheckbox").on("click", function() {
	App.settings.showCities = $(this).prop("checked");
	App.addReferenceLayers();
});

// Checkboxes for adding/removing reference layers
$("#streamsLayerCheckbox").on("click", function() {
	App.settings.showStreams = $(this).prop("checked");
	App.addReferenceLayers();
});

my.hideButtonById = function(buttonId) {
	var button = $("#" + buttonId);	
	button.hide();	
};

my.showButtonById = function(buttonId) {
	var button = $("#" + buttonId);	
	button.show();	
};

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

my.showHideButtons = function(showTheseButtons, hideTheseButtons) {
	var i;
	for(i = 0; i < showThese.length; i += 1) {
		my.showButtonById(showTheseButtons[i]);
	}
	for(i = 0; i < hideThese.length; i += 1) {
		my.hideButtonById(hideTheseButtons[i]);
	}
};

my.init = function() {
	my.makeStoryWindow();
	// my.makeChartWindow();
	//my.showHideScenarioButtons("lulc");
};

return my;

}($));
