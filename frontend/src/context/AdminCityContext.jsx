import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AdminCityContext = createContext(null);

// Shared across Stops/Routes/Buses admin pages so switching between them
// doesn't reset which city you're working in.
export function AdminCityProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [citySlug, setCitySlug] = useState('');
  const [loading, setLoading] = useState(true);

  const refreshCities = () => {
    return api.get('/api/cities').then((res) => {
      setCities(res.data);
      setCitySlug((prev) => (prev && res.data.some((c) => c.slug === prev) ? prev : res.data[0]?.slug || ''));
      return res.data;
    });
  };

  useEffect(() => {
    refreshCities().finally(() => setLoading(false));
  }, []);

  return (
    <AdminCityContext.Provider value={{ cities, citySlug, setCitySlug, loading, refreshCities }}>
      {children}
    </AdminCityContext.Provider>
  );
}

export function useAdminCity() {
  const ctx = useContext(AdminCityContext);
  if (!ctx) throw new Error('useAdminCity must be used within an AdminCityProvider');
  return ctx;
}
