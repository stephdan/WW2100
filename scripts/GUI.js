// NOTES -----------------------------------------------
// how to remove single selectmenu option:
//$("#layerSelect option[value='Pecan']").remove();
// end NOTES -------------------------------------------

App.GUI = (function(){

"use strict";
var layerSelectMenu,
	my = {};

// Create layer select dropdown.
layerSelectMenu = $("#layerSelect").selectmenu().on( "selectmenuselect", function( event, ui ) {
	App.addDataLayerToMap(ui.item.value);
});

// Populates the layerSelectMenu with options based on available data layers.
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
	updateLayerSelectMenu();
};

return my;

}());
