import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs, ROLE_HOME_PATHS } from "./helpers/auth";

test("bloqueia student na rota admin e redireciona para home da role", async ({
  page,
}) => {
  await loginAs(page, TEST_USERS.student);

  await page.goto("/app/admin");

  await expect(page).toHaveURL(ROLE_HOME_PATHS.STUDENT);
  await expect(page.getByText("Área do aluno")).toBeVisible();
  await expect(
    page
      .getByText(new RegExp(`Role atual:\\s*${TEST_USERS.student.role}`))
      .first(),
  ).toBeVisible();
});
