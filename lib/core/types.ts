import type { BaseControl } from "./base_control";
import type { GroupControl } from "./group_control";
import type { ItemControl } from "./item_control";
import type { ListControl } from "./list_control";

export type Noop = () => void;

export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

// ===== Path =====

// type NamePathPart = string | number;
// export type NamePath = NamePathPart | NamePathPart[];

export type NamePath = (string | number)[];

export type GroupPath<TControls> = TControls extends Record<infer Key, BaseControl<any>>
  ? Key extends string
    ? TControls[Key] extends ItemControl<any>
      ? [Key]
      : TControls[Key] extends GroupControl<infer GChild>
      // @ts-expect-error Type instantiation is excessively deep
      ? [Key] | [Key, ...GroupPath<GChild>]
      : TControls[Key] extends ListControl<infer LChild>
      ? [Key] | [Key, ...ListPath<LChild>]
      : never
    : never
  : never;

export type ListPath<TControl extends BaseControl<any>> = TControl extends ItemControl
  ? [number]
  : TControl extends GroupControl<infer GChild>
  ? [number] | [number, ...GroupPath<GChild>]
  : TControl extends ListControl<infer LChild>
  ? [number] | [number, ...ListPath<LChild>]
  : TControl extends ItemControl<any>
  ? [number]
  : never;

// ===== Control =====

export type ControlAtGroupPath<TControls, TPath extends NamePath> = TPath extends [
  infer Key extends keyof TControls,
  ...infer TRest extends NamePath,
]
  ? TRest extends []
    ? TControls[Key]
    : TControls[Key] extends GroupControl<infer GChild>
    ? ControlAtGroupPath<GChild, TRest>
    : TControls[Key] extends ListControl<infer LChild>
    ? ControlAtListPath<LChild, TRest>
    : never
  : never;

export type ControlAtListPath<TControl, TPath extends NamePath> = TPath extends [
  number,
  ...infer TRest extends NamePath,
]
  ? TRest extends []
    ? TControl | undefined
    : TControl extends GroupControl<infer GChild>
    ? ControlAtGroupPath<GChild, TRest> | undefined
    : TControl extends ListControl<infer LChild extends BaseControl<any>>
    ? ControlAtListPath<LChild, TRest> | undefined
    : never
  : never;

// ===== Value =====

export type GroupValue<T extends Record<string, BaseControl<any>>> = {
  [Key in keyof T]: T[Key] extends ItemControl<infer TValue>
    ? TValue
    : T[Key] extends GroupControl<infer GChild>
    ? GroupValue<GChild>
    : T[Key] extends ListControl<infer LChild>
    ? ListValue<LChild>[]
    : never;
};

export type ListValue<T extends BaseControl<any>> = T extends ItemControl<infer TValue>
  ? TValue
  : T extends GroupControl<infer GChild>
  ? GroupValue<GChild>
  : T extends ListControl<infer LChild>
  ? ListValue<LChild>
  : never;

// ===== State =====

export type ControlState = {
  isValid: boolean;
  isPending: boolean;
  isTouched: boolean;
  /** !isValid && isTouched */
  isError: boolean;
  errors: ValidationErrors | null;
};

// ===== Validation =====

export type ValidateOptions = {
  /** Whether to touch the control after validate. Only work on ItemControl. Default to true */
  shouldTouch?: boolean;
  /** muted validation will not notify subscribers. Default to false */
  isMuted?: boolean;
  /** bubbling validation will validate the parent controls. Default to false */
  isBubbling?: boolean;
  onError?: (errors: ValidationErrors) => void;
};

export type ValidateAllOptions = Pick<ValidateOptions, "isMuted">;

export type ValidationErrors = {
  [key: string]: string;
};

export type ValidatorFn<TValue = unknown> = (
  control: BaseControl<TValue>,
) => ValidationErrors | null;

export type AsyncValidatorFn<TValue = unknown> = (
  control: BaseControl<TValue>,
) => Promise<ValidationErrors | null>;

export type ComposableValidators<TValue = unknown> =
  | ValidatorFn<TValue>
  | (ValidatorFn<TValue> | null | undefined)[];

export type ComposableAsyncValidators<TValue = unknown> =
  | AsyncValidatorFn<TValue>
  | (AsyncValidatorFn<TValue> | null | undefined)[];

// ===== Notification =====

export type NotifyStateOptions = {
  /**
   * Whether to call notifyStateObservers on the parent whenever
   * this control notifyStateObservers. Default to true.
   */
  isBubbling?: boolean;
};
