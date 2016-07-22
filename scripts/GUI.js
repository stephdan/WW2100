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


dataTypeSelectMenu = $("#dataTypeSelect").on("change", function(event, ui) {
	// TODO update the options in the 
	// timePeriodSelectMenu and scenarioSelectMenu
	var type = $(this).val(),
		showTheseButtons,
		hideTheseButtons;
	// Change the data-target attribute of the info button. This way information
	// about this layer will be shown when the info button is clicked. 
	if(type === "landcover") {
		$("#info").attr("data-target", "#landcoverModal");		
	} else if (type === "snowfall"){
		$("#info").attr("data-target", "#snowfallModal");
	} else if (type === "devLandVal") {
		$("#info").attr("data-target", "#devLandValModal");
	}
	my.showHideScenarioButtons(type);
	my.loadDataByGUI();
});

$("#timeRange").on("change", function() {
	my.loadDataByGUI();
});

// scenarioSelectMenu = $("#scenarioSelect").on("change", function(event, ui) {
	// my.loadDataByGUI();
// });

$("#baseLayerSelect").on("change", function(event, ui) {
	App.setBaseLayer($(this).val());
});

$("#refButtonLabel").on("click", function() {
	if(selectedScenario !== "ref") {
		selectedScenario = "ref";
		my.loadDataByGUI();
	}
});

$("#econExtremeButtonLabel").on("click", function() {
	if(selectedScenario !== "econExtreme") {
		selectedScenario = "econExtreme";
		my.loadDataByGUI();
	}
});

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
	// Is the box checked or not?
	var isChecked = $(this).prop("checked");
	App.settings.showReferenceLayers = isChecked;
	if(isChecked) {
		App.addReferenceLayers();
	} else {
		App.clearReferenceLayers();
	}
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
		if($(this).hasClass(type)) {
			$(this).show();
		} else {
			$(this).hide();
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
	//updateLayerSelectMenu();
};

return my;

}($));
