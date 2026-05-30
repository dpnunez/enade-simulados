import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";

import {
  questionInputSchema,
  type QuestionInput,
} from "@/features/questions/question.schema";
import {
  QuestionDomainError,
  createQuestion,
} from "@/features/questions/question.service";

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function statusForDomainError(error: QuestionDomainError) {
  if (error.code === "QUESTION_NOT_FOUND") return 404;
  if (error.code === "QUESTION_DUPLICATE_CONTENT") return 409;
  return 409;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasRole(session, "TEACHER")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const body = await parseJson(request);
  const parsed = questionInputSchema.safeParse(body);
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
    const question = await createQuestion(body as QuestionInput, session.user.id);
    return Response.json({ success: true, question });
  } catch (error) {
    if (error instanceof QuestionDomainError) {
      return Response.json(
        { success: false, error: error.code },
        { status: statusForDomainError(error) },
      );
    }
    throw error;
  }
}
