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
    const validationSpec = form.asyncValidationSpec("blur", name);
    const { fieldId } = validationSpec;

    if (fieldId != null) {
      const timeoutId = form.timeoutIdMaps.blur.get(fieldId);

      clearTimeout(timeoutId);
      form.timeoutIdMaps.blur.delete(fieldId);

      form.abortCtrlMaps.blur.get(fieldId)?.abort();
      form.abortCtrlMaps.blur.delete(fieldId);
    }

    // TODO add an option to validate async even if there are sync errors
    if (errors.length > 0) {
      return;
    }

    form.scheduleAsyncValidation(validationSpec);
  };
}
