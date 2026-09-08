# Quick Task 002: Exibir explicacao da resposta ao aluno

**Date:** 2026-09-08
**Status:** Done

## Description

Exibir a explicacao cadastrada da resposta na revisao de um simulado finalizado, independentemente de o aluno ter acertado ou errado.

## Files Changed

- `src/app/app/aluno/simulados/_components/simulation-attempt-view.tsx` — renderiza a explicacao em Markdown apenas no modo finalizado.
- `src/app/app/aluno/simulados/_components/simulation-attempt-explanation.test.tsx` — cobre respostas corretas e incorretas.
- `src/tests/e2e/student-simulated-exams.spec.ts` — valida a explicacao no fluxo real de finalizacao e navegacao entre questoes.
- `.notebook/student-simulated-exams.md` — registra o comportamento da revisao final.

## Verification

- [x] A explicacao aparece depois de uma resposta correta.
- [x] A explicacao aparece depois de uma resposta incorreta.
- [x] Explicacoes nulas ou vazias nao geram um bloco vazio.
- [x] A explicacao continua indisponivel durante o simulado em andamento.
- [x] Suite unitaria, lint direcionado e build passam.

## Commit

`fix(simulados): exibir explicacao na revisao do aluno`
