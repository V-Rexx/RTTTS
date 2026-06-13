import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../../lib/api';

export default function CitySearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const results = [];

        // 1. Search inside local CityTrack database
        const cityRes = await api.get(`/api/cities?search=${query}`);
        const localCities = cityRes.data.map(city => ({
          type: 'city',
          id: city._id,
          name: `${city.name}, India`,
          slug: city.slug,
          lat: city.lat,
          lng: city.lng,
          zoom: city.zoom
        }));
        results.push(...localCities);

        // 2. Search general places via Nominatim API if query is long enough
        if (query.length > 3) {
          const nominatimUrl = import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
          const geoRes = await axios.get(`${nominatimUrl}/search`, {
            params: {
              q: query,
              format: 'json',
              addressdetails: 1,
              limit: 5,
              countrycodes: 'in' // limit search to India for context
            }
          });

          const geoPlaces = geoRes.data.map(item => ({
            type: 'place',
            id: item.place_id,
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            zoom: 15
          }));
          
          // Filter duplicates by name matching
          const filteredGeo = geoPlaces.filter(
            gp => !results.some(r => r.name.toLowerCase().split(',')[0] === gp.name.toLowerCase().split(',')[0])
          );
          results.push(...filteredGeo);
        }

        setSuggestions(results);
        setIsOpen(true);
      } catch (error) {
        console.error('Search query failed:', error);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (item) => {
    setQuery(item.name.split(',')[0]);
    setIsOpen(false);
    onSelect(item);
  };

  return (
    <div ref={dropdownRef} className="relative w-full max-w-md z-[2000]">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your city (e.g. Bangalore, Mumbai)..."
          className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 pr-12 text-gray-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-gray-400 transition"
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
          {loading ? (
            <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          ) : (
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-200 backdrop-blur-md animate-fade-in z-[3000]">
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-5 py-4 hover:bg-slate-50 transition flex items-start gap-3 outline-none"
            >
              <span className="mt-1 flex-shrink-0">
                {item.type === 'city' ? (
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </span>
              <div className="flex flex-col gap-0.5">
  <span className="text-sm font-semibold text-slate-800">
    {item.name.split(',')[0]}
  </span>

  <span className="text-xs text-slate-500 truncate max-w-[340px]">
    {item.name.split(',').slice(1).join(',').trim()}
  </span>
</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
