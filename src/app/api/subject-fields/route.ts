import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";

import { subjectFieldInputSchema } from "@/features/subject-fields/subject-field.schema";
import type { SubjectFieldInput } from "@/features/subject-fields/subject-field.schema";
import {
  SubjectFieldDomainError,
  createSubjectField,
} from "@/features/subject-fields/subject-field.service";

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
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
  const parsed = subjectFieldInputSchema.safeParse(body);
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
    const subjectField = await createSubjectField(
      body as SubjectFieldInput,
      session.user.id,
    );
    return Response.json({ success: true, subjectField });
  } catch (error) {
    if (error instanceof SubjectFieldDomainError) {
      return Response.json(
        { success: false, error: error.code },
        { status: 409 },
      );
    }
    throw error;
  }
}
