import { headers } from "next/headers";

import { hasRole } from "@auth/authorization";
import { auth } from "@auth/server";

import {
  MarkdownImageUploadDomainError,
  uploadMarkdownImage,
} from "@/features/uploads/markdown-image.service";
import { supabaseMarkdownImageStorage } from "@/infra/storage/supabase-storage.adapter";

function statusForUploadError(error: MarkdownImageUploadDomainError) {
  if (error.code === "VALIDATION_ERROR") return 400;

  return 502;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasRole(session, "TEACHER")) {
    return Response.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      { success: false, error: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  try {
    const image = await uploadMarkdownImage(
      { file, actorUserId: session.user.id },
      supabaseMarkdownImageStorage,
    );

    return Response.json({ success: true, image });
  } catch (error) {
    if (error instanceof MarkdownImageUploadDomainError) {
      return Response.json(
        { success: false, error: error.code },
        { status: statusForUploadError(error) },
      );
    }

    throw error;
  }
}
