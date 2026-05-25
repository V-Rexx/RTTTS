import { useState, useEffect } from 'react';
import { getDistance, estimateWalkingTime } from '../lib/haversine';
import { useCity } from '../context/CityContext';

export default function useNearestBus(userLocation) {
  const { stops, routes, buses } = useCity();
  const [nearestStop, setNearestStop] = useState(null);
  const [catchableBuses, setCatchableBuses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userLocation || stops.length === 0) {
      setNearestStop(null);
      setCatchableBuses([]);
      return;
    }

    setLoading(true);

    // 1. Find nearest stop to user location
    let closestStop = null;
    let minDistance = Infinity;

    stops.forEach(stop => {
      const distance = getDistance(
        userLocation.lat,
        userLocation.lng,
        stop.lat,
        stop.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestStop = stop;
      }
    });

    if (!closestStop) {
      setNearestStop(null);
      setCatchableBuses([]);
      setLoading(false);
      return;
    }

    const walkTimeMin = estimateWalkingTime(minDistance);
    const stopDetails = {
      ...closestStop,
      distance: minDistance,
      walkTime: walkTimeMin
    };

    setNearestStop(stopDetails);

    // 2. Find catchable buses servicing this stop
    const stopRouteIds = closestStop.routes || [];
    const upcomingBuses = [];

    buses.forEach(bus => {
      // Must service this stop, be active, and be on a route this stop belongs to
      if (
        stopRouteIds.includes(bus.routeId) &&
        bus.status === 'active'
      ) {
        const route = routes.find(r => r._id === bus.routeId);
        if (!route) return;

        // Determine if the bus has already passed this stop
        // In our mock tracking, we can find the index of the closest stop in the route
        const stopIndexInRoute = route.stops.indexOf(closestStop._id);
        
        // Find which stop the bus is closest to currently to guess its position
        let closestStopToBusIndex = 0;
        let minBusStopDist = Infinity;

        route.stops.forEach((sid, idx) => {
          const s = stops.find(st => st._id === sid);
          if (!s) return;
          const dist = getDistance(bus.lat, bus.lng, s.lat, s.lng);
          if (dist < minBusStopDist) {
            minBusStopDist = dist;
            closestStopToBusIndex = idx;
          }
        });

        // If the stop index is equal to or greater than the bus's current stop index,
        // it is either at or heading towards the stop!
        if (stopIndexInRoute >= closestStopToBusIndex) {
          // Calculate distance from bus to stop
          const busToStopDist = getDistance(bus.lat, bus.lng, closestStop.lat, closestStop.lng);
          
          // Estimate ETA (average bus speed 25 km/h = 416 meters per minute)
          const busSpeedMetersPerMin = bus.speed > 0 ? (bus.speed * 16.6) : 400; // speed in km/h to m/min
          const etaMinutes = Math.ceil(busToStopDist / busSpeedMetersPerMin);

          // Catchable if walking time is less than or equal to bus arrival time (or within +2 mins buffer)
          const isCatchable = walkTimeMin <= etaMinutes + 2;

          upcomingBuses.push({
            ...bus,
            routeNumber: route.routeNumber,
            routeName: route.name,
            distance: busToStopDist,
            eta: etaMinutes,
            isCatchable
          });
        }
      }
    });

    // Sort by ETA ascending
    upcomingBuses.sort((a, b) => a.eta - b.eta);
    setCatchableBuses(upcomingBuses);
    setLoading(false);

  }, [userLocation, stops, routes, buses]);

  return { nearestStop, catchableBuses, loading };
}
