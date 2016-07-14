(function(){
	"use strict";
	
	// Establish a global namespace
	var App = {},
		jsonLayer;
		
	// Assign global variable
	window.App = App;
	
	var snowDataPath ="data/snowdata/fakeData_midref.csv";
	var snowData;
	d3.csv(snowDataPath, function(d) {
		snowData = d.map(function(v) {
			return v.value;
		});
	})
	
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
		//App.addDataLayerToMap("LULC2010_ref");
	};
	
	App.addLandcoverLayer = function(date, scenario) {
		
		var dataPaths = {
				early: {ref:"data/geometry/json/lulc/Ref2010_LULC.json"},
				mid: {ref:"data/geometry/json/lulc/Ref2050_LULC.json"},
				late: {ref: "data/geometry/json/lulc/Ref2100_LULC.json"}
			},
			layerToAdd = "lulc" + date + scenario;
			
		d3.json(dataPaths[date][scenario], function(error, importedJson) {
			if(error) {
				throw new Error("Problem reading csv " + dataPaths[date][scenario]);
			}
			
			// Turn the geoJson into a leaflet layer
			jsonLayer = L.geoJson(importedJson, {
				// A low smooth factor prevents gaps between simplified
				// polygons, but decreases performance.
				// raise up to 1 to increase performance, while adding 
				// weird gaps between polygons. 
				style: styleLandcoverLayer,
				smoothFactor: 0,
				
				// This adds event listeners to each feature
				// onEachFeature: onEachFeature
			});
			App.clearMapLayers();
			// layerToAdd is just a string that happens to be a key in the
			// mapLayers object. 
			App.mapLayers[layerToAdd] = jsonLayer.addTo(App.map);
			console.log(importedJson);
		});
		
		// TODO Configure legend here, move required legend info into this
		// function.
		App.configureLegend({title: "Landcover and Forest Type", colors: landcoverColors, labels: landcoverLabels});
	};
	
	App.addSnowfallLayer = function(date, scenario) {
		var dataPaths = {
				early: {ref: "data/geometry/json/snow/catch_shaper.json"},
				mid: {ref: "data/geometry/json/snow/catch_shaper.json"},
				late: {ref: "data/geometry/json/snow/catch_shaper.json"}
			},
			layerToAdd = "snowFall" + date + scenario;
			
		d3.json(dataPaths[date][scenario], function(error, importedJson) {
			if(error) {
				throw new Error("Problem reading csv " + dataPaths[date][scenario]);
			}
			
			// Turn the geoJson into a leaflet layer
			jsonLayer = L.geoJson(importedJson, {
				// A low smooth factor prevents gaps between simplified
				// polygons, but decreases performance.
				// raise up to 1 to increase performance, while adding 
				// weird gaps between polygons. 
				style: styleSnowfallLayer,
				smoothFactor: 0,
				
				// This adds event listeners to each feature
				onEachFeature: onEachFeature
			});
			App.clearMapLayers();
			// layerToAdd is just a string that happens to be a key in the
			// mapLayers object. 
			App.mapLayers[layerToAdd] = jsonLayer.addTo(App.map);
			console.log(importedJson);
		});
		App.configureLegend({title: "Snowfall (type?)", colors: snowfallColors, labels: snowfallLabels});
	};
	
	App.addDevelopedLandValueLayer = function(date, scenario) {
		var dataPaths = {
				early: {ref:"data/geometry/json/devLandVal/ref2010_developed.json"},
				mid: {ref:"data/geometry/json/devLandVal/ref2050_developed.json"}
			},
			layerToAdd = "devLandVal" + date + scenario;
			
		d3.json(dataPaths[date][scenario], function(error, importedJson) {
			if(error) {
				throw new Error("Problem reading csv " + dataPaths[date][scenario]);
			}
			
			// Turn the geoJson into a leaflet layer
			jsonLayer = L.geoJson(importedJson, {
				// A low smooth factor prevents gaps between simplified
				// polygons, but decreases performance.
				// raise up to 1 to increase performance, while adding 
				// weird gaps between polygons. 
				style: styleDevelopedLandValueLayer,
				smoothFactor: 0,
				
			});
			App.clearMapLayers();
			// layerToAdd is just a string that happens to be a key in the
			// mapLayers object. 
			App.mapLayers[layerToAdd] = jsonLayer.addTo(App.map);
			console.log(importedJson);
		});
		App.configureLegend({title: "Developed Land Value <br/>$ per Acre", colors: developedLandValueColors, labels: developedLandValueLabels});
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
	
	function styleLandcoverLayer(feature) {
		return {
			fillColor: getLandcoverColor(feature),
			stroke: false,
			fillOpacity: 0.8
		}
	}
	
	function styleSnowfallLayer(feature) {
		return {
			fillColor: getSnowfallColor(feature),
			stroke: false,
			fillOpacity: 0.8
		}
	}
	
	function styleDevelopedLandValueLayer(feature) {
		return {
			fillColor: getDevelopedLandValueColors(feature),
			stroke: false,
			fillOpacity: 0.8
		}
	}
	
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
	
	var snowfallColors = [
		"rgb(255,255,255)",
		"rgb(216,236,248)",
		"rgb(181,205,242)",
		"rgb(151,179,236)",
		"rgb(125,146,220)",
		"rgb(115,108,188)",
		"rgb(105,70,156)"
	];
	
	var snowfallLabels = [
		"Less than 0.1",
		"0.1 to 5.0",
		"5.1 to 10.0",
		"10.1 to 50.0",
		"50.1 to 100.0",
		"100.1 to 500.0",
		"500.1 to 2000.0"
	];
	
	var developedLandValueColors = [
		"rgb(254, 255,121)",
		"rgb(215, 194,94)",
		"rgb(175, 136,67)",
		"rgb(137, 80,42)",
		"rgb(101, 16,19)"
	];
	
	var developedLandValueLabels = [
		"Less than 250,000",
		"250,001 - 500,000",
		"500,001 - 750,000",
		"750,001 - 1,000,000",
		"More than 1,000,000"
	];
	
	function getLandcoverColor(feature) {
		switch (feature.properties.lcCombined) {
			case 50: //urban
			    return landcoverColors[0];
			case -99: //unforested
			    return landcoverColors[1];
			case 8: // subtropical mixed forest
				return landcoverColors[2];
			case 1: // temperate warm mixed forest (fdw)
				return landcoverColors[3];
			case 5: //cool mixed
			    return landcoverColors[4];	
			case 2:  //subalpine
			    return landcoverColors[8];
			case 3: //moist temp needle
			    return landcoverColors[7];
			case 4: // C3 shrubland (fto)
				return landcoverColors[1];
			case 6: //maritime needle
			    return landcoverColors[5];
			case 7: // temperate needleleaf woodland (fuc)
				return landcoverColors[6];
			case 9: //temperate needleleaf forest
			    return landcoverColors[6];
        }
        console.log("unknown case: " + feature.properties.lcCombined);
        return "rgb(100,100,100)"
	}
	
	function getSnowfallColor(feature) {
		// Get the snowfall value of that catchment
		var catchID = feature.properties.CATCHID,
			snowfall = Number(snowData[catchID - 1]);
		
		if(isNaN(snowfall)) {
			console.log("snowfall is NaN!");
			return "rgb(100,100,100)"
		}
		
		if(snowfall < 0.1) {
			return snowfallColors[0];
		}
		if(snowfall <= 5.0) {
			return snowfallColors[1];
		}
		if(snowfall <= 10.0) {
			return snowfallColors[2];
		}
		if(snowfall <= 50.0) {
			return snowfallColors[3];
		}
		if(snowfall <= 100.0) {
			return snowfallColors[4];
		}
		if(snowfall <= 500.0) {
			return snowfallColors[5];
		}
		if(snowfall > 500.0) {
			return snowfallColors[6];
		}
	}
	
	function getDevelopedLandValueColors(feature) {
		// Get the snowfall value of that catchment
		var landValue = Number(feature.properties.DEV_VAL);
		
		if(isNaN(landValue)) {
			console.log("Developed Land Value is NaN!");
			return "rgb(100,100,100)"
		}
		
		if(landValue < 250000) {
			return developedLandValueColors[0];
		}
		if(landValue <= 500000) {
			return developedLandValueColors[1];
		}
		if(landValue <= 750000) {
			return developedLandValueColors[2];
		}
		if(landValue <= 1000000) {
			return developedLandValueColors[3];
		}
		if(landValue > 1000000) {
			return developedLandValueColors[4];
		}
	}
	
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

	function onEachFeature(feature, layer) {
	    layer.on({
	        mouseover: highlightFeature,
	        mouseout: resetHighlight
	    });
	}

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
	
	
// END Event listeners ---------------------------------------------------------

	/**
	 * This stuff happens when the app starts.
	 */
	App.init = function () {
		App.addMap();
		App.GUI.init();
		App.GUI.loadDataByGUI();
	};
	
}()); // END App------------------------------------------------

// Launch the app
$(document).ready(function() {
	"use strict";
	App.init();
});
