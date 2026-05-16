import { requireAuth } from "@auth/session";

export default async function PrivateHomePage() {
  const session = await requireAuth();

  return (
    <main className="space-y-2">
      <h1 className="text-2xl font-semibold">Área privada</h1>
      <p>Qualquer usuário autenticado pode ver esta página.</p>
      <p className="text-sm text-zinc-600">Role atual: {session.user.role}</p>
    </main>
  );
}
