import React from 'react';
import { useNavigate } from 'react-router-dom';
import CitySearch from '../components/Search/CitySearch';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleCitySelect = (item) => {
    if (item.type === 'city') {
      navigate(`/city/${item.slug}`);
    } else {
      navigate(`/city/bangalore?lat=${item.lat}&lng=${item.lng}&zoom=${item.zoom}`);
    }
  };

  const quickCities = [
    {
      name: 'Bangalore',
      slug: 'bangalore',
      description: 'Live routes and real-time tracking'
    },
    {
      name: 'Mumbai',
      slug: 'mumbai',
      description: 'Explore city transit network'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col">
      {/* Header */}
      <header className="bg-[#F1EEE8] border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              CT
            </div>

            <div>
              <h1 className="font-bold text-slate-900 text-lg">
                CityTrack
              </h1>
              <p className="text-xs text-slate-600">
                Smart Public Transport
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white border border-slate-900 hover:bg-slate-800 transition"
          >
            Staff Login
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
              Live Bus Tracking
            </span>

            <h1 className="mt-6 text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Track buses in
              <br />
              real time
            </h1>

            <p className="mt-6 text-lg text-gray-600">
              Search a city, view routes, find nearby stops,
              and monitor buses live on the map.
            </p>
          </div>

          {/* Search */}
          <div className="mt-12 flex justify-center">
            <CitySearch onSelect={handleCitySelect} />
          </div>

          {/* Quick Cities */}
          <div className="mt-16">
            <h2 className="text-center text-xl font-semibold text-gray-800 mb-8">
              Popular Cities
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {quickCities.map((city) => (
                <button
                  key={city.slug}
                  onClick={() => navigate(`/city/${city.slug}`)}
                  className="bg-white border border-gray-200 rounded-3xl p-6 text-left hover:shadow-lg transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {city.name}
                  </h3>

                  <p className="text-sm text-gray-500 mt-2">
                    {city.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <div className="bg-white rounded-3xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Live Tracking
              </h3>
              <p className="text-gray-600 text-sm">
                View bus locations on an interactive map.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Nearby Stops
              </h3>
              <p className="text-gray-600 text-sm">
                Find the nearest bus stop from your location.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Route Information
              </h3>
              <p className="text-gray-600 text-sm">
                Explore routes, buses, and transit details.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-5 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} CityTrack
      </footer>
    </div>
  );
}