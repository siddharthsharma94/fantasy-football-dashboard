import { z } from "zod";
import players from "@/nfl_players.json";

interface Player {
  player_id: string;
  espn_id: string | null;
  team: string;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  fantasy_positions: string[];
}

const fetchFromAPI = async (url: string): Promise<any> => {
  const response = await fetch(url);
  return await response.json();
};

const mapPlayerData = (
  playerId: string,
  players: Record<string, Player>,
): Player => {
  const player = players[playerId] as Player;
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

export const LeagueState = z.object({
  leagueId: z.string(),
});

interface League {
  league_id: string;
  name: string;
  avatar: string;
  current_week: number;
}

interface Roster {
  roster_id: number;
  owner_id: string;
  players: string[];
  starters: string[];
}

interface User {
  user_id: string;
  display_name: string;
}

interface Matchup {
  roster_id: number;
  matchup_id: number;
}

interface Team {
  user: string;
  roster: {
    starters: Player[];
    bench: Player[];
    players: Player[];
  };
  matchup: Matchup;
}

export const getLeagueState = async (leagueId: string): Promise<Team[]> => {
  const validatedData = LeagueState.parse({ leagueId });

  const league = (await fetchFromAPI(
    `https://api.sleeper.app/v1/league/${validatedData.leagueId}`,
  )) as League;
  const rosters = (await fetchFromAPI(
    `https://api.sleeper.app/v1/league/${validatedData.leagueId}/rosters`,
  )) as Roster[];
  const users = (await fetchFromAPI(
    `https://api.sleeper.app/v1/league/${validatedData.leagueId}/users`,
  )) as User[];
  const matchups = (await fetchFromAPI(
    `https://api.sleeper.app/v1/league/${validatedData.leagueId}/matchups/${league.current_week}`,
  )) as Matchup[];

  const teams = rosters.map((roster: Roster) => {
    const user = users.find((user: User) => user.user_id === roster.owner_id);
    const starters = roster.starters.map((playerId: string) =>
      mapPlayerData(playerId, players),
    );
    const bench = roster.players
      .filter((playerId: string) => !roster.starters.includes(playerId))
      .map((playerId: string) => mapPlayerData(playerId, players));
    const matchup = matchups.find(
      (matchup: Matchup) => matchup.roster_id === roster.roster_id,
    ) || { roster_id: 0, matchup_id: 0 }; // default value

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

  return teams;
};
