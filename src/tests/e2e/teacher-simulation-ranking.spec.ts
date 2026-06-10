import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs } from "./helpers/auth";
import {
  createSimulationRankingE2eData,
  eraseSimulationRankingE2eData,
} from "./helpers/simulation-ranking";

test.describe("teacher simulation ranking", () => {
  test.beforeEach(async () => {
    await eraseSimulationRankingE2eData();
  });

  test.afterEach(async () => {
    await eraseSimulationRankingE2eData();
  });

  test("teacher sees weighted ranking and paginates server-side", async ({
    page,
  }) => {
    const data = await createSimulationRankingE2eData();

    await loginAs(page, TEST_USERS.teacher);
    await page.goto("/app/professor/ranking");

    await expect(page.getByRole("heading", { name: "Ranking de simulados" }))
      .toBeVisible();
    await expect(page.getByText(data.topStudentEmail)).toBeVisible();
    await expect(page.getByText("6").first()).toBeVisible();
    await expect(page.getByText(data.secondStudentEmail)).toBeVisible();

    const firstBodyRow = page.locator("tbody tr").first();
    await expect(firstBodyRow).toContainText("#1");
    await expect(firstBodyRow).toContainText(data.topStudentEmail);
    await expect(firstBodyRow).toContainText("6");
    await expect(firstBodyRow).toContainText("100%");

    await page.getByLabel("Linhas").selectOption("10");
    await expect(page.getByText("11 estudantes - pagina 1 de 2")).toBeVisible();

    const [nextPageResponse] = await Promise.all([
      page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/teacher/simulation-ranking" &&
          url.searchParams.get("page") === "2" &&
          url.searchParams.get("pageSize") === "10"
        );
      }),
      page.getByRole("button", { name: "Proxima" }).click(),
    ]);

    expect(nextPageResponse.status()).toBe(200);
    await expect(page.getByText("11 estudantes - pagina 2 de 2")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(1);
  });

  test("student cannot access teacher ranking page or API", async ({ page }) => {
    await createSimulationRankingE2eData();

    await loginAs(page, TEST_USERS.student);
    await page.goto("/app/professor/ranking");
    await expect(page).toHaveURL(/\/app$/);

    const apiResponse = await page.evaluate(async () => {
      const response = await fetch("/api/teacher/simulation-ranking");

      return {
        status: response.status,
        payload: await response.json(),
      };
    });

    expect(apiResponse).toEqual({
      status: 401,
      payload: { success: false, error: "UNAUTHORIZED" },
    });
  });
});
