/**
 * Only use with plain objects.
 */
export class Patcher<T extends object> {
  private latest: T;

  constructor(private obj: T) {
    this.latest = obj;
  }

  get value() {
    return this.latest;
  }

  get updated() {
    return this.latest !== this.obj;
  }

  set(key: keyof T, value: T[keyof T]) {
    const oldValue = this.latest[key];

    if (oldValue === value) {
      return this.latest;
    }

    this.latest = {
      ...this.latest,
      [key]: value,
    };

    return this.latest;
  }
}
