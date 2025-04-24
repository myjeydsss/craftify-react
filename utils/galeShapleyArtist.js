function galeShapleyArtist(clients, artists, scores) {
  const freeClients = new Set(clients.map((client) => client.user_id));
  const proposals = {};
  const matches = {};

  console.log("********** Initial Matches **********");

  // Create artist preference map based on calculated scores
  const artistPreferences = {};
  artists.forEach((artist) => {
    const sortedClients = clients
      .map((client) => ({
        clientId: client.user_id,
        score: scores[client.user_id]?.[artist.user_id] || 0,
      }))
      .sort((a, b) => b.score - a.score); // Higher score preferred

    artistPreferences[artist.user_id] = sortedClients.map(
      (client) => client.clientId
    );

    // Log all preferences for each artist
    console.log(
      `Artist ${artist.user_id} Preferences: ${artistPreferences[
        artist.user_id
      ].join(", ")}`
    );
  });

  // Track the client's proposals and their matching process
  while (freeClients.size > 0) {
    for (const clientId of [...freeClients]) {
      const client = clients.find((c) => c.user_id === clientId);
      if (!client) continue;

      proposals[clientId] = proposals[clientId] || 0;

      // If the client has proposed to all artists, remove from the free list
      if (proposals[clientId] >= artists.length) {
        freeClients.delete(clientId);
        continue;
      }

      // Get the artist ID from the sorted preferences based on score
      const preferredArtistIds = Object.keys(scores[clientId]).sort(
        (a, b) => scores[clientId][b] - scores[clientId][a]
      );

      const artistId = preferredArtistIds[proposals[clientId]];
      proposals[clientId]++;

      const artist = artists.find((a) => a.user_id === artistId);
      if (!artist) continue;

      // Check if the artist is not yet matched
      if (!matches[artistId]) {
        matches[artistId] = clientId;
        freeClients.delete(clientId);
        console.log(`Initial Match: Client ${clientId} -> Artist ${artistId}`);
      } else {
        const currentClient = matches[artistId];
        const currentRank = artistPreferences[artistId].indexOf(currentClient);
        const newRank = artistPreferences[artistId].indexOf(clientId);

        // Check if the new client is more preferred than the current one
        if (newRank < currentRank) {
          matches[artistId] = clientId;
          freeClients.delete(clientId);
          freeClients.add(currentClient);
          console.log(
            `Updated Match: Client ${clientId} replaces Client ${currentClient} for Artist ${artistId}`
          );
        }
      }
    }
  }

  console.log("\n********** Final Matches **********");
  for (const [artistId, clientId] of Object.entries(matches)) {
    console.log(`Artist ${artistId} is matched with Client ${clientId}`);
  }

  return matches;
}

module.exports = { galeShapleyArtist };
