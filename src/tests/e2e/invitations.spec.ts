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
    await page.goto("/app/admin");

    const inviteEmail = buildInvitationEmail("teacher-accepted");
    await page.getByLabel("Email").fill(inviteEmail);
    await page.getByLabel("Papel").selectOption("TEACHER");
    await page.getByRole("button", { name: "Enviar convite" }).click();

    await page.waitForResponse("/api/invitations");

    const token = await getInvitationTokenFromFile();
    const nick = "Maria Silva";

    await page.context().clearCookies();
    await page.goto(`/convites/${token}`);

    await page.getByLabel("Nick").fill(nick);
    await page.getByLabel("Senha").fill("password123");
    await page.getByTestId("accept-invite-button").click();

    // Esperar redirecionamento para login
    await page.waitForURL("/login");

    // Fazer login com o usuário convidado
    await page.getByLabel("Email").fill(inviteEmail);
    await page.getByLabel("Senha").fill("password123");
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

    await page.goto("/app/admin");

    const inviteEmail = buildInvitationEmail("cancelled");
    await page.getByLabel("Email").fill(inviteEmail);
    await page.getByLabel("Papel").selectOption("TEACHER");
    await page.getByRole("button", { name: "Enviar convite" }).click();

    await page.waitForResponse("/api/invitations");

    await page.reload();

    const token = await getInvitationTokenFromFile();

    await page.getByRole("button", { name: "Cancelar" }).last().click();
    await page.reload();

    await page.context().clearCookies();

    await page.goto(`/convites/${token}`);
    await expect(
      page.getByText("Convite inválido"),
    ).toBeVisible();
    await expect(
      page.getByText("Este convite não está mais disponível."),
    ).toBeVisible();
  });
});
