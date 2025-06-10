import { ComposableAsyncValidators, ComposableValidators } from "./validation";

export type NotifyStateOptions = {
  /**
   * Whether to call notifyStateObservers on the parent whenever
   * this control notifyStateObservers. Default to true.
   */
  isBubbling?: boolean;
};

export type ControlOptions<TValue = unknown> = {
  validators?: ComposableValidators<TValue>;
  asyncValidators?: ComposableAsyncValidators<TValue>;
};

export type ParentControlOptions<TValue = unknown> = ControlOptions<TValue> & {
  /** Whether to listen to the state of the children. Default to true. */
  isAttentive?: boolean;
};
