(function(){
	"use strict";
	
	// Establish a global namespace
	var App = {};
	window.App = App;
	
	/**
	 * This stuff happens when the app starts.
	 */
	App.init = function () {
		App.addMap();
	};
	
	/**
	 * Adds the leaflet basemap to the page. 
	 */
	App.addMap = function() {
		
		// Create the leaflet map
		App.map = L.map("map").setView( [39,-98], 4);
		
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
		App.addDataLayerToMap("OregonWashington");
		
	};
	
	// TODO Uses d3 for the import, but this might not be the best way.
	/**
	 * Add a specified existing data layer to the map.
	 */
	App.addDataLayerToMap = function(layerToAdd) {
		
		// Object containing paths to available layers
		var jsonLayers = {
				states : "data/geometry/json/cb_2015_us_state_20m.json",
				OregonWashington : "data/geometry/json/OregonWashington.json"
			}
		
		// Don't add this layer if it's already on the map.
		if(App.mapLayers.hasOwnProperty(layerToAdd)) {
			console.log(layerToAdd + " layer is already on the map");
			return;
		}
		
		// If layerToAdd is an available layer, add it. Otherwise, Error
		if(jsonLayers.hasOwnProperty(layerToAdd)) {
			d3.json(jsonLayers[layerToAdd], function(error, importedJson){
			if (error) {return console.warn(error);}
				App.mapLayers[layerToAdd] = L.geoJson(importedJson).addTo(App.map);
				console.log(importedJson);
			});
		} else {
			throw new Error(layerToAdd + " is not an available layer.");
		}
	};
	
	// Remove the specified data layer from the map. 
	App.removeDataLayerFromMap = function(layerToRemove) {
		if(App.mapLayers.hasOwnProperty(layerToRemove)) {
			App.map.removeLayer(App.mapLayers[layerToRemove]);
			delete App.mapLayers[layerToRemove];
		} else {
			console.log(layerToRemove + " layer does not exist");
		}
	};
	
}());


$(document).ready(function() {
	"use strict";
	
	App.init();
});
