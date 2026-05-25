import { useState, useCallback } from 'react';

export default function useGeolocation(fallbackCoords = { lat: 12.9250, lng: 77.6350 }) { // Nearby HSR / Silk Board
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Using simulated location.');
      setPosition(fallbackCoords);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        console.warn('Geolocation failed, activating simulated passenger fallback:', err.message);
        setError(`Location access: ${err.message}. Emulating passenger near Silk Board.`);
        // Fallback coordination near Silk Board / HSR
        setPosition(fallbackCoords);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [fallbackCoords]);

  return { position, error, loading, request, setPosition };
}
