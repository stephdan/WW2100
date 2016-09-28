/**
 * Creates map tile layers to add to leaflet.
 * Data must be geojson
 */
App.buildTileLayer = function(data) {
	
"use strict";


var tileOptions = {
    maxZoom: 20,  // max zoom to preserve detail on
    tolerance: 5, // simplification tolerance (higher means simpler)
    extent: 4096, // tile extent (both width and height)
    buffer: 64,   // tile buffer on each side
    debug: 0,      // logging level (0 to disable, 1 or 2)

    indexMaxZoom: 0,        // max zoom in the initial tile index
    indexMaxPoints: 100000, // max number of points per tile in the index
};

	
var pad = 0;

function drawingOnCanvas(canvasOverlay, params) {

    var bounds = params.bounds,
		i, j;
    params.tilePoint.z = params.zoom;

	/**
	 * Ok, ctx has something to do with rendering. I don't know what tha param
	 * argument is, but it's key to rendering. 
	 */
    var ctx = params.canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';

    //console.log('getting tile z' + params.tilePoint.z + '-' + params.tilePoint.x + '-' + params.tilePoint.y);

	/**
	 * Here. There needs to be a global variable called tileIndex for this
	 * thing to work. So for my map, this variable needs to be created
	 * whenever new data is loaded.
	 */
    var tile = tileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);

    if (!tile) {
        console.log('tile empty');
        return;
    }

	/*
	 * ctx is reminding me of stuff in java.
	 */
    ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);

    var features = tile.features;

	/**
	 * Setting the stroke style of the entire canvas to gray? Could this also
	 * be done for each feature? Pretty sure. 
	 */
    //ctx.strokeStyle = 'grey';

	/**
	 * Loops through the features that exist in the tile!
	 */
    for (i = 0; i < features.length; i++) {
        var feature = features[i],
        	// What is the feature type? Point/line/polygon?
            type = feature.type;

		/**
		 * Ok, I'm not sure how the feature.tags.color was created. Specifically,
		 * the word tags. Color got stuck in somewhere else earlier, as a 
		 * property of the json. I guess whatever converts the json to tiles
		 * creates "tags" out of the properties. 
		 * Anyway, if it has a color, it sets it to the stored color. 
		 * Otherwise, it sets it to a default. 
		 */
        ctx.fillStyle = feature.tags.color ? feature.tags.color : 'rgba(255,0,0,0.05)';
        ctx.strokeStyle = feature.tags.color ? feature.tags.color : 'rgba(255,0,0,0.05)';
        ctx.lineWidth = 0.75;
        /**
         * This seems important. Again, reminding me of java. 
         */
        ctx.beginPath();

		/**
		 * This is going to loop over every goddamn vertex and draw a line. 
		 */
        for (j = 0; j < feature.geometry.length; j++) {
            var geom = feature.geometry[j], k;

            if (type === 1) {
            	/**
            	 * Where the hell did the ratio variable come from?
            	 */
                ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false);
                continue;
            }

            for (k = 0; k < geom.length; k++) {
                var p = geom[k];
                var extent = 4096;
               
                var x = p[0] / extent * 256;
                var y = p[1] / extent * 256;
                if (k) ctx.lineTo(x  + pad, y   + pad);
                else ctx.moveTo(x  + pad, y  + pad);
            }
        }
		/**
		 * Fills in the polygons, and makes the stroke!
		 */
        if (type === 3 || type === 1) {
            ctx.fill('evenodd');
        }
        ctx.stroke();
    }
}

var tileIndex = geojsonvt(data, tileOptions);
	
var tileLayer = L.canvasTiles()
              .params({ debug: false, padding: 5 })
              .drawing(drawingOnCanvas);

return tileLayer;

};
