// Stops/routes store GeoJSON [lng, lat]; Leaflet positions want [lat, lng].
export function toLatLng(coordinates) {
  return [coordinates[1], coordinates[0]];
}
