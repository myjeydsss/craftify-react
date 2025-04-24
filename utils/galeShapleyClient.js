function galeShapleyClient(artists, clients, scores) {
  const freeArtists = new Set(artists.map((artist) => artist.user_id));
  const proposals = {};
  const matches = {};

  console.log("********** Initial Matches **********");

  // Create client preference map based on calculated scores
  const clientPreferences = {};
  clients.forEach((client) => {
    const sortedArtists = artists
      .map((artist) => ({
        artistId: artist.user_id,
        score: scores[artist.user_id]?.[artist.user_id] || 0,
      }))
      .sort((a, b) => b.score - a.score); // Higher score preferred

    clientPreferences[client.user_id] = sortedArtists.map(
      (artist) => artist.artistId
    );

    // Log all preferences for each client
    console.log(
      `Client ${client.user_id} Preferences: ${clientPreferences[
        client.user_id
      ].join(", ")}`
    );
  });

  // Track the artist's proposals and their matching process
  while (freeArtists.size > 0) {
    for (const artistId of [...freeArtists]) {
      const artist = artists.find((c) => c.user_id === artistId);
      if (!artist) continue;

      proposals[artistId] = proposals[artistId] || 0;

      // If the client has proposed to all artists, remove from the free list
      if (proposals[artistId] >= clients.length) {
        freeArtists.delete(artistId);
        continue;
      }

      // Get the artist ID from the sorted preferences based on score
      const preferredClientIds = Object.keys(scores[artistId]).sort(
        (a, b) => scores[artistId][b] - scores[artistId][a]
      );

      const clientId = preferredClientIds[proposals[artistId]];
      proposals[artistId]++;

      const client = clients.find((a) => a.user_id === clientId);
      if (!client) continue;

      // Check if the artist is not yet matched
      if (!matches[clientId]) {
        matches[clientId] = artistId;
        freeArtists.delete(artistId);
        console.log(`Initial Match: Artist ${artistId} -> Client ${clientId}`);
      } else {
        const currentArtist = matches[clientId];
        const currentRank = clientPreferences[clientId].indexOf(currentArtist);
        const newRank = clientPreferences[clientId].indexOf(artistId);

        // Check if the new Artist is more preferred than the current one
        if (newRank < currentRank) {
          matches[clientId] = artistId;
          freeArtists.delete(artistId);
          freeArtists.add(currentArtist);
          console.log(
            `Updated Match: Artist ${artistId} replaces Artist ${currentArtist} for Client ${clientId}`
          );
        }
      }
    }
  }

  console.log("\n********** Final Matches **********");
  for (const [clientId, artistId] of Object.entries(matches)) {
    console.log(`Client ${clientId} is matched with Artist ${artistId}`);
  }

  return matches;
}

module.exports = { galeShapleyClient };
