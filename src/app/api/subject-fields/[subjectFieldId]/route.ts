import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";

import {
  subjectFieldIdSchema,
  subjectFieldInputSchema,
} from "@/features/subject-fields/subject-field.schema";
import type { SubjectFieldInput } from "@/features/subject-fields/subject-field.schema";
import {
  SubjectFieldDomainError,
  deleteSubjectField,
  updateSubjectField,
} from "@/features/subject-fields/subject-field.service";

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function statusForDomainError(error: SubjectFieldDomainError) {
  if (error.code === "SUBJECT_FIELD_NOT_FOUND") return 404;
  return 409;
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/subject-fields/[subjectFieldId]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasRole(session, "TEACHER")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { subjectFieldId } = await context.params;
  const parsedId = subjectFieldIdSchema.safeParse(subjectFieldId);
  const body = await parseJson(request);
  const parsedBody = subjectFieldInputSchema.safeParse(body);

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
    const subjectField = await updateSubjectField(
      parsedId.data,
      body as SubjectFieldInput,
      session.user.id,
    );
    return Response.json({ success: true, subjectField });
  } catch (error) {
    if (error instanceof SubjectFieldDomainError) {
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
  context: RouteContext<"/api/subject-fields/[subjectFieldId]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasRole(session, "TEACHER")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { subjectFieldId } = await context.params;
  const parsedId = subjectFieldIdSchema.safeParse(subjectFieldId);

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
    const subjectField = await deleteSubjectField(parsedId.data, session.user.id);
    return Response.json({ success: true, subjectField });
  } catch (error) {
    if (error instanceof SubjectFieldDomainError) {
      return Response.json(
        { success: false, error: error.code },
        { status: statusForDomainError(error) },
      );
    }
    throw error;
  }
}
