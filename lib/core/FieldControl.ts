import type { FormControl } from "./FormControl";
import type { DeepKeys, DeepValue, FieldError, FieldMeta } from "./types";
import { transformErrors } from "./utils/transformErrors";

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

    let newMeta = form.getFieldMeta(name);
    let newErrorMap = form.getFieldErrorMap(name);

    if (!newMeta.isBlurred || !newMeta.isTouched) {
      newMeta = {
        ...newMeta,
        isBlurred: true,
        isTouched: true,
      };

      form.fieldMetaMap.set(name, newMeta);
    }

    // Clear blur async errors if any
    if (newErrorMap.blurAsync != null && newErrorMap.blurAsync.length) {
      newErrorMap = {
        ...newErrorMap,
        blurAsync: [],
      };

      form.fieldErrorMap.set(name, newErrorMap);
    }

    const syncValidator = form.validators.blur[name];
    let errors: FieldError<TField>[] = [];

    if (syncValidator != null) {
      const value = form.getFieldValue(name);

      errors = transformErrors(name, "blur", syncValidator({ value }));

      if (errors.length || newErrorMap.blur?.length) {
        newErrorMap = {
          ...newErrorMap,
          blur: errors,
        };
      }
    }

    form.updateAndNotifyField(name, {
      meta: newMeta,
      errorMap: newErrorMap,
    });

    form.syncMeta();

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
