import players from "@/nfl_players.json";

const fetchFromAPI = async (url: string) => {
  const response = await fetch(url);
  return await response.json();
};

const mapPlayerData = (playerId: string, players: any) => {
  const player = players[playerId];
  return {
    player_id: player.player_id,
    espn_id: player.espn_id || null,
    team: player.team,
    first_name: player.first_name,
    last_name: player.last_name,
    full_name: player.full_name,
    position: player.position,
    fantasy_positions: player.fantasy_positions,
  };
};

export default async function handler(req: any, res: any) {
  const leagueId = req.query.leagueId;

  try {
    const league = await fetchFromAPI(
      `https://api.sleeper.app/v1/league/${leagueId}`,
    );
    const rosters = await fetchFromAPI(
      `https://api.sleeper.app/v1/league/${leagueId}/rosters`,
    );
    const users = await fetchFromAPI(
      `https://api.sleeper.app/v1/league/${leagueId}/users`,
    );
    const matchups = await fetchFromAPI(
      `https://api.sleeper.app/v1/league/${leagueId}/matchups/${league.current_week}`,
    );

    const teams = rosters.map((roster: any) => {
      const user = users.find((user: any) => user.user_id === roster.owner_id);
      const starters = roster.starters.map((playerId: string) =>
        mapPlayerData(playerId, players),
      );
      const bench = roster.players
        .filter((playerId: string) => !roster.starters.includes(playerId))
        .map((playerId: string) => mapPlayerData(playerId, players));
      const matchup = matchups.find(
        (matchup: any) => matchup.roster_id === roster.roster_id,
      );

      return {
        user: user.display_name,
        roster: {
          starters: starters,
          bench: bench,
          players: [...starters, ...bench],
        },
        matchup: matchup,
      };
    });

    res.status(200).json({ teams });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
