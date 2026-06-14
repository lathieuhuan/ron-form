import type { FieldMeta } from "./types";
import { createSubject } from "./utils/createSubject";
import { isShallowEqual } from "./utils/isShallowEqual";

export interface FormMeta extends FieldMeta {}

export class FormMetaControl {
  private meta: FormMeta;
  private subject = createSubject<FormMeta>();

  constructor({ isTouched, isDirty, isValidating }: Partial<FormMeta> = {}) {
    this.meta = {
      isTouched: isTouched ?? false,
      isDirty: isDirty ?? false,
      isValidating: isValidating ?? false,
    };
  }

  get = () => {
    return this.meta;
  };

  set = (changes: Partial<FormMeta>) => {
    const newValues = { ...this.meta, ...changes };

    if (isShallowEqual(this.meta, newValues)) {
      return;
    }

    this.meta = newValues;
    this.subject.next(this.meta);
  };

  subscribe = (subscriber: (meta: FormMeta) => void) => {
    return this.subject.subscribe(subscriber);
  };
}

export type FormMetaApi = {
  get(): FormMeta;
  set(changes: Partial<FormMeta>): void;
  subscribe(subscriber: (meta: FormMeta) => void): () => void;
};
