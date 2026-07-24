# Features

## Core

[✓] Typed form values & deep field paths
[✓] Form & field meta: isBlurred, isTouched, isDirty, isValidating...
[✓] Form meta & field state { value, meta, errorMap } subscriptions
[✓] Sync & async field validation for different causes (change, blur)
[✓] Submit & reset
[✓] Field value subscriptions
[ ] `reset(values?)` — optionally reset to new default values
[ ] `resetField(field, options?)` — reset a single field's value, meta, and errors.
[ ] `isValid` form meta aggregating all field errors
[ ] `validateAll` - Validate a field and all sub-fields
[ ] `alwaysAsync` - option to run async validators even if sync validation not passed
[ ] `isSubmitting` form meta, `handleSubmit` async support — await async `onSubmit`
[ ] `useFieldArray` / array helpers — append, prepend, insert, remove, swap, move for dynamic lists
[ ] Dependent validation — re-validate field B when field A changes
[ ] Conditional render: option/helper to clear value on field removed
[ ] Conditional render: option/helper to disable validation on field removed
[ ] Per-field async debounce — override global `asyncDebounceMs` per field or validator.
[ ] Reinitialize on external data — pattern/API for loading async default values (edit forms, prefilled drafts).
[ ] schema adapters

## React Integration

[✓] hook `useForm`
[✓] hook `useField` & `useFieldValue`
[✓] generic `createContexts<TFormValues>()` to produce typed hooks and components
[✓] (createContexts) `useFormInstance`
[✓] (createContexts) `Form`, `FormMeta`, `Field`
[ ] hook `useFieldValues` — subscription for multiple field values
[ ] Focus & scroll to first invalid field

## Under-consideration Features

- `submitValidators`
- `setFieldError` / `clearFieldError` / `clearErrors`
- `setValues(partial)` — update multiple fields in one pass with a single meta/validation pass.
- `revalidationMode`
- `useFormState` — subscribe to selected slices of form meta (e.g. `isDirty`, `isValid`, `submitCount`) without re-rendering the whole form.
- `<form onSubmit>` helper — wire `preventDefault`, `handleSubmit`, and Enter-key submission correctly.
- Hidden native inputs — optional bridge for non-JS fallback or browser autofill hints.
- DevTools panel — inspect values, meta, errors, and validator timing (extend demo `form-supervisor` into an optional dev package).
- Debug logging — opt-in trace of validation runs, cancellations, and notification short-circuits.
- Draft autosave — subscribe to value changes and persist to `localStorage` / session storage with restore on mount.
- Selector-based subscriptions — subscribe to a derived slice of field state (e.g. only `meta.isValidating`) to reduce re-renders.

---

## Side to-dos

- [ ] Test clearing values (`undefined` / `null`)
