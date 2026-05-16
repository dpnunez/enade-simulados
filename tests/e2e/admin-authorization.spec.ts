import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs } from "./helpers/login";

test("bloqueia student na rota admin e redireciona para /app", async ({
  page,
}) => {
  await loginAs(page, TEST_USERS.student);

  await page.goto("/app/admin");

  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", { name: "Área privada" }),
  ).toBeVisible();
  await expect(page.getByText("Role atual: STUDENT")).toBeVisible();
});
