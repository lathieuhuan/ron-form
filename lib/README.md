# Ron Form

A TypeScript-first form state library with a framework-agnostic core and framework integration layers. Values, validation, and field metadata live in plain classes with a subscription model — hooks, utils, and components are adapters on top.

## Architecture

```
lib/
├── core/          # Framework-agnostic form engine (TypeScript only)
│   ├── FormCore       — values, field state, subscriptions
│   ├── FormControl    — validation, submit, reset, value change events
│   ├── FieldControl   — per-field change/blur handlers
│   ├── FormMetaControl — form-level meta with subscriptions
│   └── types/         — typed APIs, deep keys, validation types
└── react/         # React bindings
    ├── createContexts() — typed Form, Field, FormMeta, hooks
    └── hooks/           — useForm, useField, useFieldValue
```

**Layering**

| Layer          | Responsibility                                                                   |
| -------------- | -------------------------------------------------------------------------------- |
| `FormCore`     | Holds values, per-field state (value / meta / errors), field subscriptions       |
| `FormControl`  | Extends core with sync/async validation, submit, reset, value-change subscribers |
| `FieldControl` | Bridges user interaction (`handleChange`, `handleBlur`) to form logic for fields |
| React          | Subscribes to core state and exposes render-prop / hook APIs                     |

## Validation

**Causes:** `change` and `blur`, each with sync and async variants.

**Validator API:**

```ts
type RawError = string | { message: string };

type ValidationResult = RawError | RawError[] | null | undefined;

type Validator = ({ value, form }) => ValidationResult;
```

**Error model:**

- Errors stored per cause: `change`, `blur`, `changeAsync`, `blurAsync`.
- Normalized to `FieldError<TKey>[]` with `path`, `type`, `message`, `meta`.
- Thrown async errors are caught and parsed via `parseRawError`.

**Async behavior:**

- Debounced (default **300 ms**, configurable via `asyncDebounceMs`).
- In-flight validators cancelled via `AbortController` on re-validation.
- `RunningValidatorMap` tracks concurrent async runs; drives `isValidating` at field and form level.
- Async validation skipped when sync validation already returned errors.

**Manual validation:**

- **`validateSync(field, cause, options?)`** — options: `shouldBlur`, `shouldTouch`, `shouldDirty`.
- **`validateAsync(field, cause)`** — immediate async run (cancels pending debounce).
