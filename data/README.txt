November, 2016

Do not change the names of any of the files in these folders. It will break the map unless the website code is changed to reflect the new names. 

There are several different types of data used for this map, which are divided into different folders.

FOLDERS
-------

/etData

These are CSV files of evapotranspiration values averaged by decade. Each file is for a different modeling scenario. 

The map uses a single TopoJSON file to create the polygons for all ET scenarios, and reads in these CSV files to determine what values to assign to each polygon. 


/geometry

There are a bunch of additional folders in here. 

The /dataLayers folder contains TopoJSON and GeoJSON files for each of the 4 data layers. 

The et and snow folders have just a single TopoJSON file each. For et and snow, the map uses the same polygons for each scenario, assigning them different values.

The /lulc and /landValue folders contain lots of TopoJSON files, one for each scenario and time period. 

The /referenceLayers folder contains TopoJSON files for the reference layers included in the map. The files for streams and openWater are combined into one layer in the map. 


/snowData

These are CSV files of max SWE values averaged by decade. Each file is for a different modeling scenario. 

The map uses a single TopoJSON file to create the polygons for all maxSWE scenarios, and reads in these CSV files to determine what values to assign to each polygon. 

