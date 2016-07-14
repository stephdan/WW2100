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
	var type = dataTypeSelectMenu.val(),
		date = timePeriodSelectMenu.val(), // TODO this will probably not be a dropdown later
		scenario = scenarioSelectMenu.val();
		
	if(type === "landcover") {
		console.log("selected landcover!");
		App.addLandcoverLayer(date, scenario);
	}
	
	if(type === "snowfall") {
		console.log("selected snowfall!");
		App.addSnowfallLayer(date, scenario);
	}
	
	if(type === "devLandVal") {
		console.log("selected developed land value!");
		App.addDevelopedLandValueLayer(date, scenario);
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

$("#info").mouseenter(function() {
	$(this).css("background-color", "rgb(235,235,235)");
	//$(this).attr("data-target", "#trashModal");
}).mouseleave(function() {
	$(this).css("background-color", "");
	//$(this).find("circle, rect, text").attr("fill", "#3182bd");
});

my.init = function() {
	//updateLayerSelectMenu();
};

return my;

}($));
