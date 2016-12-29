/*
 * Some functions for managing color data.
 */
var ColorUtils = (function() {
	
"use strict";

/*
 * Blend two colors, c1 and c2, which must be arrays [r,g,b,a].
 * Ratio determines how the colors are weighted to create the new color.
 */
function blend(c1, c2, ratio) {
	if (ratio > 1) {
		return c2;
	}
	if (ratio < 0) {
		return c1;
	}

	var r1 = c1[0],
	    g1 = c1[1],
	    b1 = c1[2],
	    a1 = c1[3],
	    r2 = c2[0],
	    g2 = c2[1],
	    b2 = c2[2],
	    a2 = c2[3],
	    r = Math.round(r1 + (r2 - r1) * ratio),
	    g = Math.round(g1 + (g2 - g1) * ratio),
	    b = Math.round(b1 + (b2 - b1) * ratio),
	    a = (a1 + (a2 - a1) * ratio);

	return [r,g,b,a];
}

// takes an array like [r,g,b] and makes it "rgb(r,g,b)" for use with d3
function rgbArrayToString(rgb){
	if(!isNaN(rgb[3])) {
		return "rgba(" +  rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + rgb[3] + ")";
	}
	return "rgb(" +  rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
}

function arrayOfRGBArraysToArrayOfRGBStrings(arrayOfRGBArrays) {
	var arrayOfRGBStrings = [],
		i, rgbArray;
	for(i = 0; i < arrayOfRGBArrays.length; i += 1) {
		arrayOfRGBStrings.push(rgbArrayToString(arrayOfRGBArrays[i]));
	}
	return arrayOfRGBStrings;
}

// TODO allow string arguments for colors, aka "rgb(000,000,000)"
function getColorRamp(c1, c2, breaks, returnDataType) {
	var ramp = [c1], 
		i, b, k;
	k = 1 / (breaks - 1);
	b = k;
	for(i = 1; i < (breaks - 1); i += 1) {
		ramp.push(blend(c1, c2, b));
		b += k;
	}
	ramp.push(c2);
	
	if(returnDataType === "string") {
		return arrayOfRGBArraysToArrayOfRGBStrings(ramp);
	}
	return ramp;
}

// Expose some functions
return {
	blend: blend,
	rgbArrayToString: rgbArrayToString,
	arrayOfRGBArraysToArrayOfRGBStrings: arrayOfRGBArraysToArrayOfRGBStrings,
	getColorRamp: getColorRamp
};
	
}());
