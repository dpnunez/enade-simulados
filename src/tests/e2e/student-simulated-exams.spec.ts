import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs, ROLE_HOME_PATHS } from "./helpers/auth";
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
    await page.goto("/app/aluno/simulados/novo");

    await page.getByLabel(new RegExp(data.title)).check();
    await expect(page.getByText("1 selecionadas")).toBeVisible();
    await expect(
      page.getByText(`${data.questions.length} questoes disponiveis na selecao`),
    ).toBeVisible();
    await page.getByLabel("Quantidade").fill("2");
    await page.getByRole("button", { name: "Gerar simulado" }).click();

    await expect(page).toHaveURL(/\/app\/aluno\/simulados\/[^/]+$/);
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

    await page.getByRole("link", { name: "Voltar a lista" }).click();

    await expect(page).toHaveURL(/\/app\/aluno\/lista-simulados$/);
    await expect(page.getByRole("heading", { name: "Lista de simulados" })).toBeVisible();
    await expect(page.getByText(data.title)).toBeVisible();
    await expect(page.getByText("1/2 acertos (50%)")).toBeVisible();
    await expect(page.getByRole("link", { name: "Revisar resultado" })).toBeVisible();
  });

  test("student saves draft answers, reopens, and finishes later", async ({
    page,
  }) => {
    const data = await createSimulatedExamQuestionSet("Rascunho");

    await loginAs(page, TEST_USERS.student);
    await page.goto("/app/aluno/simulados/novo");

    await page.getByLabel(new RegExp(data.title)).check();
    await page.getByLabel("Quantidade").fill("2");
    await page.getByRole("button", { name: "Gerar simulado" }).click();

    await expect(page).toHaveURL(/\/app\/aluno\/simulados\/(?!novo$)[^/]+$/);
    await expect(page.getByText("Responder questoes")).toBeVisible();
    const attemptId = page.url().split("/").at(-1);
    expect(attemptId).toBeTruthy();

    const inProgressHtml = await page.content();
    expect(inProgressHtml).not.toContain("isCorrect");
    expect(inProgressHtml).not.toContain("correctAlternativeId");
    expect(inProgressHtml).not.toContain("correctAnswerExplanation");

    await page.getByText(/^Alternativa correta/).click();
    const [saveResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/student/simulated-exams/") &&
          response.url().includes("/answers") &&
          response.request().method() === "PUT",
      ),
      page.getByRole("button", { name: "Salvar respostas" }).click(),
    ]);
    const savePayload = await saveResponse.json();
    const serializedSavePayload = JSON.stringify(savePayload);

    expect(saveResponse.status()).toBe(200);
    expect(savePayload.success).toBe(true);
    expect(serializedSavePayload).not.toContain("isCorrect");
    expect(serializedSavePayload).not.toContain("correctAlternativeId");
    expect(serializedSavePayload).not.toContain("correctAnswerExplanation");
    await expect(page.getByText("Respostas salvas.")).toBeVisible();
    await expect(page.getByText("Em andamento")).toBeVisible();

    await page.getByRole("link", { name: "Voltar a lista" }).click();
    await expect(page).toHaveURL(/\/app\/aluno\/lista-simulados$/);
    await expect(page.getByText("Em andamento", { exact: true })).toBeVisible();
    await expect(page.getByText("1/2 respondidas")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Retomar e finalizar" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Retomar e finalizar" }).click();
    await expect(page.getByText("Responder questoes")).toBeVisible();
    await expect(page.getByLabel(/^Alternativa correta/)).toBeChecked();
    await expect(page.getByText("Em andamento")).toBeVisible();

    await page.getByRole("button", { name: "Finalizar e corrigir" }).click();
    await expect(page.getByText("Finalizado")).toBeVisible();
    await expect(page.getByText("1/2 acertos")).toBeVisible();
    await expect(page.getByText("Correta", { exact: true })).toBeVisible();

    const saveAfterFinalization = await page.evaluate(async (id) => {
      const response = await fetch(
        `/api/student/simulated-exams/${id}/answers`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answers: [] }),
        },
      );

      return {
        status: response.status,
        payload: await response.json(),
      };
    }, attemptId);

    expect(saveAfterFinalization).toEqual({
      status: 409,
      payload: {
        success: false,
        error: "SIMULATION_ATTEMPT_ALREADY_COMPLETED",
      },
    });
  });

  test("teacher and admin cannot access student simulation pages or APIs", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.teacher);
    await page.goto("/app/aluno/lista-simulados");
    await expect(page).toHaveURL(ROLE_HOME_PATHS.TEACHER);

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
    await page.goto("/app/aluno/simulados/novo");
    await expect(page).toHaveURL(ROLE_HOME_PATHS.ADMIN);

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

  test("legacy student URLs redirect to canonical aluno routes", async ({ page }) => {
    await loginAs(page, TEST_USERS.student);

    await page.goto("/app/student/simulados");
    await expect(page).toHaveURL(/\/app\/aluno\/lista-simulados$/);

    await page.goto("/app/student/simulados/novo");
    await expect(page).toHaveURL(/\/app\/aluno\/simulados\/novo$/);
  });
});
