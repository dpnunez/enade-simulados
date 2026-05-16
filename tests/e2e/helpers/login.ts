import { expect, type Page } from "@playwright/test";

import type { TestUser } from "../fixtures/users";

export async function loginAs(page: Page, user: TestUser) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/app$/);
}
