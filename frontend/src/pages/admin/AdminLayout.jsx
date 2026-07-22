import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminCityProvider } from '../../context/AdminCityContext';

const NAV_ITEMS = [
  { to: '/admin/fleet', label: 'Fleet' },
  { to: '/admin/cities', label: 'Cities' },
  { to: '/admin/routes', label: 'Routes' },
  { to: '/admin/stops', label: 'Stops' },
  { to: '/admin/buses', label: 'Buses' },
  { to: '/admin/drivers', label: 'Drivers' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              CT
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-tight">CityTrack</div>
              <div className="text-[10px] text-slate-500">Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="px-3 text-xs text-slate-500 truncate mb-2">{user?.name}</div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <AdminCityProvider>
          <Outlet />
        </AdminCityProvider>
      </main>
    </div>
  );
}
