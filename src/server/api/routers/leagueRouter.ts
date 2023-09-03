import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { LeagueState, getLeagueState } from "@/server/api/services/league";

export const exampleRouter = createTRPCRouter({
  getLeagueInfo: publicProcedure
    .input(LeagueState)
    .query(async ({ input: { leagueId } }) => {
      const leagueState = await getLeagueState(leagueId);
      return {
        leagueState,
      };
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
