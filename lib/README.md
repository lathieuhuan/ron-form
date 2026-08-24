# Ron Form

A TypeScript-first form state library with a framework-agnostic core and framework integration layers. Values, validation, and field metadata live in plain classes with a subscription model — hooks, utils, and components are adapters on top.

## Architecture

```
lib/
├── core/                   # Framework-agnostic form engine (TypeScript only)
│   ├── FormCore            — values, field state, subscriptions
│   ├── FormControl         — validation, submit, reset, value change subscriptions; extends FormCore
│   ├── FieldControl        — per-field APIs (change/blur handlers...)
│   ├── FieldArrayControl   — per-field APIs for array fields (insert, remove...)
│   ├── FormMetaControl     — form-level meta with subscriptions; acts as a support for FormCore
│   ├── RunningValidatorMap — tracks running async validation; acts as a support for FormCore
│   └── types/              — interfaces for APIs, states, deep keys, validation...
└── react/                # React bindings
    ├── createContexts()  — typed Form, Field, FormMeta, hooks
    └── hooks/            — useForm, useField, useFieldValue
```

## Validation

**Causes:** `change` and `blur`, each with sync and async variants.

**Validator API:**

```ts
type RawError = string | { message: string };

type ValidationResult = RawError | RawError[] | null | undefined;

type Validator = (value, form) => ValidationResult;
```

**Error model:**

- Errors stored per cause: `change`, `blur`, `changeAsync`, `blurAsync`.
- Normalized to `FieldError<TKey>[]` with `path`, `type`, `message`, `meta`.
- Thrown async errors are caught and parsed via `parseRawError`.

```ts
interface FieldError<TKey> {
  path: TKey;
  type: ErrorCauseType;
  message: string;
  meta: ErrorMeta;
}
```

**Async behavior:**

- Debounced (default **300 ms**, configurable via `asyncDebounceMs`).
- In-flight validators cancelled via `AbortController` on re-validation.
- `RunningValidatorMap` tracks concurrent async runs; drives `isValidating` at field and form level.
- Async validation skipped when sync validation already returned errors.

**Manual validation:**

- `validateSync(field, cause, options?)` — options: `shouldBlur`, `shouldTouch`, `shouldDirty`.
- `validateAsync(field, cause)` — immediate async run (cancels pending debounce).
