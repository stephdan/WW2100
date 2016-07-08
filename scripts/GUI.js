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
	my = {};


dataTypeSelectMenu = $("#dataTypeSelect").selectmenu().on("selectmenuselect", function(event, ui) {
	// TODO update the options in the 
	// timePeriodSelectMenu and scenarioSelectMenu
	my.loadDataByGUI();
});

timePeriodSelectMenu = $("#timePeriodSelect").selectmenu().on("selectmenuselect", function(event, ui) {
	my.loadDataByGUI();
});

scenarioSelectMenu = $("#scenarioSelect").selectmenu().on("selectmenuselect", function(event, ui) {
	my.loadDataByGUI();
});

my.loadDataByGUI = function() {
	var type = dataTypeSelectMenu.val(),
		date = timePeriodSelectMenu.val(), // TODO this will probably not be a dropdown later
		scenario = scenarioSelectMenu.val();
		
	if(type === "landcover") {
		App.addLandcoverLayer(date, scenario);
	}
	
	if(type === "snowfall") {
		console.log("Gonna load a snowfall layer now!");
		App.addSnowfallLayer(date, scenario);
	}
	
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

my.init = function() {
	//updateLayerSelectMenu();
};

return my;

}($));
