const buses = new Map()

const setBus = (busId, data) => {
  buses.set(busId.toString(), {
    ...data,
    lastPing: Date.now()
  })
}

const getBus = (busId) => {
  return buses.get(busId.toString())
}

const removeBus = (busId) => {
  buses.delete(busId.toString())
}

const getBusesByCity = (citySlug) => {
  const result = []
  for (const [_, bus] of buses) {
    if (bus.citySlug === citySlug) result.push(bus)
  }
  return result
}

const findStaleBuses = (timeoutMs = 30000) => {
  const now = Date.now()
  const stale = []
  for (const [busId, bus] of buses) {
    if (now - bus.lastPing > timeoutMs) {
      stale.push(busId)
    }
  }
  return stale
}

const count = () => buses.size

module.exports = {
  setBus,
  getBus,
  removeBus,
  getBusesByCity,
  findStaleBuses,
  count
}