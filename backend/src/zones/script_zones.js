import ZoneModel from './model';

module.exports = 
{
  insertZones: function () {insertZones()},
  nearZones: function (lat, lng) {nearZones(lat, lng)}
};

function insertZones() {
	var fs = require('fs');
	var json = JSON.parse(fs.readFileSync('src/zones/FAO_AREAS/FAO_AREAS.json', 'utf8'));
	var features = json["features"];

	for(var i = 0; i < features.length; i++) {
		var properties = features[i]["properties"];
		var code = properties["F_CODE"];
		var level = properties["F_LEVEL"];
		var ocean = properties["OCEAN"].toUpperCase();
		if (!["ATLANTIC", "INDIAN", "PACIFIC", "ARTIC"].includes(ocean)) ocean = "ATLANTIC";
		var parent = "";
		if (level === "SUBAREA") parent = properties["F_AREA"];
		else if (level === "DIVISION") parent = properties["F_SUBAREA"];
		else if (level === "SUBDIVISION") parent = properties["F_DIVISION"];
		else if (level === "SUBUNIT") parent = properties["F_SUBDIVIS"];

		var geometry = features[i]["geometry"];
		var coordinates = [];
		var centroids = [];
		geometry.coordinates.forEach(function(polygon){
			var polygoncoords = [];
		   	polygon.forEach(function(linearring){
				var firstring = linearring[0];
				var latlong = {
			   		lat: firstring[0],
	        		lng: firstring[1]
	    		}
			   	polygoncoords.push(latlong);
			});
			coordinates.push(polygoncoords);

			var centerpolygon = computeCenterOfPolygon(polygoncoords);
			centroids.push(centerpolygon);
		});
		var centroidLat = centroids.reduce((a, o, i, p) => a + o.lat / p.length, 0);
		var centroidLng = centroids.reduce((a, o, i, p) => a + o.lng / p.length, 0);
		var centroid = {lat: centroidLat, lng: centroidLng};

		createZone(code, level, ocean, parent, coordinates, centroid);
	}
}

function createZone(code, level, ocean, parent, polygon, centroid) {
	
	const zone = new ZoneModel({
                id: undefined,
                code,
                level,
                ocean: ocean.toUpperCase(),
                parent,
                polygon: polygon,
                centroid,
                laws: []
            });
    zone.save();
}

function computeCenterOfPolygon(polygon) {
	var maxLat = Math.max.apply(Math,polygon.map(function(o){return o.lat;}));
	var minLat = Math.min.apply(Math,polygon.map(function(o){return o.lat;}));
	var maxLng = Math.max.apply(Math,polygon.map(function(o){return o.lng;}));
	var minLng = Math.min.apply(Math,polygon.map(function(o){return o.lng;}));

	var center = {
		lat: minLat+(maxLat-minLat)/2,
		lng: minLng+(maxLng-minLng)/2
	}

	return center;
}



function nearZones(lat, lng) {
	var maxDistance = 1000;
	var zones = ZoneModel.find({});
	//var zones = ZoneModel.dataSize();
	console.log(zones);

	/*
	var zones = ZoneModel.findOne( { 'code': '21' } );
	var result = [];
	zones.forEach(function(zone){
		zone.polygon.forEach(function(polygon){
			var distFromZone = getDistanceFromLatLonInKm(lat, lng, polygon.centroid.lat, polygon.centroid.lng);
			if (distFromZone < maxDistance) {
				result.push(zone);
			}
		})
	})

	return result;
	*/
	return zones;
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

