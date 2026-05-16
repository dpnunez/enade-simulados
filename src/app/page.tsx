import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold">ENADE ENG</h1>
      <p className="mt-3 max-w-2xl text-zinc-700">
        MVP com autenticação por email e senha usando Better Auth + Prisma.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Ir para login
        </Link>
        <Link
          href="/app"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
        >
          Ir para área privada
        </Link>
      </div>
    </main>
  );
}
