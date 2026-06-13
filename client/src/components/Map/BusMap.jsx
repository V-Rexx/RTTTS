import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useCity } from '../../context/CityContext';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet icons
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

// Map Controller Sub-component to coordinate external AI chatbot events
function MapController({ center }) {
  const map = useMap();
  const { stops, routes, setActiveRouteFilter } = useCity();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  useEffect(() => {
    const handleMapAction = (e) => {
      const { type, value } = e.detail;
      console.log('MapController executing action:', type, value);

      if (type === 'zoom_to') {
        // Find stop coordinates or city coordinates
        const foundStop = stops.find(s => s.name.toLowerCase().includes(value.toLowerCase()));
        if (foundStop) {
          map.flyTo([foundStop.lat, foundStop.lng], 14, { duration: 2 });
        }
      }

      if (type === 'show_stop') {
        const foundStop = stops.find(s => s.name.toLowerCase().includes(value.toLowerCase()));
        if (foundStop) {
          map.flyTo([foundStop.lat, foundStop.lng], 15, { duration: 2 });
          // Highlight and open stop popup
          setTimeout(() => {
            map.eachLayer((layer) => {
              if (layer instanceof L.Marker) {
                const latLng = layer.getLatLng();
                if (Math.abs(latLng.lat - foundStop.lat) < 0.0001 && Math.abs(latLng.lng - foundStop.lng) < 0.0001) {
                  layer.openPopup();
                }
              }
            });
          }, 2100);
        }
      }

      if (type === 'highlight_route') {
        const foundRoute = routes.find(
          r => r.routeNumber.toLowerCase() === value.toLowerCase() || 
               r.name.toLowerCase().includes(value.toLowerCase())
        );
        if (foundRoute) {
          setActiveRouteFilter(foundRoute._id);
          // Highlight route visually by flying to fit its bounding box
          const routeStops = foundRoute.stops
            .map(sid => stops.find(s => s._id === sid))
            .filter(Boolean);
          if (routeStops.length > 0) {
            const bounds = L.latLngBounds(routeStops.map(s => [s.lat, s.lng]));
            map.flyToBounds(bounds, { padding: [50, 50], duration: 2 });
          }
        }
      }
    };

    window.addEventListener('citytrack_map_action', handleMapAction);
    return () => window.removeEventListener('citytrack_map_action', handleMapAction);
  }, [map, stops, routes, setActiveRouteFilter]);

  return null;
}

export default function BusMap({ cityCenter, zoom = 13, children }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      <MapContainer
        center={cityCenter}
        zoom={zoom}
        zoomControl={false}
        className="w-full h-full"
      >
        {/* Leaflet Dark Theme filter overrides on tiles layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Render Map controller hook */}
        <MapController center={cityCenter} />

        {children}
      </MapContainer>
    </div>
  );
}
export { BusMap };
