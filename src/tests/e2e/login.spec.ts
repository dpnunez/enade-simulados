import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs } from "./helpers/auth";

test("faz login com usuário seeded e abre a área privada", async ({ page }) => {
  await loginAs(page, TEST_USERS.admin);

  await expect(page.getByText("Usuários cadastrados")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: TEST_USERS.admin.email, exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/app\/admin\/usuarios$/);
});

test("redireciona a raiz para login quando não há sessão", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
});

test("permite visualizar e ocultar a senha no login", async ({ page }) => {
  await page.goto("/login");

  const passwordInput = page.getByLabel("Senha");

  await expect(passwordInput).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar valor do campo" }).click();
  await expect(passwordInput).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar valor do campo" }).click();
  await expect(passwordInput).toHaveAttribute("type", "password");
});

test("redireciona a raiz para a área da role quando há sessão", async ({ page }) => {
  await loginAs(page, TEST_USERS.student);

  await page.goto("/");

  await expect(page).toHaveURL(/\/app\/aluno$/);
  await expect(page.getByText("Área do aluno")).toBeVisible();
});

test("faz login de professor na rota /app/professor", async ({ page }) => {
  await loginAs(page, TEST_USERS.teacher);

  await expect(page).toHaveURL(/\/app\/professor$/);
  await expect(page.getByText("Área PROFESSOR")).toBeVisible();
});
