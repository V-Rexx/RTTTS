const Stop = require('../models/Stop');
const Route = require('../models/Route');
const Bus = require('../models/Bus');

const handleChat = async (req, res) => {
  try {
    const { message, citySlug } = req.body;
    if (!message || !citySlug) {
      return res.status(400).json({ message: 'User message and city slug are required' });
    }

    const stops = await Stop.find({ city: citySlug });
    const routes = await Route.find({ city: citySlug });
    const buses = await Bus.find({ city: citySlug, status: 'active' });

    let reply = "";
    let actionToken = "";
    const msgLower = message.toLowerCase();

    if (citySlug === 'jorhat') {
      if (msgLower.includes('airport') || msgLower.includes('flight') || msgLower.includes('rowriah')) {
        reply = `To get to **Rowriah Airport** in Jorhat, take **Route 1A** starting from ISBT Jorhat. It halts at Baruah Chariali and Jorhat Court before reaching Rowriah Airport. There are currently active buses traversing this path.`;
        actionToken = "\nACTION: zoom_to:Baruah Chariali\nACTION: highlight_route:1A";
      } else if (msgLower.includes('nearest') || msgLower.includes('close')) {
        reply = `Let me find the nearest stop to you. I have opened the Nearest Bus drawer to calculate walk times and list incoming fleets.`;
        actionToken = "\nACTION: find_nearest_bus";
      } else if (msgLower.includes('junction') || msgLower.includes('station') || msgLower.includes('cinnamara')) {
        reply = `For **Jorhat Junction** or **Cinnamara Tea Estate**, you should board **Route 2B** which connects Jorhat Junction, Gar-Ali, and Cinnamara. I am highlighting Route 2B on the map.`;
        actionToken = "\nACTION: show_stop:Jorhat Junction\nACTION: highlight_route:2B";
      } else if (msgLower.includes('stop') || msgLower.includes('station')) {
        const matchStop = stops.find(s => msgLower.includes(s.name.toLowerCase()));
        if (matchStop) {
          const matchedRouteDetails = routes.filter(r => stop.routes?.includes(r._id));
          reply = `The stop **${matchStop.name}** is operational in Jorhat. Services: ${matchedRouteDetails.map(r => r.routeNumber).join(', ') || 'No active routes'}.`;
          actionToken = `\nACTION: show_stop:${matchStop.name}`;
        } else {
          reply = `We service multiple stops in Jorhat: ISBT Jorhat, Baruah Chariali, Jorhat Court, Rowriah Airport, Jorhat Junction, Gar-Ali, and Cinnamara Tea Estate.`;
        }
      } else {
        reply = `Welcome to Jorhat AI Commute! I have live access to the database. Currently there are ${routes.length} active routes, ${stops.length} registered stops, and ${buses.length} online buses.`;
      }
    } 
    else {
      if (msgLower.includes('airport') || msgLower.includes('flight')) {
        reply = `To get to the Airport, catch **Route 500C** from Silk Board. It makes stops at HSR Layout, Bellandur, and Marathahalli. There are currently active buses running.`;
        actionToken = "\nACTION: zoom_to:Bellandur\nACTION: highlight_route:500C";
      } else if (msgLower.includes('nearest') || msgLower.includes('close')) {
        reply = `Opening the Nearest Bus finder to calculate closest stops and walk times for you.`;
        actionToken = "\nACTION: find_nearest_bus";
      } else if (msgLower.includes('majestic') || msgLower.includes('train')) {
        reply = `For Majestic Station, take **Route G-3** which runs directly through Indiranagar, Domlur, Richmond Circle, Corporation, and Majestic. Alternatively, **Route 365** also connects to Majestic.`;
        actionToken = "\nACTION: show_stop:Majestic\nACTION: highlight_route:G-3";
      } else if (msgLower.includes('stop') || msgLower.includes('station')) {
        const matchStop = stops.find(s => msgLower.includes(s.name.toLowerCase()));
        if (matchStop) {
          reply = `The stop **${matchStop.name}** is active. Services: ${matchStop.routes ? matchStop.routes.length : 0} routes.`;
          actionToken = `\nACTION: show_stop:${matchStop.name}`;
        } else {
          reply = `We have active stops including Silk Board, Majestic, Bellandur, and Domlur.`;
        }
      } else {
        reply = `Welcome to Bangalore AI Command! I see ${routes.length} active routes, ${stops.length} stops, and ${buses.length} active buses.`;
      }
    }

    res.json({ responseText: reply + actionToken });
  } catch (err) {
    console.error('Chat controller error:', err.message);
    res.status(500).json({ message: 'Server error processing chat' });
  }
};

module.exports = {
  handleChat
};
