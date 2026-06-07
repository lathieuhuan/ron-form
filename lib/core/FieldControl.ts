interface FieldControlOptions<TValue> {
  defaultValue?: TValue;
}

interface FieldMeta {
  isTouched: boolean;
  isValid: boolean;
}

export class FieldControl<TValue> {
  private _value: TValue | null;

  private _meta: FieldMeta = {
    isTouched: false,
    isValid: false,
  };

  constructor(options: FieldControlOptions<TValue>) {
    this._value = options.defaultValue ?? null;
  }
}
