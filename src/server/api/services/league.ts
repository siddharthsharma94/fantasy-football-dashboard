import { z } from "zod";
import players from "@/nfl_players.json";

console.log("Imported zod and players");

export interface Player {
  player_id: string;
  espn_id: string | null;
  team: string;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  fantasy_positions: string[];
}

console.log("Defined Player interface");

export const fetchFromAPI = async (url: string): Promise<any> => {
  console.log(`Fetching data from ${url}`);
  const response = await fetch(url);
  console.log("Received response");
  return await response.json();
};

console.log("Defined fetchFromAPI function");

export const mapPlayerData = (
  playerId: string,
  players: Record<string, Player>,
): Player => {
  console.log(`Mapping player data for player ID: ${playerId}`);
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

console.log("Defined mapPlayerData function");

export const LeagueState = z.object({
  leagueId: z.string(),
});

console.log("Defined LeagueState");

export interface League {
  league_id: string;
  name: string;
  avatar: string;
  current_week: number;
  settings: {
    leg: number;
  };
}

console.log("Defined League interface");

export interface Roster {
  roster_id: number;
  owner_id: string;
  players: string[];
  starters: string[];
}

console.log("Defined Roster interface");

export interface User {
  user_id: string;
  display_name: string;
}

console.log("Defined User interface");

export interface Matchup {
  roster_id: number;
  matchup_id: number;
}

console.log("Defined Matchup interface");

export interface Team {
  user: string;
  roster: {
    starters: Player[];
    bench: Player[];
    players: Player[];
  };
  //   matchup: Matchup;
}

console.log("Defined Team interface");

export const getLeague = async (leagueId: string): Promise<League> => {
  const league = (await fetchFromAPI(
    `https://api.sleeper.app/v1/league/${leagueId}`,
  )) as League;
  console.log("Fetched league data");

  console.log({ league });
  return league;
};

export const getRosters = async (leagueId: string): Promise<Roster[]> => {
  const rosters = (await fetchFromAPI(
    `https://api.sleeper.app/v1/league/${leagueId}/rosters`,
  )) as Roster[];
  console.log("Fetched rosters data");
  return rosters;
};

export const getUsers = async (leagueId: string): Promise<User[]> => {
  const users = (await fetchFromAPI(
    `https://api.sleeper.app/v1/league/${leagueId}/users`,
  )) as User[];
  console.log("Fetched users data");
  return users;
};

export const getMatchups = async (
  leagueId: string,
  currentWeek: number,
): Promise<Matchup[]> => {
  let matchups: Matchup[] | null = null;

  console.log(
    "Fetching matchups data",
    `url is https://api.sleeper.app/v1/league/${leagueId}/matchups/${currentWeek}`,
  );
  try {
    matchups = (await fetchFromAPI(
      `https://api.sleeper.app/v1/league/${leagueId}/matchups/${currentWeek}`,
    )) as Matchup[];
    console.log("Fetched matchups data");
  } catch (error) {
    console.error("Failed to fetch matchups:", error);
  }
  return matchups;
};

export const getLeagueRosterMap = (teams) =>
  teams.reduce((acc, team) => {
    team.roster.players.forEach((player) => {
      acc[player.player_id] = player;
    });
    return acc;
  });

export const getLeagueState = async (leagueId: string): Promise<Team[]> => {
  console.log(`Getting league state for league ID: ${leagueId}`);
  const validatedData = LeagueState.parse({ leagueId });

  console.log("Validated league ID");

  const league = await getLeague(validatedData.leagueId);
  const rosters = await getRosters(validatedData.leagueId);
  const users = await getUsers(validatedData.leagueId);

  const teams = rosters.map((roster: Roster) => {
    console.log(`Mapping team data for roster ID: ${roster.roster_id}`);
    const user = users.find(
      (user: User) => user.user_id === roster.owner_id,
    ) as User;

    const starters = roster.starters.map((playerId: string) =>
      //@ts-ignore
      mapPlayerData(playerId, players),
    );
    console.log("Mapped starters data");
    const bench = roster.players
      .filter((playerId: string) => !roster.starters.includes(playerId))
      //@ts-ignore
      .map((playerId: string) => mapPlayerData(playerId, players));
    console.log("Mapped bench data");
    let matchup = { roster_id: 0, matchup_id: 0 }; // default value

    const teamState = {
      user: user.display_name,
      roster: {
        starters: starters,
        bench: bench,
        players: [...starters, ...bench],
      },
      matchup,
    };

    console.log("Created team state");
    return teamState;
  });

  console.log("Mapped teams data");
  return teams;
};

console.log("Defined getLeagueState function");

