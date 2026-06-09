import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";

import {
  simulationAttemptIdSchema,
  simulationSaveAnswersInputSchema,
  type SimulationSaveAnswersInput,
} from "@/features/simulated-exams/simulated-exam.schema";
import {
  SimulationDomainError,
  saveSimulationAttemptAnswers,
} from "@/features/simulated-exams/simulated-exam.service";

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function statusForDomainError(error: SimulationDomainError) {
  if (error.code === "SIMULATION_ATTEMPT_NOT_FOUND") return 404;
  if (error.code === "SIMULATION_INVALID_ANSWER") return 400;
  return 409;
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/student/simulated-exams/[attemptId]/answers">,
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasRole(session, "STUDENT")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { attemptId } = await context.params;
  const parsedId = simulationAttemptIdSchema.safeParse(attemptId);
  const body = await parseJson(request);
  const parsedBody = simulationSaveAnswersInputSchema.safeParse(body);

  if (!parsedId.success || !parsedBody.success) {
    return Response.json(
      {
        success: false,
        error: "VALIDATION_ERROR",
        issues: [
          ...(!parsedId.success ? parsedId.error.issues : []),
          ...(!parsedBody.success ? parsedBody.error.issues : []),
        ],
      },
      { status: 400 },
    );
  }

  try {
    const attempt = await saveSimulationAttemptAnswers(
      parsedId.data,
      parsedBody.data as SimulationSaveAnswersInput,
      session.user.id,
    );
    return Response.json({ success: true, attempt });
  } catch (error) {
    if (error instanceof SimulationDomainError) {
      return Response.json(
        { success: false, error: error.code },
        { status: statusForDomainError(error) },
      );
    }

    throw error;
  }
}
