import { getLeagueState } from "@/server/api/services/league";

export default async function handler(req: any, res: any) {
  const leagueId = req.query.leagueId;

  try {
    const state = getLeagueState(leagueId);
    res.status(200).json({ state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
