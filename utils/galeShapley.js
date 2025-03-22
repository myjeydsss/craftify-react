function galeShapley(clients, artists) {
  const freeClients = new Set(clients.map((client) => client.user_id));
  const proposals = {};
  const matches = {};

  // Create artist preference map (client_id => rank)
  const artistPreferences = {};
  artists.forEach((artist) => {
    artistPreferences[artist.user_id] = {};
    if (artist.preferences && Array.isArray(artist.preferences)) {
      artist.preferences.forEach((clientId, rank) => {
        artistPreferences[artist.user_id][clientId] = rank;
      });
    }
  });

  while (freeClients.size > 0) {
    for (const clientId of [...freeClients]) {
      const client = clients.find((c) => c.user_id === clientId);
      if (!client) continue;

      proposals[clientId] = proposals[clientId] || 0;

      if (proposals[clientId] >= client.preferences.length) {
        freeClients.delete(clientId);
        continue;
      }

      const artistId = client.preferences[proposals[clientId]];
      proposals[clientId]++;
      const artist = artists.find((a) => a.user_id === artistId);
      if (!artist) continue;

      if (!matches[artistId]) {
        matches[artistId] = clientId;
        freeClients.delete(clientId);
      } else {
        const currentClient = matches[artistId];
        const currentRank =
          artistPreferences[artistId][currentClient] ?? Infinity;
        const newRank = artistPreferences[artistId][clientId] ?? Infinity;

        if (newRank < currentRank) {
          matches[artistId] = clientId;
          freeClients.delete(clientId);
          freeClients.add(currentClient);
        }
      }
    }
  }

  return matches;
}

module.exports = { galeShapley };
