import { describe, expect, it, vi } from "vitest";
import { createSubject } from "../createSubject";

describe("createSubject", () => {
  const initialValue = 1;
  const nextValue = 2;
  const computedValue = 3;

  it("notifies subscribers when next is called with a value", () => {
    const subject = createSubject<number>();
    const observer = vi.fn();

    subject.subscribe(observer);
    subject.next(initialValue);

    expect(observer).toHaveBeenCalledOnce();
    expect(observer).toHaveBeenCalledWith(initialValue);
  });

  it("resolves function values before notifying subscribers", () => {
    const subject = createSubject<number>();
    const observer = vi.fn();

    subject.subscribe(observer);
    subject.next(() => computedValue);

    expect(observer).toHaveBeenCalledWith(computedValue);
  });

  it("does not notify when there are no subscribers", () => {
    const subject = createSubject<number>();
    const observer = vi.fn();

    subject.next(initialValue);

    expect(observer).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe is called", () => {
    const subject = createSubject<number>();
    const observer = vi.fn();

    const unsubscribe = subject.subscribe(observer);
    subject.next(initialValue);
    unsubscribe();
    subject.next(nextValue);

    expect(observer).toHaveBeenCalledOnce();
    expect(observer).toHaveBeenCalledWith(initialValue);
  });

  it("clears all subscribers with unsubscribeAll", () => {
    const subject = createSubject<number>();
    const firstObserver = vi.fn();
    const secondObserver = vi.fn();

    subject.subscribe(firstObserver);
    subject.subscribe(secondObserver);
    subject.unsubscribeAll();
    subject.next(initialValue);

    expect(firstObserver).not.toHaveBeenCalled();
    expect(secondObserver).not.toHaveBeenCalled();
    expect(subject.observers).toEqual([]);
  });

  it("exposes the current observers through the observers getter", () => {
    const subject = createSubject<number>();
    const observer = vi.fn();

    subject.subscribe(observer);

    expect(subject.observers).toEqual([observer]);
  });
});
