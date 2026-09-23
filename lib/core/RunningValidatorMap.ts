import type { ValidationCause } from "./types";

export class RunningValidatorMap {
  private map = new Map<string, Set<ValidationCause>>();

  get(name: string): ValidationCause[] {
    const causeSet = this.map.get(name);

    if (causeSet == null) {
      return [];
    }

    return Array.from(causeSet);
  }

  add(name: string, cause: ValidationCause) {
    const causeSet = this.map.get(name) ?? new Set();

    causeSet.add(cause);
    this.map.set(name, causeSet);
  }

  remove(name: string, cause: ValidationCause): void {
    const causeSet = this.map.get(name);

    if (causeSet == null) {
      return;
    }

    causeSet.delete(cause);

    if (causeSet.size === 0) {
      this.map.delete(name);
    }
  }

  removeWhere(predicate: (name: string) => boolean): void {
    for (const name of this.map.keys()) {
      if (predicate(name)) {
        this.map.delete(name);
      }
    }
  }

  isAnyRunning(name?: string): boolean {
    if (name === undefined) {
      for (const causeSet of this.map.values()) {
        if (causeSet.size > 0) {
          return true;
        }
      }

      return false;
    }

    const causeSet = this.map.get(name);

    if (causeSet == null) {
      return false;
    }

    return causeSet.size > 0;
  }
}
