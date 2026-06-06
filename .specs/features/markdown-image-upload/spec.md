# Markdown Image Upload Specification

## Problem Statement

Professores precisam inserir imagens no enunciado markdown de questoes sem sair do editor. O armazenamento sera feito no Supabase Storage, mas o editor markdown nao deve conhecer Supabase, credenciais, bucket ou detalhes de provider.

## Goals

- [ ] Permitir upload de imagens pelo `MarkdownEditor`.
- [ ] Inserir no markdown uma referencia de imagem persistente apos upload concluido.
- [ ] Criar uma abstracao de storage para que o componente nao dependa de Supabase.
- [ ] Manter credenciais e integracao Supabase apenas no servidor.
- [ ] Validar autenticacao, role, tipo e tamanho do arquivo antes do envio ao storage.
- [ ] Cobrir contrato de upload com testes unitarios e fluxo principal com E2E.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Upload resumable/TUS | O MVP mira imagens pequenas de questoes; Supabase recomenda upload padrao para arquivos pequenos e TUS para arquivos maiores. |
| Galeria de arquivos enviados | O pedido e inserir imagem pelo editor; gestao de midia pode ser planejada depois. |
| Exclusao automatica de imagens orfas | Exige rastrear referencias em markdown e lifecycle de questoes; fica para fase posterior. |
| Bucket privado com URL assinada expirada | Markdown precisa de URL persistente; se privacidade for requisito, planejar proxy de imagens ou renovacao controlada. |
| Upload de SVG | SVG amplia risco de script/conteudo ativo e CSP; o MVP aceita formatos raster comuns. |
| Redimensionamento/otimizacao de imagem | Supabase tem recursos de transformacao, mas o MVP so salva e referencia a imagem original. |

---

## User Stories

### P1: Professor Insere Imagem No Markdown MVP

**User Story**: As a teacher, I want to upload an image from the markdown editor so that visual question statements can be authored without manual URL handling.

**Why P1**: E o fluxo central solicitado e desbloqueia questoes com graficos, figuras e apoios visuais.

**Acceptance Criteria**:

1. WHEN a TEACHER opens the question form THEN system SHALL show an image insertion control in the markdown editor toolbar.
2. WHEN the teacher selects a valid image file THEN system SHALL upload the image through an application upload boundary.
3. WHEN upload succeeds THEN system SHALL insert markdown image syntax using the returned persistent URL.
4. WHEN the question is saved THEN system SHALL persist the markdown containing the image URL in `descriptionMarkdown`.
5. WHEN the editor calls the upload capability THEN the component SHALL call a generic upload function and SHALL NOT import or reference Supabase.

**Independent Test**: Login as `teacher@enade.local`, open `/app/professor/questoes/nova`, upload a PNG from the markdown editor, save the question, reload edit mode, and verify the markdown still references the uploaded image URL.

---

### P1: Upload E Autorizado E Validado No Servidor

**User Story**: As a product owner, I want uploads protected and validated server-side so that only authorized teachers can store acceptable question images.

**Why P1**: Upload e uma fronteira sensivel: sem validacao, o storage vira um ponto facil para abuso ou arquivos inesperados.

**Acceptance Criteria**:

1. WHEN an unauthenticated user calls the upload route THEN system SHALL return `UNAUTHORIZED` and store no file.
2. WHEN an authenticated non-TEACHER calls the upload route THEN system SHALL return `UNAUTHORIZED` and store no file.
3. WHEN the uploaded file is missing THEN system SHALL return `VALIDATION_ERROR`.
4. WHEN the uploaded file MIME type is not an allowed raster image type THEN system SHALL return `VALIDATION_ERROR`.
5. WHEN the uploaded file exceeds the configured max size THEN system SHALL return `VALIDATION_ERROR`.
6. WHEN Supabase upload fails THEN system SHALL return `STORAGE_UPLOAD_ERROR` without leaking provider internals.

**Independent Test**: Submit multipart upload requests with invalid role, invalid MIME type, oversized file, and valid PNG; verify only the valid teacher upload reaches the storage adapter.

---

### P1: Storage Provider Fica Abstraido

**User Story**: As a developer, I want a storage abstraction for image upload so that the markdown editor and form can work with any future provider.

**Why P1**: O usuario explicitamente pediu que o componente nao saiba nada de Supabase.

**Acceptance Criteria**:

1. WHEN the editor receives upload support THEN it SHALL depend on a type like `(file: File) => Promise<string>` or `MarkdownImageUploadHandler`.
2. WHEN the app route handles upload THEN it SHALL call a feature/service contract such as `uploadMarkdownImage(input, actor)`.
3. WHEN storage is implemented with Supabase THEN provider details SHALL live in an infra adapter, not in the markdown component.
4. WHEN tests exercise editor upload THEN they SHALL mock the generic upload handler, not Supabase.
5. WHEN tests exercise the upload service THEN they SHALL mock the storage adapter contract.

**Independent Test**: Replace the storage adapter with a fake implementation in tests and verify the editor/upload route still satisfy the same contract.

---

## Edge Cases

- WHEN upload is still pending THEN system SHALL keep the editor usable state clear and prevent silent insertion of broken markdown.
- WHEN upload fails THEN system SHALL show a user-visible error near the editor or via the editor dialog.
- WHEN the original filename contains spaces, accents, path separators, or unsafe characters THEN system SHALL generate a safe unique storage key.
- WHEN two teachers upload files with the same name THEN system SHALL avoid overwriting by using unique object keys and `upsert: false`.
- WHEN the browser sends `application/octet-stream` for an image THEN system SHALL reject unless a deliberate sniffing strategy is added later.
- WHEN the file is SVG THEN system SHALL reject it in MVP.
- WHEN environment variables for Supabase storage are missing THEN system SHALL fail fast with a clear server-side configuration error.
- WHEN the upload succeeds but question save later fails THEN system MAY leave an orphaned object; cleanup is out of scope and tracked for later.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MIMG-01 | P1: Professor Insere Imagem No Markdown MVP | Execute | Partial: editor/form wired; E2E pending |
| MIMG-02 | P1: Professor Insere Imagem No Markdown MVP | Execute | Partial: API/helper wired; E2E pending |
| MIMG-03 | P1: Upload E Autorizado E Validado No Servidor | Execute | Implemented with unit/integration-light coverage |
| MIMG-04 | P1: Storage Provider Fica Abstraido | Execute | Implemented |
| MIMG-05 | Edge Cases: chaves, falhas, config e orfaos | Execute | Implemented except orphan cleanup remains out of scope |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped. Browser E2E remains pending for the main teacher upload flow.

---

## Success Criteria

- [x] `MarkdownEditor` exposes image upload without importing Supabase.
- [ ] `teacher@enade.local` can upload a valid raster image and see markdown image syntax inserted.
- [x] Upload route rejects anonymous, non-teacher, invalid MIME and oversized files.
- [x] Supabase credentials stay server-side via `SUPABASE_SECRET_KEY`.
- [x] Storage implementation can be swapped in tests through an adapter contract.
- [ ] Unit tests cover validation/service/adapter boundaries and E2E covers the main browser flow.
