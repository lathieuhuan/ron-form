import type { ValidationCause } from "./types";

export class RunningValidatorMap {
  // Map of FieldId as key, map of run ids by cause as value
  // TOCHECK why not keep only 1 run at a time?
  private map = new Map<string, Map<ValidationCause, Set<number>>>();
  private nextRunId = 1;

  get(field: string): ValidationCause[] {
    const causeMap = this.map.get(field);

    if (causeMap == null) {
      return [];
    }

    const causes: ValidationCause[] = [];

    for (const [cause, runIds] of causeMap.entries()) {
      if (runIds.size > 0) {
        causes.push(cause);
      }
    }

    return causes;
  }

  add(field: string, cause: ValidationCause): number {
    const causes = this.map.get(field) ?? new Map();
    const runIds = causes.get(cause) ?? new Set();
    const runId = this.nextRunId++;

    runIds.add(runId);
    causes.set(cause, runIds);
    this.map.set(field, causes);

    return runId;
  }

  remove(field: string, cause: ValidationCause, runId?: number): void {
    const causes = this.map.get(field);
    const runIds = causes?.get(cause);

    if (causes == null || runIds == null) {
      return;
    }

    if (runId === undefined) {
      runIds.clear();
    } else {
      runIds.delete(runId);
    }

    if (runIds.size === 0) {
      causes.delete(cause);
    }
    if (causes.size === 0) {
      this.map.delete(field);
    }
  }

  removeWhere(predicate: (field: string) => boolean): void {
    for (const field of this.map.keys()) {
      if (predicate(field)) {
        this.map.delete(field);
      }
    }
  }

  isAnyRunning(field?: string): boolean {
    if (field === undefined) {
      for (const causes of this.map.values()) {
        for (const runIds of causes.values()) {
          if (runIds.size > 0) {
            return true;
          }
        }
      }

      return false;
    }

    const causes = this.map.get(field);

    if (causes == null) {
      return false;
    }

    for (const runIds of causes.values()) {
      if (runIds.size > 0) {
        return true;
      }
    }

    return false;
  }
}
