import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs, ROLE_HOME_PATHS } from "./helpers/auth";

test.describe("admin access", () => {
  test("admin navega pelas telas separadas na sidebar", async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);

    await expect(page).toHaveURL("/app/admin/usuarios");
    await expect(
      page.getByText("Usuários cadastrados"),
    ).toBeVisible();

    await page.getByRole("link", { name: "Convites" }).click();
    await expect(page).toHaveURL("/app/admin/convites");
    await expect(
      page.getByText("Convidar usuário"),
    ).toBeVisible();

    await page.getByRole("link", { name: "Usuários" }).click();
    await expect(page).toHaveURL("/app/admin/usuarios");
  });

  test("pagina de usuarios exibe usuarios seedados", async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    await page.goto("/app/admin/usuarios");

    await expect(
      page.getByRole("cell", { name: TEST_USERS.admin.email, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: TEST_USERS.student.email, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: TEST_USERS.teacher.email, exact: true }),
    ).toBeVisible();
  });

  test("rota antiga admin redireciona para usuarios", async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);

    await page.goto("/app/admin");

    await expect(page).toHaveURL("/app/admin/usuarios");
  });

  test("bloqueia student nas rotas admin e redireciona para home da role", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.student);

    for (const path of ["/app/admin", "/app/admin/usuarios", "/app/admin/convites"]) {
      await page.goto(path);

      await expect(page).toHaveURL(ROLE_HOME_PATHS.STUDENT);
      await expect(page.getByText("Área do aluno")).toBeVisible();
      await expect(
        page
          .getByText(new RegExp(`Role atual:\\s*${TEST_USERS.student.role}`))
          .first(),
      ).toBeVisible();
    }

    await expect.poll(async () => {
      const response = await page.request.get("/api/admin/users");
      return response.status();
    }).toBe(401);
    await expect.poll(async () => {
      const response = await page.request.get("/api/invitations");
      return response.status();
    }).toBe(401);
  });
});
