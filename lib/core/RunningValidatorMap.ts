import type { DeepKeys, ValidationCause } from "./types";

export class RunningValidatorMap<TFormValues> {
  private map: Map<DeepKeys<TFormValues>, ValidationCause[]> = new Map();

  get(field: DeepKeys<TFormValues>) {
    return this.map.get(field) || [];
  }

  add(field: DeepKeys<TFormValues>, cause: ValidationCause) {
    this.map.set(field, [...this.get(field), cause]);
  }

  remove(field: DeepKeys<TFormValues>, cause: ValidationCause) {
    const causes = this.get(field);

    this.map.set(
      field,
      causes.filter((c) => c !== cause),
    );
  }

  isAnyRunning(field?: DeepKeys<TFormValues>) {
    if (field === undefined) {
      for (const causes of this.map.values()) {
        if (causes.length > 0) {
          return true;
        }
      }

      return false;
    }

    return this.get(field).length > 0;
  }
}
