(function(){
	"use strict";
	
	// Establish a global namespace
	var App = {};
	window.App = App;
	
	
	
	/**
	 * Adds the leaflet basemap to the page. 
	 */
	App.addMap = function() {
		
		// Create the leaflet map
		App.map = L.map("map").setView([44.5, -122.7], 8);
		
		// A selection of basemaps to choose from using the very handy 
		// leaflet-oroviders.js
		// TODO These options are not needed UNLESS users will have the ability
		// to change the basemap.
		var basemapLayers = {
				ESRI_grayBasemap: L.tileLayer.provider('Esri.WorldGrayCanvas'),
				OpenStreetMap_Mapnik: L.tileLayer.provider('OpenStreetMap.Mapnik'),
				OpenStreetMap_HOT: L.tileLayer.provider('OpenStreetMap.HOT'),
				Esri_WorldImagery: L.tileLayer.provider('Esri.WorldImagery'),
				Esri_WorldTerrain: L.tileLayer.provider('Esri.WorldTerrain'),
				Esri_NatGeoWorldMap: L.tileLayer.provider('Esri.NatGeoWorldMap'),
				Stamen_TonerLite: L.tileLayer.provider('Stamen.TonerLite'),
				Stamen_TerrainBackground: L.tileLayer.provider('Stamen.TerrainBackground')
			};
		
		// Add a basemap 
		basemapLayers.Esri_WorldTerrain.addTo(App.map);		
		
		// Make a place to store data layers
		App.mapLayers = {};
		
		// Add a data layer to the map 
		App.addDataLayerToMap("LULC2010_ref");
		
	};
	
	// TODO Uses d3 for the import, but this might not be the best way.
	/**
	 * Add a specified existing data layer to the map.
	 */
	App.addDataLayerToMap = function(layerToAdd) {
		
		// Don't add this layer if it's already on the map.
		if(App.mapLayers.hasOwnProperty(layerToAdd)) {
			console.log(layerToAdd + " layer is already on the map");
			return;
		}
		
		// If layerToAdd is an available layer, add it. Otherwise, Error
		if(App.dataLayers.hasOwnProperty(layerToAdd)) {
			
			// Use d3 to fetch the json. Could also use something else.
			d3.json(App.dataLayers[layerToAdd], function(error, importedJson){
				if (error) {
					return console.warn(error);
				}
				
				// Turn the geoJson into a leaflet layer
				var jsonLayer = L.geoJson(importedJson, {
					// A low smooth factor prevents gaps between simplified
					// polygons, but decreases performance.
					// raise up to 1 to increase performance, while adding 
					// weird gaps between polygons. 
					smoothFactor: 0 
				});
				
				// Remove the stroke, add some transparency
				jsonLayer.setStyle({stroke: false, fillOpacity:0.8});
				
				// TODO this will have to function differently depending
				// on what the layer is. 
				styleLandcover(jsonLayer);
				
				// Removes current map layer. Done here so the change
				// happens fast. TODO There might be a reason to have more
				// than one layer added sometime. 
				App.clearMapLayers();
				App.mapLayers[layerToAdd] = jsonLayer.addTo(App.map);
				console.log(importedJson);
			});
		} else {
			throw new Error(layerToAdd + " is not an available layer.");
		}
	};
	
	// This will have to respond in different ways depending on the data.
	function styleLandcover(styledMap) {

		// TODO Create if statements that check to see if the layer has 
		// specific properties. So if it has LULC_A, do the thing for that, 
		// if it has some other thing, do the thing for that.

	    styledMap.setStyle(function (feature) {
	        switch (feature.properties.LULC_A) {
	            case 1: // developed
	                return {color: "rgb(229, 86, 78)"};
	            case 2: // agriculture
	                return {color: "rgb(231, 200, 75)"};
	            case 3:  // other vegetation
	                return {color: "rgb(133, 199, 126)"};
	            case 4: // forest
	                return {color: "rgb(56, 129, 78)"};
	            case 5: // water
	                return {color: "rgb(100, 179, 213)"};
	            case 6: // wetlands
	                return {color: "rgb(200, 230, 248)"};
	            case 7: // barren
	                return {color: "rgb(150, 150, 150)"};
	            case 8:  // other vegetation
	                return {color: "rgb(133, 199, 126)"};
                case 9: // snow/ice
	                return {color: "rgb(255, 0, 0)"};
	        }
	    });
	}
	
	// Remove the specified data layer from the map. 
	App.removeDataLayerFromMap = function(layerToRemove) {
		if(App.mapLayers.hasOwnProperty(layerToRemove)) {
			App.map.removeLayer(App.mapLayers[layerToRemove]);
			delete App.mapLayers[layerToRemove];
		} else {
			console.log(layerToRemove + " layer does not exist");
		}
	};
	
	App.clearMapLayers = function() {
		// Loop through the App.mapLayers, removing each one from the map.
		var layer;
		for(layer in App.mapLayers) {
			if(App.mapLayers.hasOwnProperty(layer)) {
				App.map.removeLayer(App.mapLayers[layer]);
			}
		}
		App.mapLayers = {};
	};
	
	App.dataLayers = {
		//OregonWashington : "data/geometry/json/OregonWashington.json",
		//states : "data/geometry/json/cb_2015_us_state_20m.json",
		
		//testData: "data/geometry/json/testData/Ref2010.json",
		LULC2010_ref: "data/geometry/json/lulc/Ref2010_LULC.json",
		LULC2050_ref: "data/geometry/json/lulc/Ref2050_LULC.json",
		LULC2100_ref: "data/geometry/json/lulc/Ref2100_LULC.json",
		urban_ref_2100 : "data/geometry/json/urbanAreas/Ref_2100_urban_dissolved_NAD83.geojson"
	};
	
	/**
	 * This stuff happens when the app starts.
	 */
	App.init = function () {
		App.addMap();
		App.GUI.init();
	};
	
}());

// Launch the app
$(document).ready(function() {
	"use strict";
	App.init();
});
