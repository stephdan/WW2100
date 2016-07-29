(function(){
	"use strict";
	
	// Establish a global namespace
	var App = {},
		activeDataLayer,
		cachedJsonLayers = {};
	
	// Assign global variable
	window.App = App;
	
	// Various app settings shared throughout the code. They get altered by 
	// GUI interactions mostly. 
	App.settings = {
		showReferenceLayers: true,
		showCities: true,
		showStreams: true,
		dataLayerOpacity: 0.8,
		currentDataSettings: ""
	};
		
	// TODO these snowData things should be stored elsewhere, but not sure where
	// just yet. It will depend on how snow gets structured. 
	var snowDataPath ="data/snowData/fakeData_midref.csv";
	var snowData;
	d3.csv(snowDataPath, function(d) {
		snowData = d.map(function(v) {
			return v.value;
		});
	});
	
	
	// Generates color palates for the different data layers and legends. 
	// Change the settings in here to edit map and legend colors. 
	// NOTE: changing the number of classes for each data layer will cause 
	// an error unless the appropriate adjustments are made to legendLabels.
	// See legendLabels comments below. 
	App.initColorsPalates = function(){
		
		App.colorPalates = {};
		
		// Colors for generating color ramps; low color, high color,
		// and the number of color classes.
		// ColorUtils.getColorRamp uses rgb arrays [r,g,b] and converts them
		// to strings "rgb(r,g,b)" for compatibility with leaflet.
		var snowLow = [255,255,255],
			snowHigh = [105, 70,156],
			snowClasses = 7,
			
			devLandValueLow = [237,248,233],
			devLandValueHigh = [0,109,44],
			devLandvalueClasses = 5,
			
			agLandValueLow = [237,248,233],
			agLandValueHigh = [0,109,44],
			agLandvalueClasses = 6,
			
			aridityLow =  [255,255,212],
			aridityHigh = [140,45,4],
			aridityClasses = 7;
		
		// Landcover is categorical, so each color is hard coded here rather 
		// than generated as a ramp.
		App.colorPalates.landcover = [
					"rgb(188,189,220)", // Urban1
					"rgb(158,154,200)", // Urban2
					"rgb(117,107,177)", // Urban3
					"rgb(84,39,143)", // Urban4
					"rgb(252, 241, 185)", // Unforested
					"rgb(92,144,2)", // subtropical mixed forest (ftm)
					"rgb(127,178,57)", // temperate warm mixed forest (fdw)
					"rgb(161, 211, 113)", // cool mixed forest (fvg)
					"rgb(29, 166, 133)", // maritime needleleaf forest (fwi)
					"rgb(90, 189,173)", // temperate needleleaf
					"rgb(157, 213,213)", // moist temperate needleleaf forest (fsi)
					"rgb(206,238,255)" // subalpine forest (fmh)
				];
		// Set the color palette for snow
		App.colorPalates.snowfall = ColorUtils.getColorRamp(
					snowLow, 
					snowHigh, 
					snowClasses, 
					"string"
				);
		// Set the color palette for developed land value
		App.colorPalates.devLandVal = ColorUtils.getColorRamp(
					devLandValueLow, 
					devLandValueHigh, 
					devLandvalueClasses, 
					"string"
				);
		// Set the color palette for agricultural land value
		App.colorPalates.agLandVal = ColorUtils.getColorRamp(
					agLandValueLow, 
					agLandValueHigh, 
				    agLandvalueClasses, 
					"string"
				); 
		App.colorPalates.aridity = ColorUtils.getColorRamp(
					aridityLow,
					aridityHigh,
					aridityClasses,
					"string"
				);
	};
	
	// Labels for the legend are hardcoded here. The number of labels has to 
	// match the number of color classes for each data layer 
	// generated in initColorPalettes.
	App.legendLabels = {
		landcover: [
			"Urban: Pop.Density < 1,500 per sqkm",
			"Urban: Pop.Density > 1,500 per sqkm",
			"Urban: Pop.Density > 3,000 per sqkm",
			"Urban: Pop.Density > 4,500 per sqkm",
			"Unforested",
			"Subtropical Mixed Forest",
			"Temperate Warm Mixed Forest",
			"Cool Mixed Forest",
			"Maritime Needleleaf Forest",
			"Temperate Needleleaf",
			"Moist Temperate Needleleaf Forest",
			"Subalpine Forest"
		],
		snowfall: [
			"Less than 0.1",
			"0.1 to 5.0",
			"5.1 to 10.0",
			"10.1 to 50.0",
			"50.1 to 100.0",
			"100.1 to 500.0",
			"500.1 to 2000.0"
		],
		devLandVal: [
			"Less than 250,000",
			"250,001 - 500,000",
			"500,001 - 750,000",
			"750,001 - 1,000,000",
			"More than 1,000,000"
		],
		agLandVal: [
			"Less than 500",
			"501 to 1,000",
			"1,001 to 1,500",
			"1,501 to 2,000",
			"2,001 to 2,500",
			"More than 2,500"
		],
		aridity: [
			"Less than 0.005",
			"0.005 to 0.01",
			"0.01 to 0.1",
			"0.1 to 0.5",
			"0.5 to 1.0",
			"1.0 to 1.5",
			"More than 1.5"
		]
	};
	
	// A legend title for each of the data layers
	App.legendTitles = {
		landcover: "Landcover and Forest Type",
		snowfall: "Snow Water <br/>Equivalent in cm",
		devLandVal: "Developed Land Value <br/>$ per Acre",
		agLandVal: "Agricultural Land Value <br/>$ per Acre",
		aridity: "Aridity Index"
	};
	
	// Changes the opacity of the main data layer.
	App.setDataLayerOpacity = function(opacity) {
		
		if(opacity) {
			App.settings.dataLayerOpacity = opacity;
		}
		activeDataLayer.setOpacity(App.settings.dataLayerOpacity);
	};
	
	

	// Creates the leaflet map and configures the available base layers.
	App.addMap = function() {
		
		// Enable using topojson in leaflet. 
		// TODO not tested yet.
		L.TopoJSON = L.GeoJSON.extend({  
		  addData: function(jsonData) {    
		    if (jsonData.type === "Topology") {
		      for (key in jsonData.objects) {
		        geojson = topojson.feature(jsonData, jsonData.objects[key]);
		        L.GeoJSON.prototype.addData.call(this, geojson);
		      }
		    }    
		    else {
		      L.GeoJSON.prototype.addData.call(this, jsonData);
		    }
		  }  
		});
		
		// Create the leaflet map
		App.map = L.map("map", {
			maxBounds: L.latLngBounds([55, -135], [35,-110]),
			minZoom: 7,
			maxZoom: 11
		}).setView([44.5, -122.7], 9);
		
		// A selection of basemaps to choose from using the very handy 
		// leaflet-oroviders.js
		// TODO These options are not needed UNLESS users will have the ability
		// to change the basemap.
		App.basemapLayers = {
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
		App.basemapLayers.Esri_WorldTerrain.addTo(App.map);		
		App.currentBasemap = App.basemapLayers.Esri_WorldTerrain;
		// Make a place to store data layers
		App.mapLayers = {};
		//L.control.scale().addTo(App.map);
	};

	// Changes the baselayer of the leaflet map. Called when GUI settings
	// are changed.
	App.setBaseLayer = function(layerName) {
		var newLayer = App.basemapLayers[layerName];
		App.map.removeLayer(App.currentBasemap);
		newLayer.addTo(App.map);
		App.currentBasemap = newLayer;
	};
	
	// Imports ww2100 data layer as json, creates a leaflet layer from the 
	// json, styles the layer according to data type, then adds it to the
	// leaflet map and configures the legend. 
	// Ensures only one ww2100 data layer is loaded at a time, and overlays
	// the reference layers on top. Called when GUI settings are changed.
	// settings: {type, date, scenario}
	App.addWW2100DataLayer = function(settings) {
		
		// Show the loading message.
		$("#loading").removeClass("hidden");
		
		// Object that stores all the paths to the ww2100 json files. Accessed
		// using properties of the settings argument.
		var allDataPaths = {
				landcover: {
					ref: {
						early: "data/geometry/dataLayers/lulc/Ref2010_lulc.json",
						mid:   "data/geometry/dataLayers/lulc/Ref2050_lulc.json",
						late:  "data/geometry/dataLayers/lulc/Ref2100_lulc.json"
					},
					econExtreme: {
						early: "data/geometry/dataLayers/lulc/EconExtreme2010_lulc.json",
						mid:   "data/geometry/dataLayers/lulc/EconExtreme2050_lulc.json",
						late:  "data/geometry/dataLayers/lulc/EconExtreme2100_lulc.json"
					},
					fireSuppress: {
						early: "data/geometry/dataLayers/lulc/FireSuppress2010_lulc.json",
						mid:   "data/geometry/dataLayers/lulc/FireSuppress2050_lulc.json",
						late:  "data/geometry/dataLayers/lulc/FireSuppress2100_lulc.json"
					},
					highClim: {
						early: "data/geometry/dataLayers/lulc/HighClim2010_lulc.json",
						mid:   "data/geometry/dataLayers/lulc/HighClim2050_lulc.json",
						late:  "data/geometry/dataLayers/lulc/HighClim2100_lulc.json"
					},
					urbanExpand: {
						early: "data/geometry/dataLayers/lulc/UrbExpand2010_lulc.json",
						mid:   "data/geometry/dataLayers/lulc/UrbExpand2050_lulc.json",
						late:  "data/geometry/dataLayers/lulc/UrbExpand2100_lulc.json"
					},
					highPop: {
						early: "data/geometry/dataLayers/lulc/HighPop2010_lulc.json",
						mid:   "data/geometry/dataLayers/lulc/HighPop2050_lulc.json",
						late:  "data/geometry/dataLayers/lulc/HighPop2100_lulc.json"
					},
					managed: {
						early: "data/geometry/dataLayers/lulc/Managed2010_lulc.json",
						mid:   "data/geometry/dataLayers/lulc/Managed2050_lulc.json",
						late:  "data/geometry/dataLayers/lulc/Managed2100_lulc.json"
					}
				},
				snowfall: {
					ref: {
						early: "data/geometry/dataLayers/snow/catch_shaper.json",
						mid: "",
						late: ""
					},
					econExtreme: {
						early: "",
						mid: "",
						late: ""
					}
				},
				agLandVal: {
					ref: {
						early: "data/geometry/dataLayers/agLandVal/ref2010_ag.json",
						mid: "data/geometry/dataLayers/agLandVal/ref2050_ag.json",
						late: "data/geometry/dataLayers/agLandVal/ref2100_ag.json"
					},
					econExtreme: {
						early: "data/geometry/dataLayers/agLandVal/econExtreme2010_ag.json",
						mid: "data/geometry/dataLayers/agLandVal/econExtreme2050_ag.json",
						late: "data/geometry/dataLayers/agLandVal/econExtreme2100_ag.json"
					},
					highPop: {
						early: "data/geometry/dataLayers/agLandVal/highPop2010_ag.json",
						mid: "data/geometry/dataLayers/agLandVal/highPop2050_ag.json",
						late: "data/geometry/dataLayers/agLandVal/highPop2100_ag.json"
					},
					urbanExpand: {
						early: "data/geometry/dataLayers/agLandVal/urbanExpansion2010_ag.json",
						mid: "data/geometry/dataLayers/agLandVal/urbanExpansion2050_ag.json",
						late: "data/geometry/dataLayers/agLandVal/urbanExpansion2100_ag.json"
					}
				},
				devLandVal: {
					ref: {
						early: "data/geometry/dataLayers/devLandVal/ref2010_developed.json",
						mid: "data/geometry/dataLayers/devLandVal/ref2050_developed.json",
						late: "data/geometry/dataLayers/devLandVal/ref2100_developed.json"
					},
					econExtreme: {
						early: "",
						mid: "",
						late: ""
					}
				},
				aridity: {
					ref: {
						early: "data/geometry/dataLayers/aridity/Ref2010_proj.json",
						mid: "data/geometry/dataLayers/aridity/ref2050_proj.json",
						late: "data/geometry/dataLayers/aridity/ref2100_proj.json"
					},
					econExtreme: {
						early: "data/geometry/dataLayers/aridity/EconExtreme2010_proj.json",
						mid: "data/geometry/dataLayers/aridity/EconExtreme2050_proj.json",
						late: "data/geometry/dataLayers/aridity/EconExtreme2100_proj.json"
					}
				}
		},
		
		// Names the leaflet layer the combination of the settings. This 
		// reference is needed to remove the layer later. 
		layerToAdd = settings.type + settings.date + settings.scenario,
		
		layer;
		
		// If the layer is already loaded, do nothing.
		for(layer in App.mapLayers) {
			if(App.mapLayers.hasOwnProperty(layer)) {
				if(layer === layerToAdd) {
					return;
				}
			}
		}
		
		console.log("loading " + layerToAdd);
		
		// Other functions need the settings, too!
		App.settings.currentDataSettings = settings;
		
		// The json is imported here. Do this if you want to add a geojson
		// maplayer to the map, as opposed to a tile layer. 
		d3.json(allDataPaths[settings.type][settings.scenario][settings.date], function(error, importedJson) {
			if(error) {
				alert("There is currently no data for this setting. Soon to come!"); 
				$("#loading").addClass("hidden");
				App.clearMapLayers();
				App.addReferenceLayers();
				throw new Error("Problem reading csv");
			}
			
			// Turn the geoJson into a leaflet layer
			// activeDataLayer = L.geoJson(importedJson, {
				// style: styleWW2100Layer,
				// // raise up to 1 to increase performance, while adding 
				// // weird gaps between polygons. 
				// smoothFactor: 0,
				// // This adds event listeners to each feature
				// onEachFeature: onEachFeature
			// });
			
			// Add the json as a vector tile layer. Much better performance
			// than a regular json layer. 
			App.colorizeFeatures(importedJson);
			activeDataLayer = App.buildTileLayer(importedJson);
			
			// TODO Again, caching these big json files may not be the best idea.
			//cachedJsonLayers[layerToAdd] = activeDataLayer;
			App.clearMapLayers();
			// layerToAdd is just a string that happens to be a key in the
			// mapLayers object. 
			App.setDataLayerOpacity();
			App.mapLayers[layerToAdd] = activeDataLayer.addTo(App.map);
			// Add the reference layers on TOP of the data layer.
			App.addReferenceLayers();
			// Hide the loading message.
			$("#loading").addClass("hidden");
		});	
		
		// no need to wait for the data to load. 
		App.configureLegend();
	};
	
	// Remove the specified data layer from the map. 
	// TODO This isn't used anywhere. Mostly just for debug.
	App.removeDataLayerFromMap = function(layerToRemove) {
		if(App.mapLayers.hasOwnProperty(layerToRemove)) {
			App.map.removeLayer(App.mapLayers[layerToRemove]);
			delete App.mapLayers[layerToRemove];
		} else {
			console.log(layerToRemove + " layer does not exist");
		}
	};
	
	// Styles individual feature polygons based on the data type. More specifically,
	// returns styling instructions in a format that Leaflet can use.
	// TODO obsolete when using vector tiles. Might could delete this, unless
	// I want layers with polygon interactions. 
	function styleWW2100Layer(feature){
		var fillColor,
			// The next two variables may never change, so could be hardcoded below later
			stroke = false;		
		
		switch(App.settings.currentDataSettings.type){
			case "landcover": fillColor = getLandcoverColor(feature);
				break;
			case "snowfall": fillColor = getSnowfallColor(feature);
				break;
			case "devLandVal": fillColor = getDevelopedLandValueColors(feature);
				break;
			case "agLandVal": fillColor = getAgriculturalLandValueColors(feature);
				break;
			case "aridity" : fillColor = getAridityColors(feature);
		}
		return {
			fillColor: fillColor,
			stroke: stroke,
			fillOpacity: App.settings.dataLayerOpacity
		};
	}
	
	/**
	 * Adds a color property to each feature based on other property values.
	 * @param {Object} data : This is geojson. 
	 */
	App.colorizeFeatures = function(data) {
		// What's this for?
	    var i, colorizerFunction;
	    
	    switch(App.settings.currentDataSettings.type){
			case "landcover": colorizerFunction = getLandcoverColor;
				break;
			case "snowfall": colorizerFunction = getSnowfallColor;
				break;
			case "devLandVal": colorizerFunction = getDevelopedLandValueColors;
				break;
			case "agLandVal": colorizerFunction = getAgriculturalLandValueColors;
				break;
			case "aridity" : colorizerFunction = getAridityColors;
		}
	    
	    // for each feature in the json...
	    for (i = 0; i < data.features.length; i+=1) {
			// add a color property.
	        data.features[i].properties.color = colorizerFunction(data.features[i]);

	    }

	};
	
	
	// Returns a color based on the lcCombined parameter of the provided 
	// landcover feature 
	function getLandcoverColor(feature) {
		var colors = App.colorPalates.landcover;
		switch (feature.properties.lcCombined) {
			case 50: //urban
			    return colors[0];
			case 51: //urban
			    return colors[1];
			case 52: //urban
			    return colors[2];
			case 53: //urban
			    return colors[3];
			case -99: //unforested
			    return colors[4];
			case 8: // subtropical mixed forest
				return colors[5];
			case 1: // temperate warm mixed forest (fdw)
				return colors[6];
			case 5: //cool mixed
			    return colors[7];	
			case 2:  //subalpine
			    return colors[11];
			case 3: //moist temp needle
			    return colors[10];
			case 4: // C3 shrubland (fto)
				return colors[5];
			case 6: //maritime needle
			    return colors[8];
			case 7: // temperate needleleaf woodland (fuc)
				return colors[9];
			case 9: //temperate needleleaf forest
			    return colors[9];
        }
        console.log("unknown case: " + feature.properties.lcCombined);
        return "rgb(100,100,100)";
	}
	
	function getSnowfallColor(feature) {
		// Get the snowfall value of that catchment
		var catchID = feature.properties.CATCHID,
			snowfall = Number(snowData[catchID - 1]),
			colors = App.colorPalates.snowfall;
		
		if(isNaN(snowfall)) {
			console.log("snowfall is NaN!");
			return "rgb(100,100,100)"
		}
		if(snowfall < 0.1) {
			return colors[0];
		}
		if(snowfall <= 5.0) {
			return colors[1];
		}
		if(snowfall <= 10.0) {
			return colors[2];
		}
		if(snowfall <= 50.0) {
			return colors[3];
		}
		if(snowfall <= 100.0) {
			return colors[4];
		}
		if(snowfall <= 500.0) {
			return colors[5];
		}
		if(snowfall > 500.0) {
			return colors[6];
		}
	}
	
	function getDevelopedLandValueColors(feature) {
		// Get the snowfall value of that catchment
		var landValue = Number(feature.properties.DEV_VAL),
			colors = App.colorPalates.devLandVal;
		
		if(isNaN(landValue)) {
			console.log("Developed Land Value is NaN!");
			return "rgb(100,100,100)"
		}
		
		if(landValue < 250000) {
			return colors[0];
		}
		if(landValue <= 500000) {
			return colors[1];
		}
		if(landValue <= 750000) {
			return colors[2];
		}
		if(landValue <= 1000000) {
			return colors[3];
		}
		if(landValue > 1000000) {
			return colors[4];
		}
	}
	
	function getAgriculturalLandValueColors(feature) {
		// Get the snowfall value of that catchment
		var landValue = Number(feature.properties.AG_VALCAT),
			colors = App.colorPalates.agLandVal;
		
		if(isNaN(landValue)) {
			console.log("Developed Land Value is NaN!");
			return "rgb(100,100,100)"
		}
		switch (landValue) {
			case 1: return colors[0];
			case 2: return colors[1];
			case 3: return colors[2];
			case 4: return colors[3];
			case 5: return colors[4];	
			case 6: return colors[5];
		}
	}
	
	function getAridityColors(feature){
		// Get the snowfall value of that catchment
		var aridity = Number(feature.properties.aridClass),
			colors = App.colorPalates.aridity;
		
		if(isNaN(aridity)) {
			console.log("Aridityis NaN!");
			return "rgb(100,100,100)"
		}
		switch (aridity) {
			case 1: return colors[0];
			case 2: return colors[1];
			case 3: return colors[2];
			case 4: return colors[3];
			case 5: return colors[4];	
			case 6: return colors[5];
			case 7: return colors[6];
		}
	}
	
	function createLabelIcon(labelClass,labelText){
		
		var html,
			svgCircle,
			svgText;
			
		svgText = "<text x='13' y='12' font-size='12'>" + 
				  labelText + "</text>";
		
		svgCircle = "<circle cx='5' cy='15' fill='black' r='3'>";
		
		//html = "<div><svg><circle cx='5' cy='5' fill='black' r='5'>"  + svgText + "</svg></div>";
		html = "<div><svg width='100' height='20'>"  + svgText  + svgCircle + "</svg></div>";
		
		return L.divIcon({ 
					iconAnchor: [6, 16], 
					className: labelClass,
					html: html
				});
	}
	
	App.makeCitiesReferenceLayer = function(citiesJSON){
		var cityMarkerOptions = {
		    radius: 4,
		    fillColor: "red",
		    color: "red",
		    weight: 1,
		    opacity: 1,
		    fillOpacity: 1
		};
		var labels = [], labelsLayer, 
			citiesLayer = L.geoJson(citiesJSON, {
				pointToLayer: function(feature, latlng) {
				return L.circleMarker(latlng, cityMarkerOptions);
			},
			
			onEachFeature: function(feature, layer) {
				var lat = feature.properties.latitude,
					lng = feature.properties.longitude,
					name = feature.properties.name;

				labels.push( L.marker([lat,lng], {icon:createLabelIcon("textLabelclass", name)}));  //.addTo(App.map);
			}
		});
		App.referenceLayers.cities = L.layerGroup(labels);
	};
		
	App.makeStreamsReferenceLayer = function(streamsJSON) {
		var streamsStyle = {
		    "color": "rgb(88,147,169)",
		    "weight": 2,
		    "opacity": 1
		};
		var streamsLayer = L.geoJson(streamsJSON, {
			style: streamsStyle
		});
		App.referenceLayers.streams = streamsLayer;
	};
	
	App.addReferenceLayers = function() {
		App.clearReferenceLayers();

		if(App.settings.showStreams) {
			App.referenceLayers.streams.addTo(App.map);
		}
		if(App.settings.showCities) {
			App.referenceLayers.cities.addTo(App.map);
		}
	};
	
	App.clearReferenceLayers = function() {
		// Loop through the App.referenceLayers, removing each one from the map.
		var layer;
		for(layer in App.referenceLayers) {
			if(App.referenceLayers.hasOwnProperty(layer)) {
				App.map.removeLayer(App.referenceLayers[layer]);
			}
		}
	};
	
	// Uses d3_queue to synchronously import json files. 
	// TODO Could import json when App inits and just load that json, rather
	// than always importing this data.
	App.importReferenceLayers = function(callback) {
		var dataPaths = {
			cities: "data/geometry/referenceLayers/cities.json",
			streams: "data/geometry/referenceLayers/streams.json"
		};
		
		d3_queue.queue(1)
			.defer(d3.json, dataPaths.cities)
			.defer(d3.json, dataPaths.streams)
			.awaitAll(callback);
	};
	
	// Removes all json layers from the leaflet map.
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
	
	App.configureLegend = function() {
		var legendItemContainer,
			legendItem,
			labelSizePx = 12,
			rectWidth = 20,
			rectHeight = 13,
			rectSpacer = 4,
			maxLabelWidth = 0,
			labelSpacer = 10,
			
			dataType = App.settings.currentDataSettings.type,
			title = App.legendTitles[dataType],
			colors = App.colorPalates[dataType],
			labels = App.legendLabels[dataType];
			
		
		d3.select("#legendItemContainer svg").remove();
		
		// Creates the svg to stick legend items in, sets the width and height
		legendItemContainer = d3.select("#legendItemContainer")
			.append("svg")
			.attr("height", function() {
				var l = colors.length;
				return (l * rectHeight + (l - 1) * rectSpacer) + 2;
			})
			.attr("width", function() {
				//return "100%"
			});
			
		legendItem = legendItemContainer.selectAll("g")
			.data(colors)
			.enter().append("g");
			
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
		
		legendItem.append("text")
			.style("font-size", labelSizePx + "px")
			.style("font-family", "Tahoma, Geneva, sans-serif")
			.text(function(d, i) {
				return labels[i];
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
		
		$("#legendContainer label").html(title);
	};

// Event listeners for snow layer pointer interations --------------------------

	//TODO these may not be needed

	function highlightFeature(e) {
	    var layer = e.target;
		console.log(snowData[layer.feature.properties.CATCHID-1]);
	    layer.setStyle({
			stroke: 1,
	        color: '#666'
	    });
	    if (!L.Browser.ie && !L.Browser.opera) {
	        layer.bringToFront();
	    }
	}
	
	function resetHighlight(e) {
	    activeDataLayer.resetStyle(e.target);
	}

	function onEachFeature(feature, layer) {
		if(App.settings.currentDataSettings.type==="snowfall") {
			layer.on({
		        mouseover: highlightFeature,
		        mouseout: resetHighlight
		    });
		}
	}

	// Cache reference vector layers
	App.initReferenceLayers = function(callback) {
		App.referenceLayers = {};
		// Import reference layer json, make layers out of them, store them.
		App.importReferenceLayers(function(error, data) {
			if (error) {throw error;}
			
			var citiesJSON = data[0],
				streamsJSON = data[1];
			App.makeCitiesReferenceLayer(citiesJSON);
			App.makeStreamsReferenceLayer(streamsJSON);
			callback();
		});
	}
	
	
// END Event listeners ---------------------------------------------------------

	/**
	 * This stuff happens when the app starts.
	 */
	App.init = function () {
		App.addMap();
		App.GUI.init();
		App.initColorsPalates();
		App.initReferenceLayers(function(){
			App.GUI.loadDataByGUI();
		});
	};
	
}()); // END App------------------------------------------------

// Launch the app
$(document).ready(function() {
	"use strict";
	App.init();
});
