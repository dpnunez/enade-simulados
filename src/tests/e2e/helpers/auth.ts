import { type Page } from "@playwright/test";

import type { TestUser } from "../fixtures/users";

export const ROLE_HOME_PATHS = {
  ADMIN: "/app/admin",
  STUDENT: "/app/student",
  TEACHER: "/app/professor",
} as const;

export async function loginAs(page: Page, user: TestUser) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL(ROLE_HOME_PATHS[user.role], { timeout: 10_000 });
}
