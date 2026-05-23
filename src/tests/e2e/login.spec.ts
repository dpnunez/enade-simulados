import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs } from "./helpers/login";

test("faz login com usuário seeded e abre a área privada", async ({ page }) => {
  await loginAs(page, TEST_USERS.admin);

  await expect(
    page.getByRole("heading", {
      name: "Qualquer usuário autenticado pode ver esta página.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Sessão ativa")).toBeVisible();
  await expect(page.getByText(TEST_USERS.admin.email)).toBeVisible();
  await expect(
    page.getByText(new RegExp(`Role atual:\\s*${TEST_USERS.admin.role}`)).first(),
  ).toBeVisible();
});
