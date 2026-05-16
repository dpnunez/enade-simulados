import { requireRole } from "@auth/session";

export default async function TeacherPage() {
  const session = await requireRole("TEACHER");

  return (
    <main className="space-y-2">
      <h1 className="text-2xl font-semibold">Área TEACHER</h1>
      <p className="text-sm text-zinc-600">Role atual: {session.user.role}</p>
    </main>
  );
}
