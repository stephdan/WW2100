(function(){
	"use strict";
	
	// Establish a global namespace
	var App = {},
		jsonLayer, //TODO this is kindof a random place to put this
		cachedJsonLayers = {};
	
	App.settings = {
		showReferenceLayers: true,
		showCities: true,
		showStreams: true,
		dataLayerOpacity: 0.8,
		currentDataSettings: ""
	};
	
	
	App.getJsonLayer = function() {
		return jsonLayer;
	};
	
	// Assign global variable
	window.App = App;
	
	// TODO these snowData things should be stored elsewhere, but not sure where
	// just yet. It will depend on how this whole snow deal gets structured. 
	var snowDataPath ="data/snowData/fakeData_midref.csv";
	var snowData;
	var selectedDataType;
	
	
	App.clearMainDataLayer = function(){
		App.map.removeLayer(jsonLayer);
	};
	
	App.addMainDataLayer = function() {
		jsonLayer.addTo(App.map);
	};
	
	App.initColorsPalates = function(){
		
		App.colorPalates = {};
		
		App.colorPalates.landcover = [
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
		
		App.colorPalates.snowfall = ColorUtils.getColorRamp(
					[255,255,255], 
					[105, 70,156], 
					7, "string"
				);
		
		App.colorPalates.devLandVal = ColorUtils.getColorRamp(
					[237,248,233], 
					[0,109,44], 
					5, 
					"string"
				);
		
		App.colorPalates.agLandVal = ColorUtils.getColorRamp(
					[237,248,233], 
					[0,109,44], 
					6, 
					"string"
				); 
	};
		
	var legendLabels = {
		landcover: [
			"Urban",
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
		]
	}
	
	var legendTitles = {
		landcover: "Landcover and Forest Type",
		snowfall: "Snowfall (type?)",
		devLandVal: "Developed Land Value <br/>$ per Acre",
		agLandVal: "Agricultural Land Value <br/>$ per Acre"
	}
	
	
	d3.csv(snowDataPath, function(d) {
		snowData = d.map(function(v) {
			return v.value;
		});
	});
	
	App.setDataLayerOpacity = function(opacity) {
		App.settings.dataLayerOpacity = opacity;
		jsonLayer.setStyle({fillOpacity: opacity});
	};
	
	/**
	 * Adds the leaflet basemap to the page. 
	 */
	App.addMap = function() {
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
	};

	App.setBaseLayer = function(layerName) {
		var newLayer = App.basemapLayers[layerName];
		App.map.removeLayer(App.currentBasemap);
		newLayer.addTo(App.map);
		App.currentBasemap = newLayer;
	};
	
	App.addWW2100DataLayer = function(settings) {
		
		$("#loading").removeClass("hidden");
		
		var allDataPaths = {
				landcover: {
					ref: {
						early: "data/geometry/json/lulc/Ref2010_lulc.json",
						mid: "data/geometry/json/lulc/Ref2050_lulc.json",
						late: "data/geometry/json/lulc/Ref2100_lulc.json"
					},
					econExtreme: {
						early: "data/geometry/json/lulc/EconExtreme2010_lulc.json",
						mid: "data/geometry/json/lulc/EconExtreme2050_lulc.json",
						late: "data/geometry/json/lulc/EconExtreme2100_lulc.json"
					}
				},
				snowfall: {
					ref: {
						early: "data/geometry/json/snow/catch_shaper.json",
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
						early: "data/geometry/json/agLandVal/ref2010_ag.json",
						mid: "data/geometry/json/agLandVal/ref2050_ag_mapShaper.json",
						late: "data/geometry/json/agLandVal/ref2100_ag_mapShaper.json",
					},
					econExtreme: {
						early: "data/geometry/json/agLandVal/econExtreme2010_ag.json",
						mid: "",
						late: ""
					}
				},
				devLandVal: {
					ref: {
						early: "data/geometry/json/devLandVal/ref2010_developed.json",
						mid: "data/geometry/json/devLandVal/ref2050_developed.json",
						late: "data/geometry/json/devLandVal/ref2100_developed.json"
					},
					econExtreme: {
						early: "",
						mid: "",
						late: ""
					}
				}
		},
		
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
		
		selectedDataType = settings.type;
		
		// if the layer is already cached, add it to the map
		if(cachedJsonLayers.hasOwnProperty(layerToAdd)) {
			console.log("layer is cached!");
			console.log(cachedJsonLayers);
			// A slight pause to allow the loading message to display
			// Usually this happens when importing json files, but that doesn't
			// happen in this case because the json is cached
			setTimeout(function() {
				App.clearMapLayers();
				jsonLayer = cachedJsonLayers[layerToAdd];
				// set the opacity in case it has changed
				App.setDataLayerOpacity(App.settings.dataLayerOpacity);
				App.mapLayers[layerToAdd] = cachedJsonLayers[layerToAdd].addTo(App.map);
				App.addReferenceLayers();
				$("#loading").addClass("hidden");
			}, 10);
			
			
		} else {
			console.log("layer is NOT cached.");
			console.log(cachedJsonLayers);
			// create the layer, cache it, add it to the map
			d3.json(allDataPaths[settings.type][settings.scenario][settings.date], function(error, importedJson) {
				if(error) {
					alert("There is currently no data for this setting. Soon to come!"); 
					$("#loading").addClass("hidden");
					App.clearMapLayers();
					App.addReferenceLayers();
					throw new Error("Problem reading csv");
				}
				
				// Turn the geoJson into a leaflet layer
				jsonLayer = L.geoJson(importedJson, {
					// A low smooth factor prevents gaps between simplified
					// polygons, but decreases performance.
					// raise up to 1 to increase performance, while adding 
					// weird gaps between polygons. 
					style: styleWW2100Layer,
					smoothFactor: 0,
					
					// This adds event listeners to each feature
					onEachFeature: onEachFeature
				});
				cachedJsonLayers[layerToAdd] = jsonLayer;
				App.clearMapLayers();
				// layerToAdd is just a string that happens to be a key in the
				// mapLayers object. 
				App.mapLayers[layerToAdd] = jsonLayer.addTo(App.map);
				App.addReferenceLayers();
				$("#loading").addClass("hidden");
				App.settings.currentDataSettings = settings;
			});	
		}
		// Configure legend here
		App.configureLegend({
			title: legendTitles[settings.type], 
			colors: App.colorPalates[settings.type], 
			labels: legendLabels[settings.type]});
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
	
	
	function styleWW2100Layer(feature){
		var fillColor,
			// The next two may never change, so could be hardcoded below later
			stroke = false,
			fillOpacity = 0.8;		
		
		switch(selectedDataType){
			case "landcover": fillColor = getLandcoverColor(feature);
				break;
			case "snowfall": fillColor = getSnowfallColor(feature);
				break;
			case "devLandVal": fillColor = getDevelopedLandValueColors(feature);
				break;
			case "agLandVal": fillColor = getAgriculturalLandValueColors(feature);
				break;
		}
		return {
			fillColor: fillColor,
			stroke: stroke,
			fillOpacity: App.settings.dataLayerOpacity
		};
	}
	
	function getLandcoverColor(feature) {
		var colors = App.colorPalates.landcover;
		switch (feature.properties.lcCombined) {
			case 50: //urban
			    return colors[0];
			case -99: //unforested
			    return colors[1];
			case 8: // subtropical mixed forest
				return colors[2];
			case 1: // temperate warm mixed forest (fdw)
				return colors[3];
			case 5: //cool mixed
			    return colors[4];	
			case 2:  //subalpine
			    return colors[8];
			case 3: //moist temp needle
			    return colors[7];
			case 4: // C3 shrubland (fto)
				return colors[1];
			case 6: //maritime needle
			    return colors[5];
			case 7: // temperate needleleaf woodland (fuc)
				return colors[6];
			case 9: //temperate needleleaf forest
			    return colors[6];
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
			cities: "data/geometry/baseLayers/cities_oregon.json",
			streams: "data/geometry/baseLayers/streams.json"
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
	
	App.dataLayers = {
		LULC2010_ref: "data/geometry/json/lulc/Ref2010_LULC.json",
		LULC2050_ref: "data/geometry/json/lulc/Ref2050_LULC.json",
		LULC2100_ref: "data/geometry/json/lulc/Ref2100_LULC.json",
		catchments: "data/geometry/json/snow/catch.geojson",
		catchments_shaper: "data/geometry/json/snow/catch_shaper.json"
	};
	
	App.configureLegend = function(legendData) {
		var legendItemContainer,
			legendItem,
			labelSizePx = 12,
			rectWidth = 20,
			rectHeight = 13,
			rectSpacer = 4,
			maxLabelWidth = 0,
			labelSpacer = 10;
		
		d3.select("#legendItemContainer svg").remove();
		
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
	    jsonLayer.resetStyle(e.target);
	}

	function onEachFeature(feature, layer) {
		if(selectedDataType==="snowfall") {
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
			console.log(App.referenceLayers);
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
