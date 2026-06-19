import type { FormMeta } from "./types";
import { createSubject } from "./utils/createSubject";
import { isShallowEqual } from "./utils/isShallowEqual";

export class FormMetaControl {
  private meta: FormMeta;
  private subject = createSubject<FormMeta>();

  constructor({
    isBlurred = false,
    isTouched = false,
    isDirty = false,
    isValidating = false,
    submitCount = 0,
  }: Partial<FormMeta> = {}) {
    this.meta = {
      isBlurred,
      isTouched,
      isDirty,
      isValidating,
      submitCount,
    };
  }

  get = () => {
    return this.meta;
  };

  /** Update and notify */
  set = (changes: Partial<FormMeta> | ((meta: FormMeta) => Partial<FormMeta>)) => {
    const newMeta = {
      ...this.meta,
      ...(typeof changes === "function" ? changes(this.meta) : changes),
    };

    if (isShallowEqual(this.meta, newMeta)) {
      return;
    }

    this.meta = newMeta;
    this.subject.next(this.meta);
  };

  subscribe = (subscriber: (meta: FormMeta) => void) => {
    return this.subject.subscribe(subscriber);
  };
}

export type FormMetaApi = {
  get(): FormMeta;
  set(changes: Partial<FormMeta> | ((meta: FormMeta) => Partial<FormMeta>)): void;
  subscribe(subscriber: (meta: FormMeta) => void): () => void;
};
