/*
 * Author: Daniel Stephen, daniel.macc.stephen@gmail.com
 * Date: Summer/Fall, 2016, Oregon State University
 * 
 * This is an interactive leaflet map of output from the Willammette Water 2100 
 * project. For more information visit http://water.oregonstate.edu/ww2100/
 * 
 * The following Javascript libaries/plugins/extensions are used in the 
 * creation of this map:
 * 
 *    D3.js
 *    TopoJSON.js
 *    jQuery
 *    jQueryUI
 *    Bootstrap
 *    leaflet.js (pre-1.0)
 *    geojson-vt-dev.js (https://github.com/mapbox/geojson-vt)
 *    L.CanvasTiles.js (origional author: Stanislav Sumbera, http://bl.ocks.org/sumbera/c67e5551b21c68dc8299)
 * 
 * The code is written using the Revealing Module Pattern described here:
 *    https://addyosmani.com/resources/essentialjsdesignpatterns/book/#revealingmodulepatternjavascript
 * 
 * "App" is the primary namespace for the application, and requires several 
 * modules/plugins, including:
 * 
 *    ColorUtils
 *    App.GUI
 *    App.buildTileLayer
 */
(function(){
	
"use strict";

// initialize local variables
var App = {}, // App is the namespace for this application.
	map,
	activeDataLayer,
	snowData = {},
	etData = {},
	colorPalates = {},
	legendLabels,
	legendTitles,
	basemapLayers,
	currentBasemap,
	mapLayers = {},
	referenceLayers = {},
	settings = {
		showReferenceLayers: true,
		showCities: true,
		showStreams: true,
		dataLayerOpacity: 0.8,
		useVectorTiles: true,
		currentDataSettings: ""
	};
	
// Assign global variable referencing this app in order to make it public.
window.App = App;

/*
 * Import CSV files containing SWE data and store it.
 */
function importSnowData() {
	var refPath =      "data/snowData/SWE_ref_decadalAvg_HUCs.csv",
		lowClimPath =  "data/snowData/SWE_lowClim_decadalAvg_HUCs.csv",
		highClimPath = "data/snowData/SWE_highClim_decadalAvg_HUCs.csv";
	
	d3.csv(refPath, function(d) {
		snowData.ref = d;
	});
	d3.csv(lowClimPath, function(d) {
		snowData.lowClim = d;
	});
	d3.csv(highClimPath, function(d) {
		snowData.highClim = d;
	});	
}

/*
 * Convert the imported et data into a Map object. Search for et values with
 * Map.get(HRU_ID). Better performance than 
 * looping over the data to find a matching HRU_ID (10 milliseconds vs 5 second). 
 */
function mapEtData(d) {
	var etMap = new Map(),
		i,
		key,
		value;
		
	for(i = 0; i < d.length; i += 1) {
		key = Number(d[i].hru);
		value = {
			"2010": d[i]["2010"],
			"2020": d[i]["2020"],
			"2030": d[i]["2030"],
			"2040": d[i]["2040"],
			"2050": d[i]["2050"],
			"2060": d[i]["2060"],
			"2070": d[i]["2070"],
			"2080": d[i]["2080"],
			"2090": d[i]["2090"]
		};
		etMap.set(key, value);
	}
	return etMap;
}


/*
 * Import CSV files containing evapotranspiration data and store it.
 * Convert the imported data to Map objects for improved performance.
 */
function importEtData() {
	var refPath = "data/etData/et_ref_decadalAvg.csv",
		lowClimPath = "data/etData/et_lowClim_decadalAvg.csv",
		fireSuppressPath = "data/etData/et_fireSuppress_decadalAvg.csv",
		highClimPath = "data/etData/et_highClim_decadalAvg.csv",
		managedPath = "data/etData/et_managed_decadalAvg.csv",
		econExtremePath = "data/etData/et_econExtreme_decadalAvg.csv";
	
	d3.csv(refPath, function(d) {
		etData.ref = mapEtData(d);
	});
	d3.csv(lowClimPath, function(d) {
		etData.lowClim = mapEtData(d);
	});
	d3.csv(fireSuppressPath, function(d) {
		etData.fireSuppress = mapEtData(d);
	});
	d3.csv(highClimPath, function(d) {
		etData.highClim = mapEtData(d);
	});
	d3.csv(managedPath, function(d) {
		etData.managed = mapEtData(d);
	});
	d3.csv(econExtremePath, function(d) {
		etData.econExtreme = mapEtData(d);
	});
}

/*
 * Generates color palates for the different data layers and legends. 
 * Change the settings in here to edit map and legend colors. 
 * NOTE: changing the number of classes for each data layer will cause 
 * an error unless the appropriate adjustments are made to legendLabels.
 * See legendLabels comments below. 
 */
function initColorsPalates(){
	
	// Colors for generating color ramps; low color, high color,
	// and the number of color classes.
	// ColorUtils.getColorRamp uses rgb arrays [r,g,b] and converts them
	// to strings "rgb(r,g,b)" for compatibility with leaflet.
	var snowLow = [242,240,247],
		snowHigh = [105, 70,156],
		snowClasses = 6,
		
		devLandValueLow = [246,210,234],
		devLandValueHigh = [89, 0,132],
		devLandvalueClasses = 5,
		
		agLandValueLow = [237,248,233],
		agLandValueHigh = [0,109,44],
		agLandvalueClasses = 6,
		
		etLow =  [254, 239,139],
		etHigh = [18, 35,114],
		etClasses = 6;
	
	// lulc is categorical, so each color is hard coded here rather 
	// than generated as a ramp.
	colorPalates.lulc = [[
				"rgb(158,154,200)", // Developed
				"rgb(252,241,185)", // Agriculture
				"rgb(207,180,99)" , // Unforested
				"rgb(92,144,2)", // subtropical mixed forest (ftm)
				"rgb(127,178,57)", // temperate warm mixed forest (fdw)
				"rgb(161,211,113)", // cool mixed forest (fvg)
				"rgb(29,166,133)", // maritime needleleaf forest (fwi)
				"rgb(90,189,173)", // temperate needleleaf
				"rgb(157,213,213)", // moist temperate needleleaf forest (fsi)
				"rgb(206,238,255)", // subalpine forest (fmh)
				"rgb(88,147,169)" // Open water
			]];
	// Set the color palette for the other data layers
	colorPalates.maxSWE = [ColorUtils.getColorRamp(
				snowLow, 
				snowHigh, 
				snowClasses, 
				"string"
			)];
	colorPalates.landValue = [
				ColorUtils.getColorRamp(
					devLandValueLow, 
					devLandValueHigh, 
					devLandvalueClasses, 
					"string"
				),
				ColorUtils.getColorRamp(
				agLandValueLow, 
				agLandValueHigh, 
			    agLandvalueClasses, 
				"string"
				)
			];
	colorPalates.et = [ColorUtils.getColorRamp(
				etLow,
				etHigh,
				etClasses,
				"string"
			)];
}

/*
 * Labels for the legend are hardcoded here. The number of labels has to 
 * match the number of color classes for each data layer 
 * generated in initColorPalettes. Using two dimensional arrays allows multiple
 * groups of labels, like with landValue.
 */
legendLabels = {
	lulc: [
		[
			"Urban/Developed",
			"Agriculture",
			"Unforested",
			"Subtropical Mixed Forest",
			"Temperate Warm Mixed Forest",
			"Cool Mixed Forest",
			"Maritime Needleleaf Forest",
			"Temperate Needleleaf",
			"Moist Temperate Needleleaf Forest",
			"Subalpine Forest",
			"Open Water"
		]
	],
	maxSWE: [
		[
			"0.0 to 0.5",
			"0.5 to 1.0",
			"1.0 to 5.0",
			"5.0 to 10.0",
			"10.0 to 50.0",
			"50.0 and above"
		]
	],
	landValue: [
		[
			"Less than 250,000",
			"250,001 - 500,000",
			"500,001 - 750,000",
			"750,001 - 1,000,000",
			"More than 1,000,000"
		],
		[
			"Less than 500",
			"501 to 1,000",
			"1,001 to 1,500",
			"1,501 to 2,000",
			"2,001 to 2,500",
			"More than 2,500"
		]
	],
	et: [
		[
			"Less than 400",
			"400 to 500",
			"500 to 600",
			"600 to 700",
			"700 to 800",
			"More than 800"
		]
	]
};

/*
 * A legend title for each of the data layers is hardcoded here.
 * Uses arrays to allow multiple titles in one legend, like with landValue
 */
legendTitles = {
	lulc: ["Landcover and Forest Type"],
	maxSWE: ["Average Yearly<br/>Maximum Snow Water<br/>Equivalent in mm"],
	landValue: ["Developed Land Value <br/>$ per Acre",
				"Agricultural Land Value <br/>$ per Acre"],
	et: ["Average Yearly<br/>Evapotranspiration<br/>in mm"]
};

/*
 * Changes the opacity of the main data layer.
 */
function setDataLayerOpacity(opacity) {
	if(opacity) {
		settings.dataLayerOpacity = opacity;
	}
	// The function name for changing opacity of the data layer depends on 
	// whether vector tiles are used. 
	if(settings.useVectorTiles){
		activeDataLayer.setOpacity(settings.dataLayerOpacity);
	} else {
		activeDataLayer.setStyle({fillOpacity: settings.dataLayerOpacity})
	}
}

/*
 * Creates the leaflet map and configures the available base layers.
 */
function addMap() {
	
	// Enable using topojson in leaflet. 
	L.TopoJSON = L.GeoJSON.extend({  
	  addData: function(jsonData) {    
	    if (jsonData.type === "Topology") {
	      for (key in jsonData.objects) {
	        var geojson = topojson.feature(jsonData, jsonData.objects[key]);
	        L.GeoJSON.prototype.addData.call(this, geojson);
	      }
	    }    
	    else {
	      L.GeoJSON.prototype.addData.call(this, jsonData);
	    }
	  }  
	});
	
	// Create the leaflet map
	map = L.map("map", {
		maxBounds: L.latLngBounds([55, -135], [35,-110]),
		minZoom: 7,
		maxZoom: 11
	}).setView([44.5, -122.7], 8);
	
	// A selection of basemaps to choose from using the very handy 
	// leaflet-oroviders.js
	basemapLayers = {
			Esri_WorldTerrain: L.tileLayer.provider('Esri.WorldTerrain'),
			ESRI_grayBasemap: L.tileLayer.provider('Esri.WorldGrayCanvas'),
			OpenStreetMap_Mapnik: L.tileLayer.provider('OpenStreetMap.Mapnik'),
			OpenStreetMap_HOT: L.tileLayer.provider('OpenStreetMap.HOT'),
			Esri_WorldImagery: L.tileLayer.provider('Esri.WorldImagery'),
			Esri_NatGeoWorldMap: L.tileLayer.provider('Esri.NatGeoWorldMap'),
			Stamen_Toner: L.tileLayer.provider('Stamen.Toner'),
			Stamen_TonerLite: L.tileLayer.provider('Stamen.TonerLite'),
			Stamen_TerrainBackground: L.tileLayer.provider('Stamen.TerrainBackground')
		};
	
	// Add a basemap 
	basemapLayers.Esri_WorldTerrain.addTo(map);		
	currentBasemap = basemapLayers.Esri_WorldTerrain;

}

/*
 * Changes the baselayer of the leaflet map. Called when GUI settings
 * are changed.
 */
function setBaseLayer(layerName) {
	var newLayer = basemapLayers[layerName];
	map.removeLayer(currentBasemap);
	newLayer.addTo(map);
	currentBasemap = newLayer;
}

/*
 * Create a path to the correct json file based on current settings.
 */
function getPathToGeometry() {
	var basePath = "data/geometry/dataLayers/",
		dataPath,
		type = settings.currentDataSettings.type,
		scenario = settings.currentDataSettings.scenario,
		date = settings.currentDataSettings.date,
		decade;
	
	if(settings.currentDataSettings.type === "maxSWE") {
		return "data/geometry/dataLayers/snow/wHuc12_simp.json";
	}
	if(settings.currentDataSettings.type === "et") {
		return "data/geometry/dataLayers/et/hru_proj2.json";
	}

	if(date === "early") {
		decade = "2010";
	} else if (date === "mid") {
		decade = "2050";
	} else {
		decade = "2100";
	}

	dataPath = type + "/" + type + "_" + scenario + decade + ".json";
	return basePath + dataPath;
}

/*
 * Imports ww2100 data layer as json, creates a leaflet layer from the 
 * json, styles the layer according to data type, then adds it to the
 * leaflet map and configures the legend. 
 * Ensures only one ww2100 data layer is loaded at a time, and overlays
 * the reference layers on top. Called when GUI settings are changed.
 * dataSettings: {type, date, scenario}
 */
function addWW2100DataLayer(dataSettings) {
	
	// Show the loading message.
	$("#loading").removeClass("hidden");
			
	// Names the leaflet layer the combination of the settings. This 
	// reference is needed to remove the layer later. 
	var layerToAdd = dataSettings.type + dataSettings.date + dataSettings.scenario,
		layer,
		pathToGeometry,
		key;
	
	// If the layer is already loaded, do nothing.
	for(layer in mapLayers) {
		if(mapLayers.hasOwnProperty(layer)) {
			if(layer === layerToAdd) {
				return;
			}
		}
	}
	
	// save the settings globally
	settings.currentDataSettings = dataSettings;
	
	// Import the json data layer saved at pathToGeometry
	d3.json(getPathToGeometry(), function(error, importedJson) {
		if(error) {
			alert("There is currently no data for this setting. Soon to come!"); 
			$("#loading").addClass("hidden");
			clearMapLayers();
			addReferenceLayers();
			throw new Error("Problem reading csv");
		}
		
		// If the json is topojson, convert it to geojson
		if(importedJson.type === "Topology") {
			for(key in importedJson.objects) {
				importedJson = topojson.feature(importedJson, importedJson.objects[key]);
			}
		}
		
		// Create the polygons. If the data is not maxSWE, use vector tiles.
		// Otherwise, use normal leaflet polygon rendering.
		if(dataSettings.type === "maxSWE") {
			settings.useVectorTiles = false;
			activeDataLayer = L.geoJson(importedJson, {
				style: styleWW2100Layer,
				// raise smoothFactor up to 1 to increase performance, while adding 
				// weird gaps between polygons. 
				smoothFactor: 0,
				// This adds event listeners to each feature
				onEachFeature: onEachSWEFeature
			});
		} else {
			settings.useVectorTiles = true;
			// Assign a color property to each feature.
			colorizeFeatures(importedJson);

			// Add the json as a vector tile layer. Much better performance
			// than a regular json layer. 
			activeDataLayer = App.buildTileLayer(importedJson); // TODO

			// Gotta make the z-index a little higher so baselayer tiles
			// don't get placed on top of it.
			activeDataLayer.setZIndex(2);

			// Set the opacity of the data layer to the current opacity setting
			setDataLayerOpacity();
		}

		// Clear the map just before adding new features. 
		clearMapLayers();
		
		// layerToAdd is just a string that happens to be a key in mapLayers
		mapLayers[layerToAdd] = activeDataLayer.addTo(map);
		// Add the reference layers on TOP of the data layer.
		addReferenceLayers();
		// Hide the loading message.
		$("#loading").addClass("hidden");
	});	
	// no need to wait for the data to load before making the lengend.
	// That's why this is outside of the above import function, which 
	// runs asynchronously.  
	configureLegend();
}

/*
 * Styles individual feature polygons based on the data type. More specifically,
 * returns styling instructions in a format that Leaflet can use. Currently, 
 * this is only used when viewing maxSWE data. All other data layers use vector 
 * tiles, which are styled using colorizeFeatures(). 
 */
function styleWW2100Layer(feature){
	var fillColor;		
	
	switch(settings.currentDataSettings.type){
		case "lulc": fillColor = getlulcColor(feature);
			break;
		case "maxSWE": fillColor = getSnowWaterEquivalentColor(feature);
			break;
		case "devLandVal": fillColor = getDevelopedLandValueColors(feature);
			break;
		case "agLandVal": fillColor = getAgriculturalLandValueColors(feature);
			break;
	}

	return {
		fillColor: fillColor,
		stroke: false,
		fillOpacity: settings.dataLayerOpacity
	};
}

/*
 * Adds a color property to each feature based on other property values.
 * This is used to style vector tiles, and its a bit different from
 * the function styleWW2100Layer, which is used to style untiled polygons.
 */
function colorizeFeatures(data) {

    var i, colorizerFunction;
    
    switch(settings.currentDataSettings.type){
		case "lulc": colorizerFunction = getlulcColor;
			break;
		case "maxSWE": colorizerFunction = getSnowWaterEquivalentColor;
			break;
		case "landValue": colorizerFunction = getLandValueColors;
			break;
		case "et" : colorizerFunction = getEtColors;
			break;
	}
	
    for (i = 0; i < data.features.length; i+=1) {
        data.features[i].properties.color = colorizerFunction(data.features[i]);
    }
}

/**
 * Returns an rgb color based on the lcCombined parameter of the input feature
 */
function getlulcColor(feature) {
	var colors = colorPalates.lulc[0];
	switch (feature.properties.lcCombined) {
		// LULC_B values
		case 11: //High-Intensity Developed
		    return colors[0];
		case 12: //Medium-Intensity Developed
		    return colors[0];
		case 13: //Low-Intensity Developed
		    return colors[0];
		case 14: //Developed Open Space
		    return colors[0];
		case 15: //Undifferentiated Developed
		    return colors[0];
		case 20: //Agriculture
		    return colors[1];
		case 30: //Grassland or Shrub Scrub
		    return colors[2];
		case 51: //Barren
		    return colors[2];
		case 61: //Wetlands
		    return colors[2];
		case 71: //Open Water
		    return colors[10];
		case 72: //Snow and Ice
		    return colors[2];
		    
		// PVT values
		case 1: // temperate warm mixed forest (fdw)
			return colors[4];
		case 5: //cool mixed
		    return colors[5];	
		case 2:  //subalpine
		    return colors[9];
		case 3: //moist temp needle
		    return colors[8];
		case 4: // C3 shrubland (fto)
			return colors[4];
		case 6: //maritime needle
		    return colors[6];
		case 7: // temperate needleleaf woodland (fuc)
			return colors[7];
		case 8: // subtropical mixed forest
			return colors[3];
		case 9: //temperate needleleaf forest
		    return colors[7];
    }
    console.log("unknown case: " + feature.properties.lcCombined);
    return "rgb(100,100,100)";
}

/*
 * returns an rgb color based on the SWE value of the input feature.
 */
function getSnowWaterEquivalentColor(feature) {
	var hucID = feature.properties.HUC12,
		colors = colorPalates.maxSWE[0],
		maxSWE,
		date = settings.currentDataSettings.date,
		scenario = settings.currentDataSettings.scenario,
		decade,
		i;
		
	if(date === "early"){
		decade = "2010";
	} else if (date === "mid"){
		decade = "2050";
	} else {
		decade = "2090";
	}
	
	for(i = 0; i < snowData[scenario].length; i += 1) {
		if(hucID === snowData[scenario][i].huc) {
			// Go ahead and bind the SWE data for all decades to the feature.
			feature.properties.SWEdata = snowData[scenario][i];
			maxSWE = snowData[scenario][i][decade]/100000;
			break;
		}
	}
	
	if(isNaN(maxSWE)) {
		console.log("maxSWE is NaN!");
		return "rgb(100,100,100)";
	}

	if(maxSWE <= 0.5) {
		return colors[0];
	}
	if(maxSWE <= 1.0) {
		return colors[1];
	}
	if(maxSWE <= 5.0) {
		return colors[2];
	}
	if(maxSWE <= 10.0) {
		return colors[3];
	}
	if(maxSWE <= 50.0) {
		return colors[4];
	}
	if(maxSWE > 50.0) {
		return colors[5];
	}
}

/*
 * Returns an rgb color based on the land value of the input feature.
 */
function getLandValueColors(feature) {
	// If MEAN_DEV_V is > 0
	var agVal = feature.properties.MEAN_AG_VA,
		devVal = feature.properties.MEAN_DEV_V,
		colors;
		
	if(devVal > 0) {
		// Color it by dev val, ja?
		colors = colorPalates.landValue[0];
		
		if(isNaN(devVal)) {
			console.log("Developed Land Value is NaN!");
			return "rgb(100,100,100)"
		}
		if(devVal < 250000) {
			return colors[0];
		}
		if(devVal <= 500000) {
			return colors[1];
		}
		if(devVal <= 750000) {
			return colors[2];
		}
		if(devVal <= 1000000) {
			return colors[3];
		}
		if(devVal > 1000000) {
			return colors[4];
		}
	} else {
		colors = colorPalates.landValue[1];
		if(isNaN(agVal)) {
			console.log("Developed Land Value is NaN!");
			return "rgb(100,100,100)"
		}
		
		if(agVal < 500) {
			return colors[0];
		}
		if(agVal <= 1000) {
			return colors[1];
		}
		if(agVal <= 1500) {
			return colors[2];
		}
		if(agVal <= 2000) {
			return colors[3];
		}
		if(agVal <= 2500) {
			return colors[4];
		}
		if(agVal > 2500) {
			return colors[5];
		}			
	}
}

/*
 * Returns an rgb based on the et value of the provided feature
 */
function getEtColors(feature) {
	var HRU_ID = feature.properties.HRU_ID,
		colors = colorPalates.et[0],
		et,
		date = settings.currentDataSettings.date,
		scenario = settings.currentDataSettings.scenario,
		decade,
		i;
		
	if(date === "early"){
		decade = "2010";
	} else if (date === "mid"){
		decade = "2050";
	} else {
		decade = "2090";
	}
	
	et = etData[scenario].get(HRU_ID)[decade];
	
	if(isNaN(et)) {
		console.log("et is NaN!");
		return "rgb(100,100,100)";
	}
	if(et <= 400) {
		return colors[0];
	}
	if(et <= 500) {
		return colors[1];
	}
	if(et <= 600) {
		return colors[2];
	}
	if(et <= 700) {
		return colors[3];
	}
	if(et <= 800) {
		return colors[4];
	}
	if(et > 800) {
		return colors[5];
	}
	console.log("color problems!")
}

/*
 * Creates a small black point symbol and text label for the cities reference
 * layer.
 */
function createLabelIcon(labelClass,labelText){
	
	var html,
		svgCircle,
		svgText;
		
	svgText = "<text x='13' y='12' font-size='12'>" + 
			  labelText + "</text>";
	
	svgCircle = "<circle cx='5' cy='15' fill='black' r='3'>";
	
	html = "<div><svg width='100' height='20'>"  + svgText  + svgCircle + "</svg></div>";
	
	return L.divIcon({ 
				iconAnchor: [6, 16], 
				className: labelClass,
				html: html
			});
}

/*
 * Create a cities reference layer based on the provided geojson.
 */
function makeCitiesReferenceLayer(citiesJSON){
	var cityMarkerOptions = {
	    radius: 4,
	    // fillColor: "red",
	    // color: "red",
	    weight: 1,
	    opacity: 1,
	    fillOpacity: 1
	},
		labels = [], 
		citiesLayer = L.geoJson(citiesJSON, {
			pointToLayer: function(feature, latlng) {
			return L.circleMarker(latlng, cityMarkerOptions);
		},
		onEachFeature: function(feature, layer) {
			var lat = feature.properties.latitude,
				lng = feature.properties.longitude,
				name = feature.properties.name;

			labels.push( L.marker([lat,lng], {icon:createLabelIcon("textLabelclass", name)}));
		}
	});
	return L.layerGroup(labels);
}

/*
 * Creates a streams reference layer based on the provided geojson
 */
function makeStreamsReferenceLayer(streamsJSON) {
	var streamsStyle = {
	    "color": "rgb(88,147,169)",
	    "weight": 2,
	    "opacity": 1
	};
	var streamsLayer = L.geoJson(streamsJSON, {
		style: streamsStyle
	});
	return streamsLayer;
}

/*
 * Creates an open water reference layer based on the provided geojson
 */
function makeOpenWaterReferenceLayer(openWaterJSON) {
	var openWaterStyle = {
	    "color": "rgb(88,147,169)",
	    "weight": 0,
	    "fillOpacity": 1.0
	};
	var openWaterLayer = L.geoJson(openWaterJSON, {
		style: openWaterStyle
	});
	return openWaterLayer;
}

/*
 * Removes the reference layers from the map.
 */
function clearReferenceLayers() {
	var layer;
	for(layer in referenceLayers) {
		if(referenceLayers.hasOwnProperty(layer)) {
			map.removeLayer(referenceLayers[layer]);
		}
	}
}

/*
 * Adds the reference layers to the map.
 * Which layers are added depends on the current settings.
 */
function addReferenceLayers() {
	clearReferenceLayers();
	if(settings.showStreams) {
		referenceLayers.streams.addTo(map);
		referenceLayers.openWater.addTo(map);
	}
	if(settings.showCities) {
		referenceLayers.cities.addTo(map);
	}
}

/*
 * Imports the reference layer json. The callback function is called by
 * d3_queue.queue, and the data is available in the callback. 
 */
function importReferenceLayers(callback) {
	var dataPaths = {
		cities: "data/geometry/referenceLayers/cities.json",
		streams: "data/geometry/referenceLayers/streams1.json",
		openWater: "data/geometry/referenceLayers/openWater.json"
	};
	
	d3_queue.queue(1)
		.defer(d3.json, dataPaths.cities)
		.defer(d3.json, dataPaths.streams)
		.defer(d3.json, dataPaths.openWater)
		.awaitAll(callback);
}

/*
 * Removes all json layers from the leaflet map.
 */
function clearMapLayers() {
	// Loop through the mapLayers, removing each one from the map.
	var layer;
	for(layer in mapLayers) {
		if(mapLayers.hasOwnProperty(layer)) {
			map.removeLayer(mapLayers[layer]);
		}
	}
	mapLayers = {};
}

/*
 * Sets up and displays the legend. The contents of the legend depends on the 
 * current settings.
 */
function configureLegend() {
	var legendContainer = d3.select("#legendContainer"),
		legendItemContainer,
		legendSection,
		legendSectionTitle,
		legendItem,
		labelSizePx = 12,
		rectWidth = 20,
		rectHeight = 13,
		rectSpacer = 4,
		maxLabelWidth = 0,
		labelSpacer = 10,
		
		dataType = settings.currentDataSettings.type,
		titles = legendTitles[dataType],
		colors = colorPalates[dataType],
		labels = legendLabels[dataType],
		k;
	
	// Remove old legend material.
	d3.selectAll("#legendContainer svg").remove();
	d3.selectAll("#legendContainer p").remove();
	
	for(k = 0; k < titles.length; k += 1) {
		// Add a legend section title
		legendSectionTitle = legendContainer.append("p")
			.classed("legendHeader", true)
			.html(titles[k]);
		
		// Add an svg element to hold legend items
		legendSection = legendContainer.append("svg")
			.classed(".legendSection", true)
			.attr("height", function() {
				var l = colors[k].length;
				return (l * rectHeight + (l - 1) * rectSpacer) + 2;
			});
		
		// Add an svg group for each legend item in this section.	
		legendItem = legendSection.selectAll("g")
			.data(colors[k])
			.enter().append("g");
			
		// Add rectangular color swatches for each legend item. 
		legendItem.append("rect")
			.attr("width", rectWidth)
			.attr("height", rectHeight)
			.attr("fill", "white")
			.attr("stroke", "rgb(200,200,200)")
			.attr("stroke-width", 0.25)
			.attr("y", function(d, i) {
				return (rectHeight + rectSpacer) * i;
			})
			.attr("x", 2)
			.attr("fill", function(d, i) {
				return d;
			});
		
		// Add text labels to the color swatches
		legendItem.append("text")
			.style("font-size", labelSizePx + "px")
			.style("font-family", "Tahoma, Geneva, sans-serif")
			.text(function(d, i) {
				return labels[k][i];
			})
			.attr("x", rectWidth + labelSpacer)
			.attr("y", function(d, i) {
				return (rectHeight/2 + (labelSizePx/2 - 1))+ ((rectHeight + rectSpacer) * i);
			})
			.each(function(d) {
				maxLabelWidth = this.getBBox().width > maxLabelWidth ? this.getBBox().width : maxLabelWidth;
			});
		
		// Adjust the width of the legend svg feature
		legendSection.attr("width", function() {
				return maxLabelWidth + rectWidth + labelSpacer;
			});
	}
}

/*
 * Highlight the provided map feature. e is an event object, which contains
 * a reference (target) to a map feature.
 */
function highlightFeature(e) {
    var layer = e.target,
    	i;

    layer.setStyle({
		stroke: true,
		weight: 2,
        color: '#666'
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
}

/*
 * remove highlight from map feature. e is an event object, which contains 
 * a reference (target) to a map feature.
 */
function resetHighlight(e) {
    activeDataLayer.resetStyle(e.target);
}

/*
 * Mousing over a SWE feature highlights it and creates a SWE chart.
 */
function mouseoverSWEFeature(e) {
	highlightFeature(e);
	App.GUI.makeSWEChart(e.target.feature);
	// TODO The reference layer is redrawn to keep it on top of the 
	// SWE layer, which isn't great. It would be better if it was always
	// on top, in a separate layer. Leaflet 0.x can't do this, I think.
	addReferenceLayers();
}
 
/*
 * Mousing out of a SWE feature removes the highlight and removes the SWE chart.
 */
function mouseoutSWEFeature(e) {
	resetHighlight(e);
	// remove SWEchart
	d3.select("#SWEchart").remove();
}

/*
 * Add event listeners to map features. Currently, this is only called when 
 * the maxSWE datalayer is selected. 
 */
function onEachSWEFeature(feature, layer) {
	if(settings.currentDataSettings.type==="maxSWE") {
		layer.on({
	        mouseover: mouseoverSWEFeature,
	        mouseout: mouseoutSWEFeature
	    });
	}
}

/*
 * Cache reference vector layers
 */
function initReferenceLayers(callback) {
	// Import reference layer json, make layers out of them, store them.
	importReferenceLayers(function(error, data) {
		if (error) {throw error;}
		
		var citiesJSON = data[0],
			streamsJSON = data[1],
			openWaterJSON = data[2];
		referenceLayers.cities = makeCitiesReferenceLayer(citiesJSON);
		referenceLayers.streams = makeStreamsReferenceLayer(streamsJSON);
		referenceLayers.openWater = makeOpenWaterReferenceLayer(openWaterJSON);
		callback();
	});
}

/**
 * Initialize the application. 
 */
function init() {
	addMap();
	initColorsPalates();
	importSnowData();
	importEtData();
	App.GUI.init();
	initReferenceLayers(function(){
		App.GUI.loadDataByGUI();
	});
}

/*
 * Expose some functions and variables.
 */
App.setDataLayerOpacity = setDataLayerOpacity;
App.setBaseLayer = setBaseLayer;
App.addWW2100DataLayer = addWW2100DataLayer;
App.addReferenceLayers = addReferenceLayers;
App.init = init;
App.settings = settings;

}()); // END App------------------------------------------------

/*
 * Launch the app
 */
$(document).ready(function() {
	"use strict";
	App.init();
});
