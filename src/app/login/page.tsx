"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { signIn } from "@auth/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    console.log("Submitting form...");
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);

    const response = await signIn.email({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    setPending(false);

    if (response.error) {
      setError(response.error.message || "Falha ao autenticar.");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <p className="mt-2 text-sm text-zinc-600">Use um dos usuários de seed.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Senha</span>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <Link href="/" className="mt-6 text-sm text-zinc-700 underline">
        Voltar para a home
      </Link>
    </main>
  );
}
