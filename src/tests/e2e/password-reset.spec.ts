import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import {
  getPasswordResetUrlFromFileAndDeleteFile,
  resetStudentPasswordResetState,
} from "./helpers/password-reset";

test.describe("password reset", () => {
  test("student redefine senha, senha antiga falha e senha nova autentica", async ({
    page,
  }) => {
    const newPassword = "student-reset-123";

    await resetStudentPasswordResetState();

    try {
      await page.goto("/login");
      await page.getByRole("link", { name: "Esqueci minha senha" }).click();
      await page.waitForURL("/esqueci-senha");

      await page.getByLabel("Email").fill(TEST_USERS.student.email);
      await page.getByRole("button", { name: "Enviar link" }).click();
      await page.waitForResponse("/api/password-reset/request");

      await expect(page.getByText("Verifique seu email")).toBeVisible();

      const resetUrl = getPasswordResetUrlFromFileAndDeleteFile();
      await page.goto(resetUrl);

      await expect(
        page.getByRole("heading", { name: "Nova senha" }),
      ).toBeVisible();
      await page.getByLabel("Nova senha").fill(newPassword);
      await page.getByLabel("Confirmar senha").fill(newPassword);
      await page.getByRole("button", { name: "Salvar nova senha" }).click();

      await expect(page.getByText("Senha redefinida")).toBeVisible();
      await page.getByRole("link", { name: "Ir para o login" }).click();
      await page.waitForURL("/login");

      await page.getByLabel("Email").fill(TEST_USERS.student.email);
      await page.getByLabel("Senha").fill(TEST_USERS.student.password);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page.getByText("Falha ao autenticar")).toBeVisible();

      await page.getByLabel("Senha").fill(newPassword);
      await page.getByRole("button", { name: "Entrar" }).click();

      await page.waitForURL(/\/app$/, { timeout: 10_000 });
      await expect(page.getByText(TEST_USERS.student.email)).toBeVisible();

      await page.goto(resetUrl);
      await expect(
        page.getByRole("heading", { name: "Link indisponível" }),
      ).toBeVisible();
    } finally {
      await resetStudentPasswordResetState();
    }
  });
});
