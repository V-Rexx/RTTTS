// Haversine formula — distance between two lat/lng points on a sphere.
// Returns distance in METRES.
// 
// Earth is not a perfect sphere — Vincenty's formula is more accurate
// but Haversine is fast and accurate to within ~0.5% for typical distances.
// Good enough for finding a bus stop within walking distance.

const EARTH_RADIUS_METRES = 6371000

const haversine = (lat1, lng1, lat2, lng2) => {
  const φ1 = toRadians(lat1)
  const φ2 = toRadians(lat2)
  const Δφ = toRadians(lat2 - lat1)
  const Δλ = toRadians(lng2 - lng1)

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METRES * c
}

const toRadians = (degrees) => degrees * (Math.PI / 180)

// Estimate walking time in seconds.
// Average walking speed: 80 m/min ≈ 1.33 m/s (typical urban pace)
const walkingTimeSeconds = (distanceMetres) => {
  const WALKING_SPEED_MS = 1.33
  return distanceMetres / WALKING_SPEED_MS
}

// Estimate bus travel time in seconds given distance and speed (km/h).
// Falls back to 25 km/h if speed is 0 or missing (typical city bus avg).
const busTravelTimeSeconds = (distanceMetres, speedKmh) => {
  const speed = speedKmh && speedKmh > 5 ? speedKmh : 25
  const speedMs = (speed * 1000) / 3600   // km/h → m/s
  return distanceMetres / speedMs
}

module.exports = {
  haversine,
  walkingTimeSeconds,
  busTravelTimeSeconds
}