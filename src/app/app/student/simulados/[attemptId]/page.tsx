import { redirect } from "next/navigation";

type AttemptPageProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function StudentSimuladoAttemptPage({
  params,
}: AttemptPageProps) {
  const { attemptId } = await params;

  redirect(`/app/aluno/simulados/${attemptId}`);
}
