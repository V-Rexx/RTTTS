import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../lib/api';
import io from '../lib/socket';

const CityContext = createContext(null);

export function CityProvider({ children, slug }) {
  const [city, setCity] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRouteFilter, setActiveRouteFilter] = useState(null); // Route ID to highlight

  const fetchCityData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Get city details
      const cityRes = await api.get(`/api/cities/${slug}`);
      setCity(cityRes.data);

      // 2. Get routes for this city
      const routesRes = await api.get(`/api/routes?city=${slug}`);
      setRoutes(routesRes.data);

      // 3. Get stops for this city
      const stopsRes = await api.get(`/api/stops?city=${slug}`);
      setStops(stopsRes.data);

      // 4. Get active online buses
      const busesRes = await api.get(`/api/buses/live?city=${slug}`);
      setBuses(busesRes.data.buses || []);

      setLoading(false);
    } catch (err) {
      console.error('Failed to load city data:', err);
      setError(err.message || 'Failed to load map data');
      setLoading(false);
    }
  }, [slug]);

  // Load static data first
  useEffect(() => {
    fetchCityData();
  }, [fetchCityData]);

  // Hook up Real-time Socket events
  useEffect(() => {
    if (!slug || !city) return;

    const socket = io();

    // Subscribe to this city's real-time events
    socket.emit('subscribe-city', { citySlug: slug });

    // Handle initial state of buses
    const handleInitialState = ({ buses: initialBuses }) => {
      setBuses(initialBuses);
    };

    // Handle bus coordinates update
    const handleBusLocation = ({ busId, lat, lng, speed }) => {
      setBuses(prevBuses => 
        prevBuses.map(bus => 
          bus._id === busId 
            ? { ...bus, lat, lng, speed, status: bus.status === 'offline' ? 'active' : bus.status } 
            : bus
        )
      );
    };

    // Handle bus going online
    const handleBusOnline = (newBus) => {
      setBuses(prevBuses => {
        // If bus already exists, update it, otherwise add it
        const exists = prevBuses.some(b => b._id === newBus.busId);
        if (exists) {
          return prevBuses.map(b => b._id === newBus.busId ? { ...b, ...newBus, _id: newBus.busId, status: 'active' } : b);
        }
        return [...prevBuses, { ...newBus, _id: newBus.busId, status: 'active' }];
      });
    };

    // Handle bus going offline
    const handleBusOffline = ({ busId }) => {
      setBuses(prevBuses => prevBuses.filter(b => b._id !== busId));
    };

    // Handle bus breakdown
    const handleBusBreakdown = ({ busId, message }) => {
      setBuses(prevBuses => 
        prevBuses.map(b => 
          b._id === busId 
            ? { ...b, status: 'breakdown', speed: 0, breakdownMessage: message } 
            : b
        )
      );
    };

    // Attach listeners
    socket.on('initial-state', handleInitialState);
    socket.on('bus-location', handleBusLocation);
    socket.on('bus-online', handleBusOnline);
    socket.on('bus-offline', handleBusOffline);
    socket.on('bus-breakdown', handleBusBreakdown);

    // Sync from CRUD changes across pages - reload static structure
    const dbChannel = new BroadcastChannel('citytrack_db_sync');
    dbChannel.onmessage = () => {
      // Reload stops and routes in case they were modified by admins
      fetchCityData();
    };

    // Cleanup listeners on unmount
    return () => {
      socket.off('initial-state', handleInitialState);
      socket.off('bus-location', handleBusLocation);
      socket.off('bus-online', handleBusOnline);
      socket.off('bus-offline', handleBusOffline);
      socket.off('bus-breakdown', handleBusBreakdown);
      dbChannel.close();
    };
  }, [slug, city, fetchCityData]);

  const value = {
    city,
    routes,
    stops,
    buses,
    loading,
    error,
    activeRouteFilter,
    setActiveRouteFilter,
    refreshData: fetchCityData
  };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}
