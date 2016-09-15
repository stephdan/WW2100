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
    $('[data-toggle="popover"]').popover();
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

// TODO Starting to add functionality for programmatically creating story windows.
// Learned it from cartovis!
my.makeStoryWindow = function() {
	var storyWindow = $(
		"<div id='storyWindow' class='ui-widget-content resizable'>" + 
		  "<div id='storyTitleBar'>" + 
		    "<div id='storyTitleText'>Demo Scenario</div>" + 
		    "<div class='closeStoryWindow'><span class='ui-icon ui-icon-close'></span></div>" + 
		  "</div>" + 
		  "<div class='storyContent resizableContent'>" + 
		  "</div>" + 
		"</div>"
	);
	
	storyWindow.appendTo("body");

	$(".resizableContent").height(function() {
		var storyWindowHeight = $("#storyWindow").height(),
			storyTitleBarHeight = $("#storyTitleBar").height(),
			padding = $(".resizableContent").innerHeight() - $(".resizableContent").height();
		
		return storyWindowHeight - (storyTitleBarHeight + (padding));
	});

	storyWindow.resizable({
		minHeight: 200, 
		minWidth: 200,
		resize: function(event, ui) {
			// Set the height of the content
			$(".resizableContent").height(function() {
				var storyWindowHeight = $("#storyWindow").height(),
					storyTitleBarHeight = $("#storyTitleBar").height(),
					padding = $(".resizableContent").innerHeight() - $(".resizableContent").height();
				
				return storyWindowHeight - (storyTitleBarHeight + (padding));
			});
		}
	});
	
	my.updateStoryWindow();
	    
	$(".closeStoryWindow").click(function() {
		storyWindow.remove();
		$("#info").show();
	});
};

my.updateStoryWindow = function() {
	if( $("#storyWindow").length ) {
		var storyTextFilePath = "dataLayerStories/" + dataTypeSelectMenu.val() + ".txt";
	
		$.get(storyTextFilePath)
		    .done(function() { 
		        $(".storyContent").load(storyTextFilePath);
		    }).fail(function() { 
		         $(".storyContent").load("dataLayerStories/doesNotExist.txt");
		    });
		    
		$("#storyTitleText").text($("#dataTypeSelect option:selected").text());
	}
};

// remove popovers when the window is resized
$(window).on('resize', function () {
    // hide tooltips
    //$(".scenarioButton").popover("hide");
    $(".scenarioExplainerButton").blur();
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

$(".scenarioExplainerButton").focusin(function() {
	// Figure out which one this is
	var id = $(this).prop("id");
	// chop off the word explainer
	var idWithoutExplainer = id.slice(0, id.length - 9);
	
	$("#" + idWithoutExplainer).popover("show");
});

$(".scenarioExplainerButton").focusout(function() {
	// Figure out which one this is
	var id = $(this).prop("id");
	// chop off the word explainer
	var idWithoutExplainer = id.slice(0, id.length - 9);
	
	$("#" + idWithoutExplainer).popover("hide");
});

dataTypeSelectMenu = $("#dataTypeSelect").on("change", function(event, ui) {
	// TODO update the options in the 
	// timePeriodSelectMenu and scenarioSelectMenu
	var type = $(this).val();
	// Change the data-target attribute of the info button. This way information
	// about this layer will be shown when the info button is clicked. 
	if(type === "landcover") {
		$("#info").attr("data-target", "#landcoverModal");		
	} else if (type === "snowWaterEquivalent"){
		$("#info").attr("data-target", "#snowfallModal");
	} else if (type === "devLandVal") {
		$("#info").attr("data-target", "#devLandValModal");
	}
	my.showHideScenarioButtons(type);
	my.loadDataByGUI();
	my.updateStoryWindow();
});

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
};

return my;

}($));
