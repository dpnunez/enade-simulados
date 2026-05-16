"use client";

import { signOut } from "@auth/auth-client";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        window.location.href = "/login";
      }}
      className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
    >
      Sair
    </button>
  );
}
