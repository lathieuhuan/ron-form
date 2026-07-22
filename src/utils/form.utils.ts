import type { DeepKeys, DeepValue } from "@lib/core";
import type { ReactFieldStrictApi } from "@lib/react";
import type { FormFieldProps } from "@src/components/form";

type FormFieldBindingProps = {
  id: string;
  name: string;
  isValidating: boolean;
  error: string | null;
};

function makeFieldRenderer<TField extends ReactFieldStrictApi<any, any>, TSelection>(
  select: (field: TField) => TSelection,
) {
  return (render: (selection: TSelection) => React.ReactElement) => {
    return (field: TField): React.ReactElement => {
      return render(select(field));
    };
  };
}

function selectFieldProps<TValues, TKey extends DeepKeys<TValues>>(
  field: ReactFieldStrictApi<TValues, TKey>,
) {
  const error = field.errors.at(0);
  const invalid = error != null && (field.meta.isBlurred || field.form.meta.get().submitCount > 0);

  const fieldProps = {
    id: field.id,
    name: field.name,
    isValidating: field.meta.isValidating,
    error: invalid ? error.message : null,
  } satisfies Pick<FormFieldProps, "id" | "name" | "isValidating" | "error">;

  return fieldProps;
}

// ===== INPUT =====

type InputBindingProps<T> = {
  id: string;
  value: T;
  "aria-invalid": boolean;
  onChange: (value: T) => void;
  onBlur: () => void;
};

type InputFieldBindings<TValues, TKey extends DeepKeys<TValues>> = {
  fieldProps: FormFieldBindingProps;
  inputProps: InputBindingProps<DeepValue<TValues, TKey>>;
};

export function selectInputFieldProps<TValues, TKey extends DeepKeys<TValues>>(
  field: ReactFieldStrictApi<TValues, TKey>,
): InputFieldBindings<TValues, TKey> {
  //
  const fieldProps = selectFieldProps(field);

  const inputProps: InputBindingProps<DeepValue<TValues, TKey>> = {
    id: field.id,
    value: field.value,
    "aria-invalid": fieldProps.error != null,
    onBlur: () => {
      field.handleBlur();
    },
    onChange: (value: DeepValue<TValues, TKey>) => {
      field.handleChange(value);
    },
  };

  return {
    fieldProps,
    inputProps,
  };
}

export const renderInputField = makeFieldRenderer(selectInputFieldProps);

// ===== SELECT =====

type SelectBindingProps<T> = {
  id: string;
  value: T;
  "aria-invalid": boolean;
  onChange: (value: T) => void;
  onOpenChange: (open: boolean) => void;
};

type SelectFieldBindings<TValues, TKey extends DeepKeys<TValues>> = {
  fieldProps: FormFieldBindingProps;
  selectProps: SelectBindingProps<DeepValue<TValues, TKey>>;
};

export function selectSelectFieldProps<TValues, TKey extends DeepKeys<TValues>>(
  field: ReactFieldStrictApi<TValues, TKey>,
): SelectFieldBindings<TValues, TKey> {
  //
  const fieldProps = selectFieldProps(field);

  const selectProps: SelectBindingProps<DeepValue<TValues, TKey>> = {
    id: field.id,
    value: field.value,
    "aria-invalid": fieldProps.error != null,
    onOpenChange: (open: boolean) => {
      if (open) {
        field.form.setFieldMeta(field.name, (meta) => {
          if (!meta.isTouched) {
            return {
              ...meta,
              isTouched: true,
            };
          }

          return meta;
        });
      } else {
        field.handleBlur();
      }
    },
    onChange: (value: DeepValue<TValues, TKey>) => {
      field.handleChange(value);
    },
  };

  return {
    fieldProps,
    selectProps,
  };
}

export const renderSelectField = makeFieldRenderer(selectSelectFieldProps);
