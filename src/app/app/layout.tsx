import Link from "next/link";

import { requireAuth } from "@auth/session";
import { LogoutButton } from "./logout-button";

export default async function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
      <header className="mb-8 flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <p className="text-sm text-zinc-600">Sessão ativa</p>
          <p className="text-sm font-medium">{session.user.email}</p>
          <p className="text-sm text-zinc-600">Role: {session.user.role}</p>
        </div>

        <LogoutButton />
      </header>

      <nav className="mb-6 flex flex-wrap gap-4 text-sm">
        <Link href="/app" className="underline">
          Base privada
        </Link>
        <Link href="/app/admin" className="underline">
          Admin
        </Link>
        <Link href="/app/student" className="underline">
          Student
        </Link>
        <Link href="/app/teacher" className="underline">
          Teacher
        </Link>
      </nav>

      {children}
    </div>
  );
}
