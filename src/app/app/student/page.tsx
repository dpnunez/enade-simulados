import { requireRole } from "@auth/session";

export default async function StudentPage() {
  const session = await requireRole("STUDENT");

  return (
    <main className="space-y-2">
      <h1 className="text-2xl font-semibold">Área STUDENT</h1>
      <p className="text-sm text-zinc-600">Role atual: {session.user.role}</p>
    </main>
  );
}
