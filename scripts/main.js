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
	
	
	var landcoverColors = [
		// new order
		"rgb(125, 95, 149)", // Urban
		"rgb(252, 241, 185)", // Unforested
		"rgb(92,144,2)", // subtropical mixed forest (ftm)
		"rgb(127,178,57)", // temperate warm mixed forest (fdw)
		"rgb(161, 211, 113)", // cool mixed forest (fvg)
		"rgb(29, 166, 133)", // maritime needleleaf forest (fwi)
		"rgb(90, 189,173)", // temperate needleleaf
		"rgb(157, 213,213)", // moist temperate needleleaf forest (fsi)
		"rgb(206,238,255)" // subalpine forest (fmh)
	];
	
	var landcoverLabels = [
		"Urban",
		"Unforested",
		"Subtropical Mixed Forest",
		"Temperate Warm Mixed Forest",
		"Cool Mixed Forest",
		"Maritime Needleleaf Forest",
		"Temperate Needleleaf",
		"Moist Temperate Needleleaf Forest",
		"Subalpine Forest"
	];
	
	// This will have to respond in different ways depending on the data.
	function styleLandcover(styledMap) {

		// TODO Create if statements that check to see if the layer has 
		// specific properties. So if it has LULC_A, do the thing for that, 
		// if it has some other thing, do the thing for that.
	    styledMap.setStyle(function (feature) {
	        switch (feature.properties.lcCombined) {
	        	case 50: //urban
	                return {color: landcoverColors[0]};
	            case -99: //unforested
	                return {color: landcoverColors[1]};
	            case 8: // subtropical mixed forest
	           		return {color: landcoverColors[2]};
	            case 1: // temperate warm mixed forest (fdw)
	            	return {color: landcoverColors[3]};
	            case 5: //cool mixed
	                return {color: landcoverColors[4]};	
	            case 2:  //subalpine
	                return {color: landcoverColors[8]};
	            case 3: //moist temp needle
	                return {color: landcoverColors[7]};
	            case 4: // C3 shrubland (fto)
	            	return {color: landcoverColors[1]};
	            case 6: //maritime needle
	                return {color: landcoverColors[5]};
	            case 7: // temperate needleleaf woodland (fuc)
	            	return {color: landcoverColors[6]};
	            case 9: //temperate needleleaf forest
	                return {color: landcoverColors[6]};
	        }
	        console.log("unknown case: " + feature.properties.lcCombined);
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
		LULC2100_ref: "data/geometry/json/lulc/Ref2100_LULC.json"
	};
	
	App.configureLegend = function(legendData) {
		var legendItemContainer,
			legendItem,
			labelSizePx = 12,
			rectWidth = 20,
			rectHeight = 12,
			rectSpacer = 4,
			maxLabelWidth = 0,
			labelSpacer = 10;
		
		// Creates the svg to stick legend items in, sets the width and height
		legendItemContainer = d3.select("#legendItemContainer")
			.append("svg")
			.attr("height", function() {
				var l = legendData.colors.length;
				return (l * rectHeight + (l - 1) * rectSpacer) + 2;
			})
			.attr("width", function() {
				//return "100%"
			});
			
		legendItem = legendItemContainer.selectAll("g")
			.data(legendData.colors)
			.enter().append("g");
			
		legendItem.append("rect")
			.attr("width", rectWidth)
			.attr("height", rectHeight)
			.attr("fill", "white")
			.attr("y", function(d, i) {
				return (rectHeight + rectSpacer) * i;
			})
			.attr("x", 2)
			.attr("fill", function(d, i) {
				return d;
			});
		
		legendItem.append("text")
			.style("font-size", labelSizePx + "px")
			.style("font-family", "Tahoma, Geneva, sans-serif")
			.text(function(d, i) {
				return legendData.labels[i];
			})
			.attr("x", rectWidth + labelSpacer)
			.attr("y", function(d, i) {
				return (rectHeight/2 + (labelSizePx/2 - 1))+ ((rectHeight + rectSpacer) * i);
			})
			.each(function(d) {
				maxLabelWidth = this.getBBox().width > maxLabelWidth ? this.getBBox().width : maxLabelWidth;
			});
		
		legendItemContainer.attr("width", function() {
				return maxLabelWidth + rectWidth + labelSpacer;
			});
		
		$("#legendContainer label").html(legendData.title);
	};
	
	/**
	 * This stuff happens when the app starts.
	 */
	App.init = function () {
		App.addMap();
		App.GUI.init();
		App.configureLegend({title: "Landcover and Forest Type", colors: landcoverColors, labels: landcoverLabels});
	};
	
}());

// Launch the app
$(document).ready(function() {
	"use strict";
	App.init();
});
