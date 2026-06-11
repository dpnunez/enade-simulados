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

First migrated form: `src/app/login/_components/login-form.tsx`
- Keeps native `<form onSubmit>` + submit button for Enter submission
- Uses `Controller` for email/password; other forms intentionally not migrated yet

Updated: 2026-06-11
