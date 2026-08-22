import type { FormControl } from "./FormControl";
import type { ChangeCause, DeepKeys, DeepValue, FieldError } from "./types";
import { transformErrors } from "./utils/transformErrors";

export type HandleChangeOptions = {
  cause?: ChangeCause;
};

export class FieldControl<TFormValues, TField extends DeepKeys<TFormValues>> {
  form: FormControl<TFormValues>;
  name: TField;

  constructor(form: FormControl<TFormValues>, field: TField) {
    this.form = form;
    this.name = field;
  }

  handleChange = (value: DeepValue<TFormValues, TField>, options?: HandleChangeOptions) => {
    this.form.setFieldValue(this.name, value, {
      cause: options?.cause,
    });
  };

  handleBlur = () => {
    const { name, form } = this;

    // ===== CLEANUP =====

    form.abortCtrlMaps.blur.get(name)?.abort();

    let timeoutId = form.timeoutIdMaps.blur.get(name);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    // ===== MAIN LOGIC =====

    let meta = form.getFieldMeta(name);
    let errorMap = form.getFieldErrorMap(name);

    if (!meta.isBlurred || !meta.isTouched) {
      meta = {
        ...meta,
        isBlurred: true,
        isTouched: true,
      };
    }

    // Clear blur async errors if any
    if (errorMap.blurAsync != null && errorMap.blurAsync.length) {
      errorMap = {
        ...errorMap,
        blurAsync: [],
      };
    }

    const syncValidator = form.validators.blur[name];
    let errors: FieldError<TField>[] = [];

    if (syncValidator != null) {
      const value = form.getFieldValue(name);

      errors = transformErrors(name, "blur", syncValidator({ value, form }));

      if (errors.length || errorMap.blur?.length) {
        errorMap = {
          ...errorMap,
          blur: errors,
        };
      }
    }

    form.updateAndNotifyField(name, {
      meta,
      errorMap,
    });

    form.syncMeta();

    const validationSpec = form.asyncValidationSpec("blur", name);

    // TODO add an option to validate async even if there are sync errors
    if (errors.length === 0 && validationSpec.validator != null) {
      const abortCtrl = new AbortController();

      form.abortCtrlMaps.blur.set(name, abortCtrl);

      timeoutId = setTimeout(async () => {
        if (abortCtrl.signal.aborted) {
          return;
        }

        form.meta.set({ isValidating: true });

        await form._validateAsync(validationSpec, abortCtrl);

        form.meta.set({
          isValidating: form.runningValidatorMap.isAnyRunning(),
        });
      }, form.asyncDebounceMs);

      form.timeoutIdMaps.blur.set(name, timeoutId);
    }
  };
}
