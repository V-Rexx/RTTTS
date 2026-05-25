const Bus = require('../models/Bus');
const User = require('../models/User');

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Passenger subscribes to a specific city map room
    socket.on('subscribe-city', async ({ citySlug }) => {
      socket.join(citySlug);
      console.log(`📍 Client ${socket.id} subscribed to city room: ${citySlug}`);

      try {
        // Send initial live buses for this city on subscription
        const activeBuses = await Bus.find({ 
          city: citySlug, 
          status: { $in: ['active', 'breakdown'] } 
        });

        // Resolve driver names for these active buses
        const resolvedBuses = await Promise.all(activeBuses.map(async (bus) => {
          const driver = await User.findById(bus.driverId);
          return {
            _id: bus._id,
            busNumber: bus.busNumber,
            plateNumber: bus.plateNumber,
            lat: bus.lat,
            lng: bus.lng,
            speed: bus.speed,
            status: bus.status,
            routeId: bus.routeId,
            driverName: driver ? driver.name : 'Unknown'
          };
        }));

        socket.emit('initial-state', { buses: resolvedBuses });
      } catch (err) {
        console.error('Error fetching initial live buses for socket:', err.message);
      }
    });

    // Driver starting their shift
    socket.on('driver-connect', async ({ busId }) => {
      console.log(`🚍 Driver connected with Bus ID: ${busId}`);
      
      try {
        const bus = await Bus.findById(busId);
        if (bus) {
          bus.status = 'active';
          await bus.save();

          const driver = await User.findById(bus.driverId);
          const driverName = driver ? driver.name : 'Unknown';

          const onlinePayload = {
            busId: bus._id,
            busNumber: bus.busNumber,
            driverName,
            lat: bus.lat,
            lng: bus.lng,
            speed: bus.speed,
            status: 'active',
            routeId: bus.routeId,
            city: bus.city
          };

          // Broadcast to the city room
          io.to(bus.city).emit('bus-online', onlinePayload);
        }
      } catch (err) {
        console.error('Error in socket driver-connect:', err.message);
      }
    });

    // Driver ending their shift
    socket.on('driver-disconnect', async ({ busId }) => {
      console.log(`🚍 Driver disconnected from Bus ID: ${busId}`);
      
      try {
        const bus = await Bus.findById(busId);
        if (bus) {
          bus.status = 'offline';
          bus.speed = 0;
          await bus.save();

          // Broadcast offline event to city room
          io.to(bus.city).emit('bus-offline', { busId: bus._id });
        }
      } catch (err) {
        console.error('Error in socket driver-disconnect:', err.message);
      }
    });

    // Driver reporting mechanical breakdown
    socket.on('bus-breakdown', async ({ busId, message }) => {
      console.log(`🚨 Emergency reported for Bus ID ${busId}: ${message}`);
      
      try {
        const bus = await Bus.findById(busId);
        if (bus) {
          bus.status = 'breakdown';
          bus.speed = 0;
          await bus.save();

          const breakdownPayload = {
            busId: bus._id,
            message: message || 'Mechanical breakdown reported by driver.'
          };

          // Broadcast emergency to the city room
          io.to(bus.city).emit('bus-breakdown', breakdownPayload);
        }
      } catch (err) {
        console.error('Error in socket bus-breakdown:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocket;
