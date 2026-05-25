import { io as realIo } from 'socket.io-client';
import { getBusesFromDb, saveBusesToDb, getDriversFromDb } from './api';

class MockSocket {
  constructor() {
    this.listeners = {};
    this.joinedCity = null;
    this.joinedRoutes = new Set();
    this.activeBusId = null;

    // Set up our multi-tab cross-communication channel
    this.channel = new BroadcastChannel('citytrack_socket_channel');

    this.channel.onmessage = (event) => {
      const { event: eventName, payload } = event.data;
      
      // Filter out notifications based on current passenger city subscription
      if (this.joinedCity) {
        const buses = getBusesFromDb();
        
        // If bus-location received, check if the bus belongs to our subscribed city
        if (eventName === 'bus-location' || eventName === 'bus-online' || eventName === 'bus-offline' || eventName === 'bus-breakdown') {
          const bus = buses.find(b => b._id === payload.busId);
          if (bus && bus.city !== this.joinedCity) {
            return; // Ignore updates from other cities
          }
        }
      }

      this._trigger(eventName, payload);
    };
  }

  // Socket.io client API: listen to events
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Socket.io client API: stop listening
  off(event, callback) {
    if (!this.listeners[event]) return;
    if (!callback) {
      delete this.listeners[event];
      return;
    }
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  // Socket.io client API: emit events
  emit(event, payload) {
    // Local processing
    if (event === 'subscribe-city') {
      this.joinedCity = payload.citySlug;
      // When a passenger subscribes, immediately send the initial live buses for this city
      setTimeout(() => {
        const buses = getBusesFromDb().filter(b => b.city === this.joinedCity && (b.status === 'active' || b.status === 'breakdown'));
        this._trigger('initial-state', { buses });
      }, 50);
    }

    if (event === 'subscribe-route') {
      this.joinedRoutes.add(payload.routeId);
    }

    if (event === 'driver-connect') {
      const { busId } = payload;
      this.activeBusId = busId;
      
      const buses = getBusesFromDb();
      const index = buses.findIndex(b => b._id === busId);
      if (index !== -1) {
        buses[index].status = 'active';
        buses[index].speed = 15; // default starting speed
        saveBusesToDb(buses);

        const drivers = getDriversFromDb();
        const driver = drivers.find(d => d._id === buses[index].driverId);
        const driverName = driver ? driver.name : 'Unknown Driver';

        const onlinePayload = {
          busId,
          busNumber: buses[index].busNumber,
          driverName,
          lat: buses[index].lat,
          lng: buses[index].lng,
          speed: buses[index].speed,
          status: 'active',
          routeId: buses[index].routeId,
          city: buses[index].city
        };

        // Broadcast to other tabs
        this.channel.postMessage({
          event: 'bus-online',
          payload: onlinePayload
        });

        // Trigger in our own tab
        this._trigger('bus-online', onlinePayload);
      }
    }

    if (event === 'driver-disconnect') {
      const { busId } = payload;
      if (this.activeBusId === busId) {
        this.activeBusId = null;
      }
      
      const buses = getBusesFromDb();
      const index = buses.findIndex(b => b._id === busId);
      if (index !== -1) {
        buses[index].status = 'offline';
        buses[index].speed = 0;
        saveBusesToDb(buses);

        // Broadcast to other tabs
        this.channel.postMessage({
          event: 'bus-offline',
          payload: { busId }
        });

        // Trigger in our own tab
        this._trigger('bus-offline', { busId });
      }
    }

    if (event === 'bus-breakdown') {
      const { busId, message } = payload;
      
      const buses = getBusesFromDb();
      const index = buses.findIndex(b => b._id === busId);
      if (index !== -1) {
        buses[index].status = 'breakdown';
        buses[index].speed = 0;
        saveBusesToDb(buses);

        const breakdownPayload = {
          busId,
          message: message || 'Engine mechanical breakdown reported by driver.'
        };

        // Broadcast to other tabs
        this.channel.postMessage({
          event: 'bus-breakdown',
          payload: breakdownPayload
        });

        // Trigger in our own tab
        this._trigger('bus-breakdown', breakdownPayload);
      }
    }
  }

  // Internal helper to invoke listeners
  _trigger(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`Error running socket listener for ${event}:`, err);
        }
      });
    }
  }
}

// Singleton instances
const mockSocket = new MockSocket();
let realSocketInstance = null;

// Dynamic factory exporter
export const io = () => {
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
  
  if (!useMock) {
    if (!realSocketInstance) {
      const socketUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const token = localStorage.getItem('accessToken');
      
      realSocketInstance = realIo(socketUrl, {
        auth: { token },
        transports: ['websocket']
      });
      console.log('🔌 Connecting to real backend Socket.io server at:', socketUrl);
    }
    return realSocketInstance;
  }

  return mockSocket;
};

export default io;
