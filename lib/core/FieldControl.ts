import type { FormControl } from "./FormControl";
import type { ChangeCause, DeepKeys, DeepValue } from "./types";

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

    // ===== VALIDATE SYNC =====

    const errors = form.validateSync(name, "blur", {
      shouldBlur: true,
      shouldTouch: true,
      shouldDirty: false,
    });

    // ===== VALIDATE ASYNC =====
    // TODO recheck logic

    form.abortCtrlMaps.blur.get(name)?.abort();

    let timeoutId = form.timeoutIdMaps.blur.get(name);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

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
