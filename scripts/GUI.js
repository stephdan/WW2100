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
	my = {},
	selectedScenario = "ref";

// Enable popovers
$(document).ready(function(){
    $('[data-toggle="popover"]').popover({html: true});
    $(".resizable").resizable({
		minHeight: 200, 
		minWidth: 200,
		constrainment: "#map"
    });
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
		    "<div id='storyTitleText' class='movableWindowTitleText'>Demo Scenario</div>" + 
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
}

my.makeSWEChart = function(feature) {

	d3.select("#SWEchart").remove();

	var data = my.formatSWEdata(feature.properties.SWEdata);

		// Append an svg to the chart window.
	var svg = d3.select("#chartWindowContent")
				.append("svg")
				.attr("id", "SWEchart");

	var margin = 50,
	    width = parseInt(d3.select("#chartWindowContent").style("width")) - margin*2,
	    height = parseInt(d3.select("#chartWindowContent").style("height")) - margin*2;

	// Make a scale for the x-axis. Right now this is time. 
	var xScale = d3.scale.linear()
	    .range([0, width])
	    .nice(d3.time.year);

	var yScale = d3.scale.linear()
	    .range([height, 0])
	    .nice();

	var xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient("bottom")
	    .tickFormat(d3.format("d"));

	var yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient("left");

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
	               .attr("transform", "translate(" + margin + "," + margin + ")");

	data.forEach(function(d) {
      d.year = Number(d.year);
      d.SWE = +d.SWE/100000;
    });

	xScale.domain(d3.extent(data, function(d) { return d.year; }));
    yScale.domain(d3.extent(data, function(d) { return d.SWE; }));
    // yScale.domain([0, 800]);

	graph.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);
	graph.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .style("text-anchor", "end")
	      .text("Price ($)");
	graph.append("path")
	      .datum(data)
	      .attr("class", "line")
	      .attr("d", line);
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
		    
		$("#storyTitleText").text($("#dataTypeSelect option:selected").text());
	}
};

my.makeChartWindow = function() {
	var chartWindow = $(
		"<div id='chartWindow' class='ui-widget-content resizable movable '>" + 
		  "<div id='chartTitleBar' class='movableWindowTitleBar'>" + 
		    "<div id='chartTitleText' class='movableWindowTitleText'>Demo Chart</div>" + 
		    "<div id='closeChartWindow' class='closeWindow'><span class='ui-icon ui-icon-close'></span></div>" + 
		  "</div>" + 
		  "<div id='chartWindowContent' class='resizableContent'>" + 
		  "</div>" + 
		"</div>"
	);

	chartWindow.appendTo("body");

	chartWindow.resizable({
		minHeight: 200, 
		minWidth: 200,
		resize: function(event, ui) {
			// Set the height of the content to match the resized window.
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
		// $("#info").show();
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
}

$("#timeRange").on("change", function() {
	my.loadDataByGUI();
});

$("#info").on("click", function() {
	my.makeStoryWindow();
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

// This sets up the behavior of the info button
$("#info").mouseenter(function() {
	$(this).css("background-color", "rgb(235,235,235)");
}).mouseleave(function() {
	$(this).css("background-color", "");
});

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
	my.makeChartWindow();
	//my.showHideScenarioButtons("lulc");
};

return my;

}($));
