import { BaseControl } from "./base_control";
import { GroupControl } from "./group_control";
import { ParentControlOptions } from "./parent_control";
import { ComposableAsyncValidators, ComposableValidators, GroupValue } from "./types";

type SubmitSuccessResult<TValue = any> = {
  status: "success";
  value: TValue;
};

type SubmitErrorResult = {
  status: "error";
};

type SubmitResult<TValue = any> = SubmitSuccessResult<TValue> | SubmitErrorResult;

type SubmitListener<TValue = any> = (result: SubmitResult<TValue>) => void;

type FormControlOptions = ParentControlOptions & {};

export class FormControl<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls> = GroupValue<TControls>,
> extends GroupControl<TControls, TValue> {
  private formElmt: HTMLFormElement | null = null;
  private submitListeners: SubmitListener<TValue>[] = [];

  constructor(
    public readonly controls: TControls,
    validators: ComposableValidators<TValue> | null = null,
    asyncValidators: ComposableAsyncValidators<TValue> | null = null,
    options: FormControlOptions = {},
  ) {
    super(controls, validators, asyncValidators, options);
  }

  subscribeSubmit(subscriber: SubmitListener<TValue>): () => void {
    this.submitListeners.push(subscriber);

    return () => {
      this.submitListeners = this.submitListeners.filter((listener) => listener !== subscriber);
    };
  }

  handleSubmit = (e?: SubmitEvent) => {
    e?.preventDefault();

    this.setIsTouched(true);

    if (this.validateAll()) {
      this.submitListeners.forEach((listener) => {
        listener({ status: "success", value: this.getValue() });
      });
    } else {
      this.submitListeners.forEach((listener) => listener({ status: "error" }));
    }
  };

  connectForm(formElmt: HTMLFormElement | null) {
    this.formElmt = formElmt;

    if (this.formElmt) {
      this.formElmt.addEventListener("submit", this.handleSubmit);
    }

    return () => {
      if (this.formElmt) {
        this.formElmt.removeEventListener("submit", this.handleSubmit);
      }
    };
  }

  submit() {
    this.handleSubmit();
  }
}
