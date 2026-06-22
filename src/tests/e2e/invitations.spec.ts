import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs, ROLE_HOME_PATHS } from "./helpers/auth";
import {
  buildInvitationEmail,
  ereaseInvitationRelatedData,
  getInvitationTokenFromFileAndDeleteFile as getInvitationTokenFromFile,
} from "./helpers/invitations";

test.describe("user invitations", () => {
  test("admin cria convite, convidado aceita e acessa a area privada", async ({
    page,
  }) => {
    await ereaseInvitationRelatedData();

    await loginAs(page, TEST_USERS.admin);
    await page.goto("/app/admin/convites");

    const inviteEmail = buildInvitationEmail("teacher-accepted");
    await page.getByLabel("Email").fill(inviteEmail);
    await page.getByLabel("Papel").selectOption("TEACHER");
    await page.getByRole("button", { name: "Enviar convite" }).click();

    await page.waitForResponse("/api/invitations");
    await expect(page.getByText(inviteEmail)).toBeVisible();

    const token = await getInvitationTokenFromFile();
    const nick = "Maria Silva";
    const password = "Password-123";

    await page.context().clearCookies();
    await page.goto(`/convites/${token}`);

    await page.getByLabel("Nick").fill(nick);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByLabel("Confirmar senha").fill(password);
    await page.getByTestId("accept-invite-button").click();

    // Esperar redirecionamento para login
    await page.waitForURL("/login");

    // Fazer login com o usuário convidado
    await page.getByLabel("Email").fill(inviteEmail);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();

    const res = await page.waitForResponse("/api/auth/sign-in/email");

    expect(res.ok()).toBe(true);
    await page.waitForURL(ROLE_HOME_PATHS.TEACHER, { timeout: 10_000 });
    await expect(page.getByText(nick)).toBeVisible();
    await expect(page.getByText(inviteEmail)).toBeVisible();
  });

  test("admin cancela convite e tentativa de cadastro falha", async ({
    page,
  }) => {
    await ereaseInvitationRelatedData();
    await loginAs(page, TEST_USERS.admin);

    await page.goto("/app/admin/convites");

    const inviteEmail = buildInvitationEmail("cancelled");
    await page.getByLabel("Email").fill(inviteEmail);
    await page.getByLabel("Papel").selectOption("TEACHER");
    await page.getByRole("button", { name: "Enviar convite" }).click();

    await page.waitForResponse("/api/invitations");
    await expect(page.getByText(inviteEmail)).toBeVisible();

    const token = await getInvitationTokenFromFile();

    const invitationRow = page.locator("tr", { hasText: inviteEmail });
    await invitationRow.getByRole("button", { name: "Cancelar" }).click();
    await expect(invitationRow).toBeHidden();

    await page.context().clearCookies();

    await page.goto(`/convites/${token}`);
    await expect(
      page.getByText("Convite inválido"),
    ).toBeVisible();
    await expect(
      page.getByText("Este convite não está mais disponível."),
    ).toBeVisible();
  });

  test("admin recebe erro especifico ao convidar email ja cadastrado", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.admin);

    await page.goto("/app/admin/convites");
    await page.getByLabel("Email").fill(TEST_USERS.teacher.email);
    await page.getByLabel("Papel").selectOption("TEACHER");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/invitations") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Enviar convite" }).click();
    const response = await responsePromise;

    expect(response.status()).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "EMAIL_ALREADY_REGISTERED",
    });

    await expect(
      page.getByText("Este email já possui uma conta ativa."),
    ).toBeVisible();
  });
});
