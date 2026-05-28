import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";

import {
  questionIdSchema,
  questionInputSchema,
  type QuestionInput,
} from "@/features/questions/question.schema";
import {
  QuestionDomainError,
  deleteQuestion,
  updateQuestion,
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
  return 409;
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/questions/[questionId]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasRole(session, "TEACHER")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { questionId } = await context.params;
  const parsedId = questionIdSchema.safeParse(questionId);
  const body = await parseJson(request);
  const parsedBody = questionInputSchema.safeParse(body);

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
    const question = await updateQuestion(
      parsedId.data,
      body as QuestionInput,
      session.user.id,
    );
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

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/questions/[questionId]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasRole(session, "TEACHER")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { questionId } = await context.params;
  const parsedId = questionIdSchema.safeParse(questionId);

  if (!parsedId.success) {
    return Response.json(
      {
        success: false,
        error: "VALIDATION_ERROR",
        issues: parsedId.error.issues,
      },
      { status: 400 },
    );
  }

  try {
    const question = await deleteQuestion(parsedId.data, session.user.id);
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
