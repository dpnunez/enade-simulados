import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs } from "./helpers/auth";

test("faz login com usuário seeded e abre a área privada", async ({ page }) => {
  await loginAs(page, TEST_USERS.admin);

  await expect(page.getByText("Convidar usuário")).toBeVisible();
  await expect(page.getByText("Sessão ativa")).toBeVisible();
  await expect(page.getByText(TEST_USERS.admin.email, { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/app\/admin$/);
});

test("redireciona a raiz para login quando não há sessão", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
});

test("redireciona a raiz para a área da role quando há sessão", async ({ page }) => {
  await loginAs(page, TEST_USERS.student);

  await page.goto("/");

  await expect(page).toHaveURL(/\/app\/student$/);
  await expect(page.getByText("Área STUDENT")).toBeVisible();
});

test("faz login de professor na rota /app/professor", async ({ page }) => {
  await loginAs(page, TEST_USERS.teacher);

  await expect(page).toHaveURL(/\/app\/professor$/);
  await expect(page.getByText("Área PROFESSOR")).toBeVisible();
});
