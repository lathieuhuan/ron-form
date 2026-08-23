import { Updater } from "../types";
import { update } from "./object";

const isUpdateFn = <T, K = T>(updater: Updater<T, K>): updater is (prev: T) => K => {
  return typeof updater === "function";
};

/**
 * Only use with plain objects.
 */
export class Patcher<T extends object> {
  private current: T;

  constructor(private obj: T) {
    this.current = obj;
  }

  get value() {
    return this.current;
  }

  get updated() {
    return this.current !== this.obj;
  }

  set(key: keyof T, updater: Updater<T[keyof T]>): boolean {
    const value = isUpdateFn(updater) ? updater(this.current[key]) : updater;
    const { success, result } = update(this.current, key, value);

    this.current = result;

    return success;
  }

  patch(data: Partial<T>): boolean {
    const { success, result } = update(this.current, data);

    this.current = result;

    return success;
  }
}
