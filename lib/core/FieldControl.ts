import type { FormControl } from "./FormControl";
import type { DeepKeys, DeepValue, FieldError } from "./types";

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
    const errorMap = form.getFieldErrorMap(name);
    let newMeta = meta;
    let newErrorMap = errorMap;

    if (!meta.isBlurred || !meta.isTouched) {
      newMeta = {
        ...meta,
        isBlurred: true,
        isTouched: true,
      };

      form.fieldMetaMap.set(name, newMeta);
    }

    if (errorMap.blurAsync != null && errorMap.blurAsync.length > 0) {
      newErrorMap = {
        ...errorMap,
        blurAsync: [],
      };

      form.fieldErrorMap.set(name, newErrorMap);
    }

    let errors: FieldError<TField>[] = [];

    // TODO check if it is handled correctly,
    // we want no field update when these conditions are met:
    // - meta before handleBlur: isBlurred === true & isTouched === true
    // - no blur async validators are registered
    // - no blur sync validators are registered OR no blur sync errors
    if (form.validators.blur[name] != null) {
      errors = form._validateSync(name, "blur");
    } else {
      form.updateAndNotifyField(name, {
        meta: newMeta === meta ? undefined : newMeta,
        errorMap: newErrorMap === errorMap ? undefined : newErrorMap,
      });
    }

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
