import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs, ROLE_HOME_PATHS } from "./helpers/auth";
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
    await expect(page.getByText("13 estudantes - pagina 1 de 2")).toBeVisible();

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
    await expect(page.getByText("13 estudantes - pagina 2 de 2")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(3);
  });

  test("teacher filters completed attempts by inclusive dates and clears the period", async ({
    page,
  }) => {
    const data = await createSimulationRankingE2eData();

    await loginAs(page, TEST_USERS.teacher);
    await page.goto("/app/professor/ranking");

    const [historicalResponse] = await Promise.all([
      page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/teacher/simulation-ranking" &&
          url.searchParams.get("page") === "1" &&
          !url.searchParams.has("startDate") &&
          !url.searchParams.has("endDate")
        );
      }),
      page.getByRole("button", { name: "Aplicar filtros" }).click(),
    ]);
    expect(historicalResponse.status()).toBe(200);

    const [sortResponse] = await Promise.all([
      page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/teacher/simulation-ranking" &&
          url.searchParams.get("sort") === "studentName"
        );
      }),
      page.getByRole("button", { name: "Estudante" }).click(),
    ]);
    expect(sortResponse.status()).toBe(200);
    await page.getByLabel("Data inicial").fill("2026-07-10");
    await page.getByLabel("Data final").fill("2026-07-20");
    const [filteredResponse] = await Promise.all([
      page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/teacher/simulation-ranking" &&
          url.searchParams.get("page") === "1" &&
          url.searchParams.get("sort") === "studentName" &&
          url.searchParams.get("startDate") === "2026-07-10" &&
          url.searchParams.get("endDate") === "2026-07-20"
        );
      }),
      page.getByRole("button", { name: "Aplicar filtros" }).click(),
    ]);
    expect(filteredResponse.status()).toBe(200);

    await expect(page.getByText("11 estudantes - pagina 1 de 1")).toBeVisible();
    await expect(page.getByText(data.topStudentEmail)).toBeVisible();
    await expect(page.getByText(data.secondStudentEmail)).toBeVisible();
    await expect(page.getByText(data.beforeRangeStudentEmail)).not.toBeVisible();
    await expect(page.getByText(data.afterRangeStudentEmail)).not.toBeVisible();

    const [resizedResponse] = await Promise.all([
      page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/teacher/simulation-ranking" &&
          url.searchParams.get("page") === "1" &&
          url.searchParams.get("pageSize") === "10" &&
          url.searchParams.get("sort") === "studentName" &&
          url.searchParams.get("startDate") === "2026-07-10" &&
          url.searchParams.get("endDate") === "2026-07-20"
        );
      }),
      page.getByLabel("Linhas").selectOption("10"),
    ]);
    expect(resizedResponse.status()).toBe(200);

    const [nextPageResponse] = await Promise.all([
      page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/teacher/simulation-ranking" &&
          url.searchParams.get("page") === "2" &&
          url.searchParams.get("pageSize") === "10" &&
          url.searchParams.get("sort") === "studentName" &&
          url.searchParams.get("startDate") === "2026-07-10" &&
          url.searchParams.get("endDate") === "2026-07-20"
        );
      }),
      page.getByRole("button", { name: "Proxima" }).click(),
    ]);
    expect(nextPageResponse.status()).toBe(200);
    await expect(page.getByText("11 estudantes - pagina 2 de 2")).toBeVisible();

    const [clearResponse] = await Promise.all([
      page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/teacher/simulation-ranking" &&
          url.searchParams.get("page") === "1" &&
          url.searchParams.get("pageSize") === "10" &&
          url.searchParams.get("sort") === "studentName" &&
          !url.searchParams.has("startDate") &&
          !url.searchParams.has("endDate")
        );
      }),
      page.getByRole("button", { name: "Limpar filtros" }).click(),
    ]);
    expect(clearResponse.status()).toBe(200);
    await expect(page.getByText("13 estudantes - pagina 1 de 2")).toBeVisible();
    await expect(page.getByText(data.beforeRangeStudentEmail)).toBeVisible();
  });

  test("teacher sees a date-range validation error without requesting the ranking", async ({
    page,
  }) => {
    await createSimulationRankingE2eData();

    await loginAs(page, TEST_USERS.teacher);
    await page.goto("/app/professor/ranking");
    await expect(page.getByText("13 estudantes - pagina 1 de 1")).toBeVisible();

    let rankingRequests = 0;
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/teacher/simulation-ranking") {
        rankingRequests += 1;
      }
    });

    await page.getByLabel("Data inicial").fill("2026-07-21");
    await page.getByLabel("Data final").fill("2026-07-20");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();

    await expect(
      page.getByText("A data final deve ser igual ou posterior a data inicial."),
    ).toBeVisible();
    expect(rankingRequests).toBe(0);
  });

  test("student cannot access teacher ranking page or API", async ({ page }) => {
    await createSimulationRankingE2eData();

    await loginAs(page, TEST_USERS.student);
    await page.goto("/app/professor/ranking");
    await expect(page).toHaveURL(ROLE_HOME_PATHS.STUDENT);

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
