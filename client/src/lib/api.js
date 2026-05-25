import axios from 'axios';

// Initialize the mock database in localStorage
const DB_VERSION = 'v2';
const KEY_PREFIX = `citytrack_${DB_VERSION}_`;

const KEYS = {
  CITIES: `${KEY_PREFIX}cities`,
  ROUTES: `${KEY_PREFIX}routes`,
  STOPS: `${KEY_PREFIX}stops`,
  BUSES: `${KEY_PREFIX}buses`,
  DRIVERS: `${KEY_PREFIX}drivers`,
  CURRENT_USER: `${KEY_PREFIX}current_user`,
};

// Default high-fidelity seed data with Bangalore, Mumbai, and Jorhat (Assam)
const SEED_DATA = {
  CITIES: [
    { _id: 'c1', name: 'Bangalore', slug: 'bangalore', lat: 12.9716, lng: 77.5946, zoom: 12 },
    { _id: 'c2', name: 'Mumbai', slug: 'mumbai', lat: 18.9220, lng: 72.8347, zoom: 12 },
    { _id: 'c3', name: 'Jorhat', slug: 'jorhat', lat: 26.7509, lng: 94.2037, zoom: 13 }
  ],
  STOPS: [
    // Bangalore Stops (Silk Board to KR Puram - Route 500C)
    { _id: 's1', name: 'Silk Board', lat: 12.9176, lng: 77.6244, city: 'bangalore', routes: ['r1'] },
    { _id: 's2', name: 'HSR Layout', lat: 12.9116, lng: 77.6388, city: 'bangalore', routes: ['r1'] },
    { _id: 's3', name: 'Bellandur', lat: 12.9304, lng: 77.6784, city: 'bangalore', routes: ['r1'] },
    { _id: 's4', name: 'Marathahalli', lat: 12.9562, lng: 77.7011, city: 'bangalore', routes: ['r1', 'r2'] },
    { _id: 's5', name: 'KR Puram', lat: 13.0040, lng: 77.6980, city: 'bangalore', routes: ['r1'] },
    
    // Bangalore Stops (Majestic to Indiranagar - Route G-3)
    { _id: 's6', name: 'Majestic', lat: 12.9779, lng: 77.5724, city: 'bangalore', routes: ['r2', 'r3'] },
    { _id: 's7', name: 'Corporation', lat: 12.9698, lng: 77.5898, city: 'bangalore', routes: ['r2'] },
    { _id: 's8', name: 'Richmond Circle', lat: 12.9644, lng: 77.5964, city: 'bangalore', routes: ['r2'] },
    { _id: 's9', name: 'Domlur', lat: 12.9625, lng: 77.6382, city: 'bangalore', routes: ['r2'] },
    { _id: 's10', name: 'Indiranagar', lat: 12.9784, lng: 77.6408, city: 'bangalore', routes: ['r2'] },
    
    // Bangalore Stops (Majestic to Bannerghatta - Route 365)
    { _id: 's11', name: 'Kalasipalya', lat: 12.9610, lng: 77.5740, city: 'bangalore', routes: ['r3'] },
    { _id: 's12', name: 'Dairy Circle', lat: 12.9428, lng: 77.5976, city: 'bangalore', routes: ['r3'] },
    { _id: 's13', name: 'JP Nagar', lat: 12.9063, lng: 77.5857, city: 'bangalore', routes: ['r3'] },
    { _id: 's14', name: 'Bannerghatta', lat: 12.8340, lng: 77.5760, city: 'bangalore', routes: ['r3'] },

    // Mumbai Stops (Colaba to CSMT - Route 101)
    { _id: 's30', name: 'Colaba Terminal', lat: 18.9067, lng: 72.8147, city: 'mumbai', routes: ['r30'] },
    { _id: 's31', name: 'Gateway of India', lat: 18.9220, lng: 72.8347, city: 'mumbai', routes: ['r30'] },
    { _id: 's32', name: 'Marine Drive', lat: 18.9430, lng: 72.8230, city: 'mumbai', routes: ['r30'] },
    { _id: 's33', name: 'CSMT Station', lat: 18.9400, lng: 72.8355, city: 'mumbai', routes: ['r30'] },

    // Jorhat Stops (ISBT to Rowriah Airport - Route 1A)
    { _id: 's20', name: 'ISBT Jorhat', lat: 26.7645, lng: 94.1830, city: 'jorhat', routes: ['r10'] },
    { _id: 's21', name: 'Baruah Chariali', lat: 26.7570, lng: 94.2045, city: 'jorhat', routes: ['r10'] },
    { _id: 's22', name: 'Jorhat Court', lat: 26.7594, lng: 94.2120, city: 'jorhat', routes: ['r10'] },
    { _id: 's23', name: 'Rowriah Airport', lat: 26.7324, lng: 94.1756, city: 'jorhat', routes: ['r10'] },

    // Jorhat Stops (Jorhat Junction to Cinnamara - Route 2B)
    { _id: 's24', name: 'Jorhat Junction', lat: 26.7450, lng: 94.2250, city: 'jorhat', routes: ['r11'] },
    { _id: 's25', name: 'Gar-Ali', lat: 26.7550, lng: 94.2070, city: 'jorhat', routes: ['r11'] },
    { _id: 's26', name: 'Cinnamara Tea Estate', lat: 26.7150, lng: 94.2180, city: 'jorhat', routes: ['r11'] }
  ],
  ROUTES: [
    { _id: 'r1', routeNumber: '500C', name: 'Silk Board - KR Puram', color: '#4F46E5', city: 'bangalore', stops: ['s1', 's2', 's3', 's4', 's5'] },
    { _id: 'r2', routeNumber: 'G-3', name: 'Majestic - Indiranagar', color: '#10B981', city: 'bangalore', stops: ['s6', 's7', 's8', 's9', 's10', 's4'] },
    { _id: 'r3', routeNumber: '365', name: 'Majestic - Bannerghatta National Park', color: '#EF4444', city: 'bangalore', stops: ['s6', 's11', 's12', 's13', 's14'] },
    
    // Mumbai Routes
    { _id: 'r30', routeNumber: '101', name: 'Colaba - CSMT Hub', color: '#EF4444', city: 'mumbai', stops: ['s30', 's31', 's32', 's33'] },

    // Jorhat Routes
    { _id: 'r10', routeNumber: '1A', name: 'ISBT - Rowriah Airport', color: '#4F46E5', city: 'jorhat', stops: ['s20', 's21', 's22', 's23'] },
    { _id: 'r11', routeNumber: '2B', name: 'Jorhat Junction - Cinnamara', color: '#10B981', city: 'jorhat', stops: ['s24', 's25', 's26'] }
  ],
  DRIVERS: [
    { _id: 'd1', name: 'Rahul Kumar', email: 'driver1@citytrack.com', role: 'driver', avatarColor: '#FF6B6B', password: 'password' },
    { _id: 'd2', name: 'Amit Sharma', email: 'driver2@citytrack.com', role: 'driver', avatarColor: '#4DABF7', password: 'password' },
    { _id: 'd3', name: 'Sneha Patel', email: 'driver3@citytrack.com', role: 'driver', avatarColor: '#51CF66', password: 'password' }
  ],
  BUSES: [
    { _id: 'b1', busNumber: 'KA-01-F-1234', plateNumber: 'KA-01-F-1234', routeId: 'r1', city: 'bangalore', driverId: 'd1', status: 'offline', lat: 12.9176, lng: 77.6244, speed: 0 },
    { _id: 'b2', busNumber: 'KA-01-G-5678', plateNumber: 'KA-01-G-5678', routeId: 'r2', city: 'bangalore', driverId: 'd2', status: 'offline', lat: 12.9779, lng: 77.5724, speed: 0 },
    { _id: 'b3', busNumber: 'KA-01-H-9012', plateNumber: 'KA-01-H-9012', routeId: 'r3', city: 'bangalore', driverId: 'd3', status: 'offline', lat: 12.9779, lng: 77.5724, speed: 0 },
    
    // Mumbai Fleet Bus
    { _id: 'b30', busNumber: 'MH-01-A-9999', plateNumber: 'MH-01-A-9999', routeId: 'r30', city: 'mumbai', driverId: 'd2', status: 'offline', lat: 18.9067, lng: 72.8147, speed: 0 },

    // Jorhat Fleet Bus
    { _id: 'b10', busNumber: 'AS-03-A-1122', plateNumber: 'AS-03-A-1122', routeId: 'r10', city: 'jorhat', driverId: 'd1', status: 'offline', lat: 26.7645, lng: 94.1830, speed: 0 }
  ]
};

// Seed utility
const getStorageItem = (key, defaultValue) => {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(item);
};

const setStorageItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  // Broadcast updates to other tabs for live sync
  const channel = new BroadcastChannel('citytrack_db_sync');
  channel.postMessage({ key, value });
};

// Listen for updates from other tabs
const syncChannel = new BroadcastChannel('citytrack_db_sync');
syncChannel.onmessage = (event) => {
  const { key, value } = event.data;
  localStorage.setItem(key, JSON.stringify(value));
};

// Core DB Accessors
export const getCitiesFromDb = () => getStorageItem(KEYS.CITIES, SEED_DATA.CITIES);
export const getRoutesFromDb = () => getStorageItem(KEYS.ROUTES, SEED_DATA.ROUTES);
export const getStopsFromDb = () => getStorageItem(KEYS.STOPS, SEED_DATA.STOPS);
export const getBusesFromDb = () => getStorageItem(KEYS.BUSES, SEED_DATA.BUSES);
export const getDriversFromDb = () => getStorageItem(KEYS.DRIVERS, SEED_DATA.DRIVERS);

export const saveCitiesToDb = (data) => setStorageItem(KEYS.CITIES, data);
export const saveRoutesToDb = (data) => setStorageItem(KEYS.ROUTES, data);
export const saveStopsToDb = (data) => setStorageItem(KEYS.STOPS, data);
export const saveBusesToDb = (data) => setStorageItem(KEYS.BUSES, data);
export const saveDriversToDb = (data) => setStorageItem(KEYS.DRIVERS, data);

// Initial Seed Trigger
getCitiesFromDb();
getRoutesFromDb();
getStopsFromDb();
getBusesFromDb();
getDriversFromDb();

// Create standard Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // to support session cookies refresh
});

// Dynamic Toggle: Mock Interceptor / Adapter implementation is ONLY enabled if VITE_USE_MOCK !== 'false'
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

if (useMock) {
  console.log('🔌 CityTrack client running in Standalone Sandbox emulated mode.');

  api.defaults.adapter = async function (config) {
    const { url, method, data, params, headers } = config;
    const requestData = data ? JSON.parse(data) : null;
    
    // Core Fix: Standardize Query Parameter Parsing for URLs containing explicit query strings
    const urlObj = new URL(url, 'http://localhost');
    const path = urlObj.pathname.replace(/^\/api/, '');
    const queryParams = Object.fromEntries(urlObj.searchParams.entries());

    // Merge all possible query sources
    const allParams = {
      ...config.params,
      ...params,
      ...queryParams
    };

    // Helper responses
    const jsonResponse = (body, status = 200) => {
      return Promise.resolve({
        data: body,
        status,
        statusText: status === 200 ? 'OK' : 'Created',
        headers: {},
        config,
      });
    };

    const errorResponse = (message, status = 400) => {
      return Promise.reject({
        response: {
          data: { message },
          status,
          statusText: 'Error',
        },
      });
    };

    // Auth token check
    const getAuthUser = () => {
      const authHeader = headers['Authorization'] || config.headers['Authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
      const token = authHeader.split(' ')[1];
      
      // Check drivers
      const drivers = getDriversFromDb();
      const foundDriver = drivers.find(d => d._id === token);
      if (foundDriver) return foundDriver;

      // Check admin
      if (token === 'admin-token') {
        return { _id: 'admin_user', name: 'Admin', email: 'admin@citytrack.com', role: 'admin', avatarColor: '#4F46E5' };
      }
      return null;
    };

    try {
      // 1. AUTH FLOWS
      if (path === '/auth/login' && method === 'post') {
        const { email, password } = requestData;
        
        // Admin check
        if (email === 'admin@citytrack.com' && password === 'admin123') {
          const user = { _id: 'admin_user', name: 'Fleet Administrator', email: 'admin@citytrack.com', role: 'admin', avatarColor: '#4F46E5' };
          localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
          return jsonResponse({ user, accessToken: 'admin-token' });
        }

        // Driver check
        const drivers = getDriversFromDb();
        const driver = drivers.find(d => d.email === email && d.password === password);
        if (driver) {
          const user = { _id: driver._id, name: driver.name, email: driver.email, role: 'driver', avatarColor: driver.avatarColor };
          localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
          return jsonResponse({ user, accessToken: driver._id });
        }

        return errorResponse('Invalid email or password', 401);
      }

      if (path === '/auth/me' && method === 'get') {
        const user = getAuthUser();
        if (!user) return errorResponse('Unauthorized', 401);
        return jsonResponse({ user });
      }

      if (path === '/auth/logout' && method === 'post') {
        localStorage.removeItem(KEYS.CURRENT_USER);
        return jsonResponse({ message: 'Logged out successfully' });
      }

      if (path === '/auth/refresh' && method === 'post') {
        const currentUser = JSON.parse(localStorage.getItem(KEYS.CURRENT_USER));
        if (!currentUser) return errorResponse('Session expired', 401);
        const token = currentUser.role === 'admin' ? 'admin-token' : currentUser._id;
        return jsonResponse({ accessToken: token });
      }

      // 2. CITIES CRUD
      if (path === '/cities' && method === 'get') {
        const cities = getCitiesFromDb();
        const search = allParams.search;
        if (search) {
          const filtered = cities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
          return jsonResponse(filtered);
        }
        return jsonResponse(cities);
      }

      if (path.startsWith('/cities/') && method === 'get') {
        const slug = path.split('/')[2];
        const cities = getCitiesFromDb();
        const city = cities.find(c => c.slug === slug || c._id === slug);
        if (!city) return errorResponse('City not found', 404);
        return jsonResponse(city);
      }

      if (path === '/cities' && method === 'post') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const cities = getCitiesFromDb();
        const newCity = {
          _id: 'c_' + Math.random().toString(36).substr(2, 9),
          ...requestData,
          slug: requestData.name.toLowerCase().replace(/ /g, '-'),
        };
        cities.push(newCity);
        saveCitiesToDb(cities);
        return jsonResponse(newCity, 201);
      }

      if (path.startsWith('/cities/') && method === 'put') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const id = path.split('/')[2];
        const cities = getCitiesFromDb();
        const index = cities.findIndex(c => c._id === id);
        if (index === -1) return errorResponse('City not found', 404);
        cities[index] = { ...cities[index], ...requestData };
        saveCitiesToDb(cities);
        return jsonResponse(cities[index]);
      }

      if (path.startsWith('/cities/') && method === 'delete') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const id = path.split('/')[2];
        let cities = getCitiesFromDb();
        cities = cities.filter(c => c._id !== id);
        saveCitiesToDb(cities);
        return jsonResponse({ message: 'Deleted successfully' });
      }

      // 3. ROUTES CRUD
      if (path === '/routes' && method === 'get') {
        const routes = getRoutesFromDb();
        const city = allParams.city;
        if (city) {
          const filtered = routes.filter(r => r.city === city);
          return jsonResponse(filtered);
        }
        return jsonResponse(routes);
      }

      if (path === '/routes' && method === 'post') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const routes = getRoutesFromDb();
        const newRoute = {
          _id: 'r_' + Math.random().toString(36).substr(2, 9),
          ...requestData,
        };
        routes.push(newRoute);
        saveRoutesToDb(routes);

        // Sync Stops with this new route
        let stops = getStopsFromDb();
        stops = stops.map(s => {
          if (newRoute.stops.includes(s._id) && !s.routes.includes(newRoute._id)) {
            return { ...s, routes: [...s.routes, newRoute._id] };
          }
          return s;
        });
        saveStopsToDb(stops);

        return jsonResponse(newRoute, 201);
      }

      if (path.startsWith('/routes/') && method === 'put') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const id = path.split('/')[2];
        const routes = getRoutesFromDb();
        const index = routes.findIndex(r => r._id === id);
        if (index === -1) return errorResponse('Route not found', 404);
        
        const oldStops = routes[index].stops;
        routes[index] = { ...routes[index], ...requestData };
        saveRoutesToDb(routes);

        // Update Stops references
        let stops = getStopsFromDb();
        stops = stops.map(s => {
          // Removed from route
          if (oldStops.includes(s._id) && !requestData.stops.includes(s._id)) {
            return { ...s, routes: s.routes.filter(rid => rid !== id) };
          }
          // Added to route
          if (requestData.stops.includes(s._id) && !s.routes.includes(id)) {
            return { ...s, routes: [...s.routes, id] };
          }
          return s;
        });
        saveStopsToDb(stops);

        return jsonResponse(routes[index]);
      }

      if (path.startsWith('/routes/') && method === 'delete') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const id = path.split('/')[2];
        let routes = getRoutesFromDb();
        routes = routes.filter(r => r._id !== id);
        saveRoutesToDb(routes);

        // Clean up references in stops
        let stops = getStopsFromDb();
        stops = stops.map(s => ({ ...s, routes: s.routes.filter(rid => rid !== id) }));
        saveStopsToDb(stops);

        return jsonResponse({ message: 'Route deleted successfully' });
      }

      // 4. STOPS CRUD
      if (path === '/stops' && method === 'get') {
        const stops = getStopsFromDb();
        const city = allParams.city;
        if (city) {
          const filtered = stops.filter(s => s.city === city);
          return jsonResponse(filtered);
        }
        return jsonResponse(stops);
      }

      if (path === '/stops/nearest' && method === 'get') {
        const lat = parseFloat(allParams.lat);
        const lng = parseFloat(allParams.lng);
        if (isNaN(lat) || isNaN(lng)) return errorResponse('Invalid coordinates', 400);

        const stops = getStopsFromDb();
        // Calculate distances manually (Haversine math)
        const stopsWithDist = stops.map(s => {
          const R = 6371e3;
          const phi1 = (lat * Math.PI) / 180;
          const phi2 = (s.lat * Math.PI) / 180;
          const deltaPhi = ((s.lat - lat) * Math.PI) / 180;
          const deltaLambda = ((s.lng - lng) * Math.PI) / 180;

          const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
                    Math.cos(phi1) * Math.cos(phi2) *
                    Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          return { ...s, distance };
        });

        stopsWithDist.sort((a, b) => a.distance - b.distance);
        return jsonResponse(stopsWithDist.slice(0, 5)); // Nearest 5 stops
      }

      if (path === '/stops' && method === 'post') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const stops = getStopsFromDb();
        const newStop = {
          _id: 's_' + Math.random().toString(36).substr(2, 9),
          ...requestData,
          routes: requestData.routes || []
        };
        stops.push(newStop);
        saveStopsToDb(stops);

        // If assigned to routes, update those routes
        if (newStop.routes.length > 0) {
          let routes = getRoutesFromDb();
          routes = routes.map(r => {
            if (newStop.routes.includes(r._id) && !r.stops.includes(newStop._id)) {
              return { ...r, stops: [...r.stops, newStop._id] };
            }
            return r;
          });
          saveRoutesToDb(routes);
        }

        return jsonResponse(newStop, 201);
      }

      if (path.startsWith('/stops/') && method === 'put') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const id = path.split('/')[2];
        const stops = getStopsFromDb();
        const index = stops.findIndex(s => s._id === id);
        if (index === -1) return errorResponse('Stop not found', 404);

        stops[index] = { ...stops[index], ...requestData };
        saveStopsToDb(stops);
        return jsonResponse(stops[index]);
      }

      if (path.startsWith('/stops/') && method === 'delete') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const id = path.split('/')[2];
        let stops = getStopsFromDb();
        stops = stops.filter(s => s._id !== id);
        saveStopsToDb(stops);

        // Clean up references inside routes
        let routes = getRoutesFromDb();
        routes = routes.map(r => ({ ...r, stops: r.stops.filter(sid => sid !== id) }));
        saveRoutesToDb(routes);

        return jsonResponse({ message: 'Stop deleted successfully' });
      }

      // 5. BUSES CRUD & LOCATION FEEDBACK
      if (path === '/buses' && method === 'get') {
        const buses = getBusesFromDb();
        const driverFilter = allParams.driver;
        const city = allParams.city;

        if (driverFilter === 'me') {
          const user = getAuthUser();
          if (!user) return errorResponse('Unauthorized', 401);
          const filtered = buses.filter(b => b.driverId === user._id);
          return jsonResponse(filtered);
        }

        let filtered = buses;
        if (city) {
          filtered = filtered.filter(b => b.city === city);
        }
        return jsonResponse(filtered);
      }

      if (path === '/buses/live' && method === 'get') {
        const buses = getBusesFromDb();
        const city = allParams.city;
        let activeBuses = buses.filter(b => b.status === 'active' || b.status === 'breakdown');
        if (city) {
          activeBuses = activeBuses.filter(b => b.city === city);
        }
        return jsonResponse({ buses: activeBuses });
      }

      if (path === '/buses' && method === 'post') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const buses = getBusesFromDb();
        const newBus = {
          _id: 'b_' + Math.random().toString(36).substr(2, 9),
          status: 'offline',
          lat: 12.9716,
          lng: 77.5946,
          speed: 0,
          ...requestData,
        };
        buses.push(newBus);
        saveBusesToDb(buses);
        return jsonResponse(newBus, 201);
      }

      if (path.startsWith('/buses/') && method === 'put') {
        const id = path.split('/')[2];
        const buses = getBusesFromDb();
        const index = buses.findIndex(b => b._id === id);
        if (index === -1) return errorResponse('Bus not found', 404);

        buses[index] = { ...buses[index], ...requestData };
        saveBusesToDb(buses);
        return jsonResponse(buses[index]);
      }

      if (path.startsWith('/buses/') && method === 'delete') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const id = path.split('/')[2];
        let buses = getBusesFromDb();
        buses = buses.filter(b => b._id !== id);
        saveBusesToDb(buses);
        return jsonResponse({ message: 'Bus deleted successfully' });
      }

      if (path === '/buses/location' && method === 'post') {
        const user = getAuthUser();
        if (!user) return errorResponse('Unauthorized', 401);
        const { busId, lat, lng, speed } = requestData;

        const buses = getBusesFromDb();
        const index = buses.findIndex(b => b._id === busId);
        if (index === -1) return errorResponse('Bus not found', 404);

        buses[index] = {
          ...buses[index],
          lat,
          lng,
          speed,
          lastSync: new Date().toISOString()
        };
        saveBusesToDb(buses);

        // Broadcast changes on our cross-tab Socket Emulator
        const socketBroadcast = new BroadcastChannel('citytrack_socket_channel');
        socketBroadcast.postMessage({
          event: 'bus-location',
          payload: { busId, lat, lng, speed }
        });

        return jsonResponse({ success: true });
      }

      // 6. DRIVER CRUD
      if (path === '/drivers' && method === 'get') {
        const drivers = getDriversFromDb();
        const safeDrivers = drivers.map(({ password, ...rest }) => rest);
        return jsonResponse(safeDrivers);
      }

      if (path === '/drivers' && method === 'post') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const drivers = getDriversFromDb();
        
        const newDriver = {
          _id: 'd_' + Math.random().toString(36).substr(2, 9),
          role: 'driver',
          avatarColor: ['#FF6B6B', '#4DABF7', '#51CF66', '#FCC419', '#FF922B', '#E599F7'][Math.floor(Math.random() * 6)],
          password: requestData.password || 'password123',
          ...requestData,
        };
        
        drivers.push(newDriver);
        saveDriversToDb(drivers);
        
        const { password, ...safeDriver } = newDriver;
        return jsonResponse(safeDriver, 201);
      }

      if (path.startsWith('/drivers/') && method === 'delete') {
        const user = getAuthUser();
        if (!user || user.role !== 'admin') return errorResponse('Admin required', 403);
        const id = path.split('/')[2];
        let drivers = getDriversFromDb();
        drivers = drivers.filter(d => d._id !== id);
        saveDriversToDb(drivers);
        return jsonResponse({ message: 'Driver deleted successfully' });
      }

      // 7. AI CHATBOT INTEGRATION (DYNAMIC PER-CITY CONFIGS)
      if (path === '/chat' && method === 'post') {
        const { message, citySlug, history } = requestData;
        
        const stops = getStopsFromDb().filter(s => s.city === citySlug);
        const routes = getRoutesFromDb().filter(r => r.city === citySlug);
        const buses = getBusesFromDb().filter(b => b.city === citySlug && b.status === 'active');
        
        let reply = "";
        let actionToken = "";
        const msgLower = message.toLowerCase();

        // ─── Mumbai Specific Conversational Logic ─────────────────────────
        if (citySlug === 'mumbai') {
          if (msgLower.includes('airport') || msgLower.includes('flight') || msgLower.includes('csmt')) {
            reply = `To get to **CSMT Station** in Mumbai, catch **Route 101** starting from Colaba Terminal. It travels through Gateway of India and Marine Drive, ending at CSMT Station. A live fleet bus **MH-01-A-9999** is currently registered on this route.`;
            actionToken = "\nACTION: show_stop:CSMT Station\nACTION: highlight_route:101";
          } else if (msgLower.includes('nearest') || msgLower.includes('close')) {
            reply = `Let's scan stops around you in Mumbai. Opening the Nearest Bus finder overlay now to calculate distance and list servicing routes.`;
            actionToken = "\nACTION: find_nearest_bus";
          } else if (msgLower.includes('gateway') || msgLower.includes('marine')) {
            reply = `For **Gateway of India** or **Marine Drive**, take **Route 101** which SERVICES Colaba Terminal, Gateway, Marine Drive, and CSMT. I am zooming the map to Gateway of India and highlighting the line.`;
            actionToken = "\nACTION: show_stop:Gateway of India\nACTION: highlight_route:101";
          } else {
            reply = `Welcome to Mumbai AI Transit Console! I see Route 101 active with ${stops.length} major stops and ${buses.length} online vehicles (MH-01-A-9999). 

Try asking:
- "How do I get to CSMT?"
- "Where is Gateway of India?"
- "Is there a bus near me?"`;
          }
        }
        // ─── Jorhat Specific Conversational Logic ─────────────────────────
        else if (citySlug === 'jorhat') {
          if (msgLower.includes('airport') || msgLower.includes('flight') || msgLower.includes('rowriah')) {
            reply = `To get to **Rowriah Airport** in Jorhat, you should catch **Route 1A** starting from ISBT Jorhat. Route 1A stops at Baruah Chariali and Jorhat Court on its way to Rowriah Airport. There is currently an active fleet bus **AS-03-A-1122** running on Route 1A!`;
            actionToken = "\nACTION: zoom_to:Baruah Chariali\nACTION: highlight_route:1A";
          } else if (msgLower.includes('nearest') || msgLower.includes('close')) {
            reply = `Let's find the nearest stop around you in Jorhat. I am opening the Nearest Bus telemetry panel to compute distance calculations and catchable routes.`;
            actionToken = "\nACTION: find_nearest_bus";
          } else if (msgLower.includes('junction') || msgLower.includes('station') || msgLower.includes('cinnamara')) {
            reply = `For **Jorhat Junction** or **Cinnamara Tea Estate**, you should take **Route 2B** which connects Jorhat Junction, Gar-Ali, and Cinnamara. I am zooming the map to Jorhat Junction and highlighting Route 2B.`;
            actionToken = "\nACTION: show_stop:Jorhat Junction\nACTION: highlight_route:2B";
          } else if (msgLower.includes('stop') || msgLower.includes('station')) {
            const matchStop = stops.find(s => msgLower.includes(s.name.toLowerCase()));
            if (matchStop) {
              reply = `The stop **${matchStop.name}** is operational in Jorhat. Active routes servicing this stop: ${matchStop.routes.map(rid => routes.find(r => r._id === rid)?.routeNumber).join(', ')}.`;
              actionToken = `\nACTION: show_stop:${matchStop.name}`;
            } else {
              reply = `In Jorhat, we service multiple transit stops: ISBT Jorhat, Baruah Chariali, Jorhat Court, Rowriah Airport, Jorhat Junction, Gar-Ali, and Cinnamara Tea Estate. Which one can I help you find?`;
            }
          } else {
            reply = `Welcome to the Jorhat AI Transit Guide! I see ${routes.length} routes (1A, 2B), ${stops.length} major stops, and ${buses.length} online buses (AS-03-A-1122).

Try asking me:
- "How do I get to Rowriah Airport?"
- "Is there a bus from Jorhat Junction to Cinnamara?"
- "Where is the nearest stop?"`;
          }
        } 
        // ─── Bangalore / General Conversational Logic ─────────────────────
        else {
          if (msgLower.includes('airport') || msgLower.includes('flight')) {
            reply = `To get to the Airport, I recommend catching **Route 500C** from Silk Board. It goes all the way north and makes stops at HSR Layout, Bellandur, and Marathahalli. There is currently an active bus running on this route, which should reach Silk Board shortly.`;
            actionToken = "\nACTION: zoom_to:Bellandur\nACTION: highlight_route:500C";
          } else if (msgLower.includes('nearest') || msgLower.includes('close')) {
            reply = `I can help with that! Let's search for stops around your location. I am opening the Nearest Bus finder panel right now to compute your closest bus stops, walking times, and ETAs.`;
            actionToken = "\nACTION: find_nearest_bus";
          } else if (msgLower.includes('majestic') || msgLower.includes('train')) {
            reply = `For Majestic Station, you can take **Route G-3** which runs directly between Indiranagar, Domlur, Richmond Circle, Corporation, and Majestic. Alternatively, **Route 365** also terminates at Majestic coming from Bannerghatta.`;
            actionToken = "\nACTION: show_stop:Majestic\nACTION: highlight_route:G-3";
          } else if (msgLower.includes('stop') || msgLower.includes('station')) {
            const matchStop = stops.find(s => msgLower.includes(s.name.toLowerCase()));
            if (matchStop) {
              reply = `The stop **${matchStop.name}** is active. Routes servicing this stop are: ${matchStop.routes.map(rid => routes.find(r => r._id === rid)?.routeNumber).join(', ')}.`;
              actionToken = `\nACTION: show_stop:${matchStop.name}`;
            } else {
              reply = `We have several active stops in ${citySlug.toUpperCase()} including Silk Board, Majestic, Bellandur, and Domlur. Ask me about a specific stop for detailed arrival information.`;
            }
          } else {
            reply = `Welcome to CityTrack Chatbot! I have real-time access to the current fleet in **${citySlug}**. I can see ${routes.length} active routes, ${stops.length} major stops, and ${buses.length} online buses. 

Try asking:
- "How do I get to the airport?"
- "Where is the nearest bus stop?"
- "Is there a bus from Majestic to Indiranagar?"`;
          }
        }

        return jsonResponse({ responseText: reply + actionToken });
      }

      return errorResponse(`Mock path not implemented: ${method} ${path}`, 404);

    } catch (error) {
      console.error('Mock Adapter Error:', error);
      return errorResponse(error.message || 'Internal Mock Error', 500);
    }
  };
}

export default api;
export { api };
