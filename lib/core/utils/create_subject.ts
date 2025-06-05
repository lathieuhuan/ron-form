import { Noop } from "../types";
import { isFunction } from "./is_function";

export type Observer<T> = (value: T) => void;

export type Subject<T> = {
  readonly observers: Observer<T>[];
  next: (value: T | (() => T)) => void;
  subscribe: (observer: Observer<T>) => Noop;
  unsubscribeAll: Noop;
};

export function createSubject<T>(): Subject<T> {
  let _observers: Observer<T>[] = [];

  const next: Subject<T>["next"] = (value) => {
    if (_observers.length) {
      const _value = isFunction(value) ? value() : value;

      for (const observer of _observers) {
        observer(_value);
      }
    }
  };

  const subscribe = (observer: Observer<T>): Noop => {
    _observers.push(observer);

    return () => {
      _observers = _observers.filter((o) => o !== observer);
    };
  };

  const unsubscribeAll = () => {
    _observers = [];
  };

  return {
    get observers() {
      return _observers;
    },
    next,
    subscribe,
    unsubscribeAll,
  };
}
