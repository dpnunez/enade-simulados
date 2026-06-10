import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";
import { simulationRankingQuerySchema } from "@/features/simulation-ranking/simulation-ranking.schema";
import { listTeacherSimulationRanking } from "@/features/simulation-ranking/simulation-ranking.service";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasRole(session, "TEACHER")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const parsed = simulationRankingQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: "VALIDATION_ERROR",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const ranking = await listTeacherSimulationRanking(parsed.data);

  return Response.json({ success: true, ...ranking });
}
