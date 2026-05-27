import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs } from "./helpers/auth";

test("bloqueia student na rota admin e redireciona para /app", async ({
  page,
}) => {
  await loginAs(page, TEST_USERS.student);

  await page.goto("/app/admin");

  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", {
      name: "Qualquer usuário autenticado pode ver esta página.",
    }),
  ).toBeVisible();
  await expect(
    page
      .getByText(new RegExp(`Role atual:\\s*${TEST_USERS.student.role}`))
      .first(),
  ).toBeVisible();
});
