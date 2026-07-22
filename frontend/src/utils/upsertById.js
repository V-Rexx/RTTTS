// Merges a partial update into a keyed-by-id state map, skipping undefined
// fields so a partial event payload never clobbers a value from a richer
// earlier fetch (e.g. a socket event lacking route info doesn't blank out
// the route the initial REST fetch already resolved).
export function upsertById(setMap, id, patch) {
  setMap((prev) => {
    const existing = prev[id] || {};
    const merged = { ...existing };
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) merged[key] = value;
    }
    merged._id = id;
    return { ...prev, [id]: merged };
  });
}
