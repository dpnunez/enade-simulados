import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs } from "./helpers/auth";
import {
  createSimulatedExamQuestionSet,
  eraseSimulatedExamE2eData,
} from "./helpers/simulated-exams";

test.describe("student simulated exams", () => {
  test.beforeEach(async () => {
    await eraseSimulatedExamE2eData();
  });

  test.afterEach(async () => {
    await eraseSimulatedExamE2eData();
  });

  test("student generates, answers out of order, finishes, and reviews history", async ({
    page,
  }) => {
    const data = await createSimulatedExamQuestionSet("Fluxo Principal");

    await loginAs(page, TEST_USERS.student);
    await page.goto("/app/student/simulados/novo");

    await page.getByLabel(new RegExp(data.title)).check();
    await page.getByLabel("Quantidade").fill("2");
    await page.getByRole("button", { name: "Gerar simulado" }).click();

    await expect(page).toHaveURL(/\/app\/student\/simulados\/[^/]+$/);
    await expect(page.getByText("Responder questoes")).toBeVisible();

    const inProgressHtml = await page.content();
    expect(inProgressHtml).not.toContain("isCorrect");
    expect(inProgressHtml).not.toContain("correctAlternativeId");
    expect(inProgressHtml).not.toContain("correctAnswerExplanation");

    await page.getByRole("button", { name: "2" }).click();
    await page.getByText(/^Alternativa incorreta/).click();
    await page.getByRole("button", { name: "1" }).click();
    await page.getByText(/^Alternativa correta/).click();
    await page.getByRole("button", { name: "2" }).click();
    await expect(page.getByText(/^Alternativa incorreta/)).toBeVisible();

    await page.getByRole("button", { name: "Finalizar e corrigir" }).click();

    await expect(page.getByText("Finalizado")).toBeVisible();
    await expect(page.getByText("1/2 acertos")).toBeVisible();
    await expect(page.getByText("Incorreta", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "1" }).click();
    await expect(page.getByText("Correta", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Voltar ao historico" }).click();

    await expect(page).toHaveURL(/\/app\/student\/simulados$/);
    await expect(page.getByText(data.title)).toBeVisible();
    await expect(page.getByText("1/2 acertos (50%)")).toBeVisible();
  });

  test("teacher and admin cannot access student simulation pages or APIs", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.teacher);
    await page.goto("/app/student/simulados");
    await expect(page).toHaveURL(/\/app$/);

    const teacherApiResponse = await page.evaluate(async () => {
      const response = await fetch("/api/student/simulated-exams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectFieldIds: ["subject_field_1"],
          questionCount: 1,
        }),
      });

      return {
        status: response.status,
        payload: await response.json(),
      };
    });

    expect(teacherApiResponse).toEqual({
      status: 401,
      payload: { success: false, error: "UNAUTHORIZED" },
    });

    await loginAs(page, TEST_USERS.admin);
    await page.goto("/app/student/simulados/novo");
    await expect(page).toHaveURL(/\/app$/);

    const adminApiResponse = await page.evaluate(async () => {
      const response = await fetch("/api/student/simulated-exams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectFieldIds: ["subject_field_1"],
          questionCount: 1,
        }),
      });

      return {
        status: response.status,
        payload: await response.json(),
      };
    });

    expect(adminApiResponse).toEqual({
      status: 401,
      payload: { success: false, error: "UNAUTHORIZED" },
    });
  });
});
