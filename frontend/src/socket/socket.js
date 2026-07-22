import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

let passengerSocket = null;
let driverSocket = null;

// Passenger namespace ("/") — public, no auth. Shared singleton so every
// component that calls this during a session reuses the same connection.
export function getPassengerSocket() {
  if (!passengerSocket) {
    passengerSocket = io(SOCKET_URL, { transports: ['websocket'] });
  }
  return passengerSocket;
}

export function disconnectPassengerSocket() {
  if (passengerSocket) {
    passengerSocket.disconnect();
    passengerSocket = null;
  }
}

// Driver namespace ("/driver") — requires a JWT in the handshake auth
// payload; the backend's socketAuthMiddleware rejects anything else.
// `getToken` is called fresh on every (re)connection attempt — access
// tokens expire after 15 min, so a static token would work at first connect
// but get rejected on any later auto-reconnect.
export function getDriverSocket(getToken) {
  if (!driverSocket) {
    driverSocket = io(`${SOCKET_URL}/driver`, {
      auth: (cb) => cb({ token: getToken() }),
      transports: ['websocket'],
    });
  }
  return driverSocket;
}

export function disconnectDriverSocket() {
  if (driverSocket) {
    driverSocket.disconnect();
    driverSocket = null;
  }
}
