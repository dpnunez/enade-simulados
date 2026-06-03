import { expect, type Page, test } from "@playwright/test";

import { TEST_USERS } from "./fixtures/users";
import { loginAs } from "./helpers/auth";
import {
  buildQuestionDescription,
  countQuestionsByEquivalentDescription,
  createQuestionE2eData,
  eraseQuestionE2eData,
  ensureQuestionSubjectField,
} from "./helpers/questions";

async function descriptionEditor(page: Page) {
  return page.getByRole("textbox", { name: "editable markdown" });
}

async function fillDescription(page: Page, description: string) {
  const editor = await descriptionEditor(page);
  await editor.fill(description);
}

async function fillCreateQuestionForm(
  page: Page,
  subjectFieldId: string,
  description: string,
) {
  await fillDescription(page, description);
  await page.getByLabel("Grande area").selectOption(subjectFieldId);
  await page.getByLabel("Fonte").selectOption("MANUAL");
  await page.getByLabel("Ano").fill("2024");
  await page
    .getByLabel("Explicacao da resposta correta")
    .fill("Explicacao deterministica para teste.");

  await page.getByRole("textbox", { name: "Alternativa A" }).fill("Alternativa correta.");
  await page
    .getByRole("textbox", { name: "Alternativa B" })
    .fill("Alternativa incorreta 1.");
  await page
    .getByRole("textbox", { name: "Alternativa C" })
    .fill("Alternativa incorreta 2.");
  await page
    .getByRole("textbox", { name: "Alternativa D" })
    .fill("Alternativa incorreta 3.");
  await page
    .getByRole("textbox", { name: "Alternativa E" })
    .fill("Alternativa incorreta 4.");
}

test.describe("question deduplication", () => {
  test.beforeEach(async () => {
    await eraseQuestionE2eData();
  });

  test.afterEach(async () => {
    await eraseQuestionE2eData();
  });

  test("teacher cannot create an equivalent duplicate question", async ({ page }) => {
    const subjectFieldId = await ensureQuestionSubjectField("Deduplicacao Criacao");
    const description = buildQuestionDescription("Deduplicacao Criacao");

    await loginAs(page, TEST_USERS.teacher);
    await page.goto("/app/professor/questoes/nova");

    await fillCreateQuestionForm(page, subjectFieldId, description);
    await page.getByRole("button", { name: "Criar questao" }).click();
    await expect(page).toHaveURL(/\/app\/professor\/questoes$/);

    await page.goto("/app/professor/questoes/nova");
    await fillCreateQuestionForm(page, subjectFieldId, description);
    await page.getByRole("button", { name: "Criar questao" }).click();

    await expect(
      page.getByText("Ja existe uma questao com este enunciado."),
    ).toBeVisible();
    await expect(await descriptionEditor(page)).toContainText("Deduplicacao");
    await expect
      .poll(() => countQuestionsByEquivalentDescription(description))
      .toBe(1);
  });

  test("teacher cannot edit a question to duplicate another question", async ({
    page,
  }) => {
    const original = await createQuestionE2eData("Deduplicacao Edicao Original");
    const target = await createQuestionE2eData("Deduplicacao Edicao Alvo");

    await loginAs(page, TEST_USERS.teacher);
    await page.goto(`/app/professor/questoes/${original.questionId}`);

    await fillDescription(page, target.descriptionMarkdown);
    await page.getByRole("button", { name: "Salvar alteracoes" }).click();

    await expect(
      page.getByText("Ja existe uma questao com este enunciado."),
    ).toBeVisible();
    await expect(await descriptionEditor(page)).toContainText("Deduplicacao Edicao Alvo");
    await expect
      .poll(() => countQuestionsByEquivalentDescription(target.descriptionMarkdown))
      .toBe(1);
    await expect
      .poll(() => countQuestionsByEquivalentDescription(original.descriptionMarkdown))
      .toBe(1);
  });
});
