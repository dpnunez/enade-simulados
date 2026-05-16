"use client";

import { LogOut } from "lucide-react";

import { signOut } from "@auth/auth-client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      type="button"
      variant="destructive"
      onClick={async () => {
        await signOut();
        window.location.href = "/login";
      }}
    >
      Sair
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
