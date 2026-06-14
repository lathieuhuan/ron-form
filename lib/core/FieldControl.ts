import type { FormControl } from "./FormControl";
import type { DeepKeys, DeepValue } from "./types";

export class FieldControl<TFormValues, TField extends DeepKeys<TFormValues>> {
  form: FormControl<TFormValues>;
  name: TField;

  constructor(form: FormControl<TFormValues>, field: TField) {
    this.form = form;
    this.name = field;
  }

  handleChange = (value: DeepValue<TFormValues, TField>) => {
    this.form.setFieldValue(this.name, value);
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

    const meta = form.getFieldMeta(name);

    if (!meta.isTouched) {
      form.setFieldMeta(name, {
        ...meta,
        isTouched: true,
      });
    }

    const errors = form._validateSync(name, "blur", {
      clearAsyncErrors: true,
    });

    form.updateMeta();

    // TODO add an option to validate async even if there are sync errors
    if (errors.length === 0 && form.asyncValidators.blur[name] != null) {
      const abortCtrl = new AbortController();

      form.abortCtrlMaps.blur.set(name, abortCtrl);

      timeoutId = setTimeout(() => {
        form.validateAsync(name, "blur", abortCtrl);
      }, form.asyncDebounceMs);

      form.timeoutIdMaps.blur.set(name, timeoutId);
    }
  };
}
