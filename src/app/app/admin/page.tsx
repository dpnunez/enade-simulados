import { requireRole } from "@auth/session";

export default async function AdminPage() {
  const session = await requireRole("ADMIN");

  return (
    <main className="space-y-2">
      <h1 className="text-2xl font-semibold">Área ADMIN</h1>
      <p className="text-sm text-zinc-600">Role atual: {session.user.role}</p>
    </main>
  );
}
