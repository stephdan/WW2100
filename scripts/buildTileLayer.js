/**
 * Creates map tile layers to add to leaflet.
 * Data must be geojson
 * Requires L.CanvasTiles.js, which enables leaflet to display vector tile 
 * layers.
 * origional author: Stanislav Sumbera, 
 * http://bl.ocks.org/sumbera/c67e5551b21c68dc8299)
 */
App.buildTileLayer = function(data) {
	
"use strict";

var pad = 0,
	tileIndex,
	tileLayer,
	tileOptions = {
	    maxZoom: 20,  // max zoom to preserve detail on
	    tolerance: 5, // simplification tolerance (higher means simpler)
	    extent: 4096, // tile extent (both width and height)
	    buffer: 64,   // tile buffer on each side
	    debug: 0,      // logging level (0 to disable, 1 or 2)
	
	    indexMaxZoom: 0,        // max zoom in the initial tile index
	    indexMaxPoints: 100000 // max number of points per tile in the index
	};

function drawingOnCanvas(canvasOverlay, params) {

    var bounds = params.bounds,
		i, j, ctx, tile, features, feature, geom, p, type, extent, x, y, k;
		
    params.tilePoint.z = params.zoom;

    ctx = params.canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';

    tile = tileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);

    if (!tile) {
        console.log('tile empty');
        return;
    }

    ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);

    features = tile.features;

    //ctx.strokeStyle = 'grey';
    for (i = 0; i < features.length; i++) {
        feature = features[i];
        type = feature.type;

        ctx.fillStyle = feature.tags.color ? feature.tags.color : 'rgba(255,0,0,0.05)';
        ctx.strokeStyle = feature.tags.color ? feature.tags.color : 'rgba(255,0,0,0.05)';
        ctx.lineWidth = 0.75;

        ctx.beginPath();

        for (j = 0; j < feature.geometry.length; j++) {
            geom = feature.geometry[j];

            if (type === 1) {
                ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false);
                continue;
            }

            for (k = 0; k < geom.length; k++) {
                p = geom[k];
                extent = 4096;
               
                x = p[0] / extent * 256;
                y = p[1] / extent * 256;
                if (k) ctx.lineTo(x  + pad, y   + pad);
                else ctx.moveTo(x  + pad, y  + pad);
            }
        }
        if (type === 3 || type === 1) {
            ctx.fill('evenodd');
        }
        ctx.stroke();
    }
}

tileIndex = geojsonvt(data, tileOptions);
	
tileLayer = L.canvasTiles()
              .params({ debug: false, padding: 5 })
              .drawing(drawingOnCanvas);

return tileLayer;

};
