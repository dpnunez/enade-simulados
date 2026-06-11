"use client";

import type * as React from "react";
import { Check, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getPasswordRequirementStates } from "@/features/password-reset/password-policy";
import { cn } from "@/lib/utils";

type PasswordRequirementsProps = {
  password: string;
} & React.ComponentProps<"div">;

export function PasswordRequirements({
  password,
  className,
  ...props
}: PasswordRequirementsProps) {
  const requirements = getPasswordRequirementStates(password);
  const metCount = requirements.filter((requirement) => requirement.isMet).length;
  const progress = (metCount / requirements.length) * 100;
  const allMet = metCount === requirements.length;

  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/35 p-4 transition-colors duration-300",
        allMet ? "border-primary/40 bg-primary/5" : "border-border",
        className,
      )}
      aria-live="polite"
      {...props}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck
            className={cn(
              "h-4 w-4 transition-colors duration-300",
              allMet ? "text-primary" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          Requisitos da senha
        </div>
        <Badge variant={allMet ? "default" : "outline"}>
          {metCount}/{requirements.length}
        </Badge>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="grid gap-2">
        {requirements.map((requirement) => (
          <li
            key={requirement.id}
            className={cn(
              "flex items-center gap-2 text-sm transition-all duration-300",
              requirement.isMet
                ? "translate-x-0 text-foreground"
                : "translate-x-1 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                requirement.isMet
                  ? "scale-100 border-primary bg-primary text-primary-foreground"
                  : "scale-95 border-border bg-background",
              )}
            >
              <Check
                className={cn(
                  "h-3 w-3 transition-all duration-300",
                  requirement.isMet
                    ? "scale-100 opacity-100"
                    : "scale-50 opacity-0",
                )}
                aria-hidden="true"
              />
            </span>
            <span>{requirement.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
