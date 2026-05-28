import { expect, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs } from "./helpers/auth";
import {
  buildSubjectFieldTitle,
  countSubjectFieldRollupRows,
  createSubjectFieldWithQuestions,
  eraseSubjectFieldE2eData,
} from "./helpers/subject-fields";

test.describe('"grande area" management', () => {
  test.beforeEach(async () => {
    await eraseSubjectFieldE2eData();
  });

  test.afterEach(async () => {
    await eraseSubjectFieldE2eData();
  });

  test('teacher creates, edits, and deletes a "grande area"', async ({ page }) => {
    const initialTitle = buildSubjectFieldTitle("CRUD");
    const updatedTitle = buildSubjectFieldTitle("CRUD Atualizada");

    await loginAs(page, TEST_USERS.teacher);
    await page.goto("/app/professor/grandes-areas");

    await expect(
      page.getByRole("heading", { name: "Gerenciar grandes areas" }),
    ).toBeVisible();

    await page.getByLabel("Titulo").fill(initialTitle);
    await page
      .getByLabel("Descricao")
      .fill("Descricao criada pelo fluxo e2e de grandes areas.");
    await page.getByLabel("Hexadecimal").fill("#2563EB");
    await page.getByRole("button", { name: "Criar grande area" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Grande area criada com sucesso.",
    );

    await page.reload();
    await expect(page.getByRole("heading", { name: initialTitle })).toBeVisible();
    await expect(page.getByText("#2563EB")).toBeVisible();

    await page.getByRole("button", { name: "Editar" }).click();
    await page.getByLabel("Titulo").last().fill(updatedTitle);
    await page
      .getByLabel("Descricao")
      .last()
      .fill("Descricao atualizada pelo fluxo e2e de grandes areas.");
    await page.getByLabel("Hexadecimal").last().fill("#16A34A");
    await page.getByRole("button", { name: "Salvar alteracoes" }).click();
    await expect(page.getByRole("heading", { name: updatedTitle })).toBeVisible();
    await expect(page.getByText("#16A34A")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: updatedTitle })).toBeVisible();
    await expect(page.getByText("#16A34A")).toBeVisible();

    await page.getByRole("button", { name: "Deletar" }).click();
    await expect(
      page.getByText(`Esta acao remove a grande area "${updatedTitle}" do catalogo.`),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: updatedTitle })).toBeVisible();

    await page.getByRole("button", { name: "Deletar" }).click();
    await page.getByRole("button", { name: "Confirmar delecao" }).click();

    await page.reload();
    await expect(page.getByRole("heading", { name: updatedTitle })).toHaveCount(0);
  });

  test("teacher sees question count and deletes related questions by cascade", async ({
    page,
  }) => {
    const subjectField = await createSubjectFieldWithQuestions("Rollup", 2);

    await loginAs(page, TEST_USERS.teacher);
    await page.goto("/app/professor/grandes-areas");

    await expect(page.getByRole("heading", { name: subjectField.title })).toBeVisible();
    await expect(page.getByText("2 questoes")).toBeVisible();

    await page.getByRole("button", { name: "Deletar" }).click();
    await page.getByRole("button", { name: "Confirmar delecao" }).click();
    await expect(page.getByRole("heading", { name: subjectField.title })).toHaveCount(0);

    await expect
      .poll(() =>
        countSubjectFieldRollupRows(
          subjectField.subjectFieldId,
          subjectField.questionIds,
        ),
      )
      .toEqual({
        subjectFields: 0,
        questions: 0,
        alternatives: 0,
      });
  });

  test('student cannot access the "grande area" management page', async ({ page }) => {
    await loginAs(page, TEST_USERS.student);

    await page.goto("/app/professor/grandes-areas");

    await expect(page).toHaveURL(/\/app$/);
    await expect(
      page.getByRole("heading", {
        name: "Qualquer usuário autenticado pode ver esta página.",
      }),
    ).toBeVisible();
  });
});
