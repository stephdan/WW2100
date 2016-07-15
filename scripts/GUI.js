// NOTES -----------------------------------------------
// how to remove single selectmenu option:
//$("#layerSelect option[value='Pecan']").remove();
// end NOTES -------------------------------------------

App.GUI = (function($){

"use strict";
var layerSelectMenu,
	dataTypeSelectMenu,
	timePeriodSelectMenu,
	scenarioSelectMenu,
	testSelectMenu,
	my = {};


dataTypeSelectMenu = $("#dataTypeSelect").on("change", function(event, ui) {
	// TODO update the options in the 
	// timePeriodSelectMenu and scenarioSelectMenu
	var type = $(this).val();
	// Change the data-target attribute of the info button modal guy maybe.
	if(type === "landcover") {
		$("#info").attr("data-target", "#landcoverModal");
	} else if (type === "snowfall"){
		$("#info").attr("data-target", "#snowfallModal");
	} else if (type === "devLandVal") {
		$("#info").attr("data-target", "#devLandValModal");
	}
	my.loadDataByGUI();
});

timePeriodSelectMenu = $("#timePeriodSelect").on("change", function(event, ui) {
	my.loadDataByGUI();
});

scenarioSelectMenu = $("#scenarioSelect").on("change", function(event, ui) {
	my.loadDataByGUI();
});

my.loadDataByGUI = function() {
	var settings = {};
	
	settings.type = dataTypeSelectMenu.val();
	settings.date = timePeriodSelectMenu.val(); // TODO this will probably not be a dropdown later
	settings.scenario = scenarioSelectMenu.val();
	
	App.addWW2100DataLayer(settings);
		
};

// Populates the layerSelectMenu with options based on available data layers.
// TODO Obsolete, but useful for reference.
function updateLayerSelectMenu() {
	var layer,
		options = [];
	// removes all options from a selectmenu
	$('#layerSelect').find('option').remove().end();
	for(layer in App.dataLayers) {
		if(App.dataLayers.hasOwnProperty(layer)) {
			options.push("<option value='" + layer + "'>" + layer + "</option>");
		}
	}
	// Drops new html into the selectmenu
	layerSelectMenu.append(options.join(""));
	// refreshes selectmenu so it shows new options. 
	$("#layerSelect").selectmenu("refresh");
}

my.updateLayerSelectMenu = function() {
	updateLayerSelectMenu();
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

my.init = function() {
	//updateLayerSelectMenu();
};

return my;

}($));
