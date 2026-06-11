# Form Fields
> shadcn Field/InputGroup pattern for accessible inputs

Entry: `src/components/ui/field.tsx`

Use for app forms:
- React Hook Form fields should use `Controller` with `field` + `fieldState`
- `FieldGroup` wraps related fields and actions
- `Field` wraps a single control; set `data-invalid` from validation state
- `FieldLabel` replaces plain `Label` inside fields
- Spread `field` onto `Input`/`InputGroupInput`; set `aria-invalid={fieldState.invalid}`
- `FieldError errors={[fieldState.error]}` renders validation feedback
- `InputGroup` + `InputGroupAddon` + `InputGroupInput` for inputs with icons/addons

Migrated forms:
- `src/app/login/_components/login-form.tsx`
- `src/app/esqueci-senha/_components/request-password-reset-form.tsx`
- `src/app/redefinir-senha/[token]/_components/confirm-password-reset-form.tsx`

Submission pattern:
- Keep native `<form onSubmit>` + submit button for Enter submission
- Use `http` from `@infra/http/client` for app API calls when the form submits to internal API routes

Updated: 2026-06-11
