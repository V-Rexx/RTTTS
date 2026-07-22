import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const NOMINATIM_TYPES = ['city', 'town', 'administrative', 'village'];

export default function Landing() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeResults, setActiveResults] = useState([]);
  const [discoverResults, setDiscoverResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [quickCities, setQuickCities] = useState([]);

  useEffect(() => {
    api
      .get('/api/cities')
      .then((res) => setQuickCities(res.data))
      .catch(() => setQuickCities([]));
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setActiveResults([]);
      setDiscoverResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const activeRes = await api.get(`/api/cities?search=${encodeURIComponent(trimmed)}`);
        setActiveResults(activeRes.data);

        if (trimmed.length >= 2) {
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&featureType=city&limit=5`
          );
          const nomData = await nomRes.json();

          const activeNames = new Set(activeRes.data.map((c) => c.name.toLowerCase()));
          const filtered = nomData
            .filter((place) => NOMINATIM_TYPES.includes(place.type))
            .filter((place) => !activeNames.has(place.display_name.split(',')[0].trim().toLowerCase()));

          setDiscoverResults(filtered);
        } else {
          setDiscoverResults([]);
        }
      } catch {
        setActiveResults([]);
        setDiscoverResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const goToActiveCity = (city) => navigate(`/city/${city.slug}`);

  const goToDiscoverCity = (place) => {
    const name = place.display_name.split(',')[0].trim();
    navigate(`/discover?name=${encodeURIComponent(name)}&lat=${place.lat}&lng=${place.lon}`);
  };

  const hasResults = activeResults.length > 0 || discoverResults.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              CT
            </div>
            <div>
              <div className="font-semibold text-slate-900 leading-tight">CityTrack</div>
              <div className="text-xs text-slate-500">Real-time city bus tracking</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
          >
            Staff Login
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 text-center">Track buses in real time</h1>
        <p className="text-slate-500 text-center mt-2">Search any city to see live routes and buses.</p>

        <div className="mt-8 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a city..."
            className="w-full px-5 py-4 rounded-2xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />

          {query.trim() && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-h-80 overflow-y-auto z-10">
              {searching && !hasResults && (
                <div className="px-5 py-4 text-sm text-slate-400">Searching...</div>
              )}

              {!searching && !hasResults && (
                <div className="px-5 py-4 text-sm text-slate-400">No cities found.</div>
              )}

              {activeResults.map((city) => (
                <button
                  key={city._id}
                  onClick={() => goToActiveCity(city)}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm font-medium text-slate-800">{city.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    Live
                  </span>
                </button>
              ))}

              {discoverResults.map((place) => (
                <button
                  key={place.place_id}
                  onClick={() => goToDiscoverCity(place)}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {place.display_name}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-slate-200 text-slate-600 flex-shrink-0">
                    Not live yet
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-14">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide text-center">
            Popular Cities
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {quickCities.map((city) => (
              <button
                key={city._id}
                onClick={() => goToActiveCity(city)}
                className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{city.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Live routes and real-time tracking</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
