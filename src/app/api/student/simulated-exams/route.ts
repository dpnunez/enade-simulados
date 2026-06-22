import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";

import {
  simulationAttemptsListQuerySchema,
  simulationGenerationInputSchema,
  type SimulationGenerationInput,
} from "@/features/simulated-exams/simulated-exam.schema";
import {
  SimulationDomainError,
  createSimulationAttempt,
  listSimulationAttemptsPageForStudent,
} from "@/features/simulated-exams/simulated-exam.service";

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function statusForDomainError(error: SimulationDomainError) {
  if (error.code === "SIMULATION_NOT_ENOUGH_QUESTIONS") return 409;
  if (error.code === "SIMULATION_ATTEMPT_NOT_FOUND") return 404;
  if (error.code === "SIMULATION_INVALID_ANSWER") return 400;
  return 409;
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasRole(session, "STUDENT")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const parsed = simulationAttemptsListQuerySchema.safeParse(
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

  const attempts = await listSimulationAttemptsPageForStudent(
    session.user.id,
    parsed.data,
  );

  return Response.json({ success: true, ...attempts });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasRole(session, "STUDENT")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const body = await parseJson(request);
  const parsed = simulationGenerationInputSchema.safeParse(body);

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

  try {
    const attempt = await createSimulationAttempt(
      parsed.data as SimulationGenerationInput,
      session.user.id,
    );
    return Response.json({ success: true, attempt }, { status: 201 });
  } catch (error) {
    if (error instanceof SimulationDomainError) {
      return Response.json(
        {
          success: false,
          error: error.code,
          metadata: error.metadata,
        },
        { status: statusForDomainError(error) },
      );
    }

    throw error;
  }
}
