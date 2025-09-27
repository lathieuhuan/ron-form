import { ComposableAsyncValidators, ComposableValidators, ValidationErrors } from "./validation";

export type ControlOptions<TValue = unknown> = {
  id?: string;
  validators?: ComposableValidators<TValue>;
  asyncValidators?: ComposableAsyncValidators<TValue>;
};

export type ParentControlOptions<TValue = unknown> = ControlOptions<TValue> & {
  /** Whether to listen to the state of the children. Default true. */
  isAttentive?: boolean;
};

export type ValueChangeOptions = {
  /** If true, do not notify the subscribers. Default false. */
  muted?: boolean;
};

export type ValidateOptions = {
  // /** Whether to touch the control after validate. Only work on ItemControl. Default true */
  // shouldTouch?: boolean;
  /** If true, do not notify the subscribers. Default false. */
  muted?: boolean;
  // /** bubbling validation will validate the parent controls. Default false */
  // isBubbling?: boolean;
  onError?: (errors: ValidationErrors) => void;
};

// export type ValidateAllOptions = Pick<ValidateOptions, "isMuted">;
export type ValidateAllOptions = never;
