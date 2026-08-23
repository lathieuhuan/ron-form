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

    const errors = form.validateSync(name, "blur", {
      shouldBlur: true,
      shouldTouch: true,
    });

    // Clean up running async validation even if:
    // - there is no running async validation
    // - there is no upcoming async validation
    let timeoutId = form.timeoutIdMaps.blur.get(name);

    form.abortCtrlMaps.blur.get(name)?.abort();
    clearTimeout(timeoutId);

    // TODO add an option to validate async even if there are sync errors
    if (errors.length > 0) {
      return;
    }

    const validationSpec = form.asyncValidationSpec("blur", name);

    if (validationSpec.validator != null) {
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
