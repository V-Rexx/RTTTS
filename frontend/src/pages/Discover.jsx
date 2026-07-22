import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function Discover() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const name = params.get('name') || 'this city';
  const lat = parseFloat(params.get('lat'));
  const lng = parseFloat(params.get('lng'));
  const validCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="relative w-screen h-screen">
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-2xl shadow-lg border border-gray-200 px-5 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-slate-700 transition"
          aria-label="Back"
        >
          &larr;
        </button>
        <div className="text-sm font-semibold text-slate-900">{name.split(',')[0]}</div>
      </header>

      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg max-w-md text-center">
        CityTrack isn't live in {name.split(',')[0]} yet — no buses are being tracked here.
      </div>

      {validCoords ? (
        <MapContainer center={[lat, lng]} zoom={13} zoomControl={false} className="w-full h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[lat, lng]} />
        </MapContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-500">
          No location coordinates provided.
        </div>
      )}
    </div>
  );
}
