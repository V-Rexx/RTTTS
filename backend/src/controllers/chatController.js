const { GoogleGenerativeAI } = require('@google/generative-ai')
const City = require('../models/City')
const Route = require('../models/Route')
const Stop = require('../models/Stop')
const busManager = require('../utils/busManager')

// Initialize Gemini once at module load
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// ─── Helper: build live context for a city ──────────────
const buildCityContext = async (citySlug) => {
  const city = await City.findOne({ slug: citySlug, isActive: true })
  if (!city) return null

  const [routes, stops] = await Promise.all([
    Route.find({ city: city._id, isActive: true })
      .populate('stops', 'name location')
      .select('routeNumber routeName stops color'),
    Stop.find({ city: city._id })
      .select('name location')
  ])

  const liveBuses = busManager.getBusesByCity(citySlug)

  return {
    city: {
      name: city.name,
      slug: city.slug,
      center: city.center
    },
    routes: routes.map(r => ({
      routeNumber: r.routeNumber,
      routeName: r.routeName,
      stops: r.stops.map(s => s.name)
    })),
    stops: stops.map(s => ({
      name: s.name,
      lng: s.location.coordinates[0],
      lat: s.location.coordinates[1]
    })),
    liveBuses: liveBuses.map(b => ({
      busNumber: b.busNumber,
      route: b.route,
      lat: b.lat,
      lng: b.lng,
      status: b.status,
      speed: b.speed
    }))
  }
}

// ─── GET /api/chat/context?citySlug=bangalore ───────────
// Public — frontend can call this to see raw context
const getCityContext = async (req, res) => {
  try {
    const { citySlug } = req.query
    if (!citySlug) {
      return res.status(400).json({ message: 'citySlug is required' })
    }

    const context = await buildCityContext(citySlug.toLowerCase())
    if (!context) {
      return res.status(404).json({ message: 'City not found' })
    }

    res.json({ context })
  } catch (err) {
    console.error('getCityContext error:', err)
    res.status(500).json({ message: 'Server error building context' })
  }
}

// ─── POST /api/chat ─────────────────────────────────────
// Public — main chatbot endpoint
const chat = async (req, res) => {
  try {
    const { message, citySlug, history } = req.body

    if (!message || !citySlug) {
      return res.status(400).json({ 
        message: 'message and citySlug are required' 
      })
    }

    // Build live context for RAG
    const context = await buildCityContext(citySlug.toLowerCase())
    if (!context) {
      return res.status(404).json({ message: 'City not found' })
    }

    // Build the system prompt with live data injected
    const systemPrompt = `You are CityTrack Assistant, a helpful transit companion for ${context.city.name}.

You have access to LIVE bus tracking data. Use it to answer questions accurately.

CURRENT DATA:

Routes in ${context.city.name}:
${context.routes.map(r => 
  `- ${r.routeNumber} (${r.routeName}): ${r.stops.join(' → ')}`
).join('\n') || '(No routes configured yet)'}

Currently live buses (${context.liveBuses.length}):
${context.liveBuses.length > 0 
  ? context.liveBuses.map(b => 
      `- Bus ${b.busNumber}, status: ${b.status}, speed: ${b.speed || 0} km/h`
    ).join('\n')
  : '(No buses currently online)'}

INSTRUCTIONS:
1. Answer questions using ONLY the live data above. Don't invent routes or buses.
2. Be concise — 2-3 sentences typical, max 5.
3. Be friendly but not chatty. Passengers are usually in a hurry.
4. If asked about a specific route, mention the route number and endpoint stops.
5. If asked about "nearest bus" or specific stops, describe what you see in the data.
6. If the user asks something you can't answer from the data, say so plainly.

ACTION TOKENS (optional):
You can trigger UI actions on the map by ending your response with a special line:
- ACTION: highlight_route:<routeNumber> — pulses that route on the map
- ACTION: show_stop:<stopName> — opens the popup for that stop
- ACTION: zoom_to:<stopName> — pans map to that stop

Only include ONE action token per response, and only when it clearly helps.

Example response:
"Route 42A runs from Central Station to Airport, passing MG Road and Indiranagar. It's a 45-minute ride typically.
ACTION: highlight_route:42A"

Now respond to the user's question below.`

    // Format history for Gemini
    const chatHistory = (history || []).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }))

    const chatSession = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I\'ll help passengers using live CityTrack data.' }] },
        ...chatHistory
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 400
      }
    })

    const result = await chatSession.sendMessage(message)
    const responseText = result.response.text()

    // Parse out action token if present
    const actionMatch = responseText.match(/ACTION:\s*(\w+):(.+?)(?:\n|$)/i)
    let cleanText = responseText
    let action = null

    if (actionMatch) {
      action = {
        type: actionMatch[1].trim(),
        target: actionMatch[2].trim()
      }
      // Remove the action line from the visible text
      cleanText = responseText.replace(/ACTION:.+$/im, '').trim()
    }

    res.json({
      response: cleanText,
      action,
      contextUsed: {
        routes: context.routes.length,
        stops: context.stops.length,
        liveBuses: context.liveBuses.length
      }
    })

  } catch (err) {
    console.error('chat error:', err.message)

    // Handle Gemini-specific errors
    if (err.message?.includes('API key')) {
      return res.status(500).json({ message: 'AI service misconfigured' })
    }
    if (err.message?.includes('quota') || err.message?.includes('429')) {
      return res.status(429).json({ message: 'AI service rate limit reached, try again in a minute' })
    }

    res.status(500).json({ message: 'AI service error' })
  }
}

module.exports = {
  chat,
  getCityContext
}