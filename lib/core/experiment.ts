type GroupValue<T extends Record<string, BaseControl<any>>> = {
  [Key in keyof T]: T[Key] extends ItemControl<infer TValue>
    ? TValue
    : T[Key] extends GroupControl<infer GChild>
    ? GroupValue<GChild>
    : never;
};

abstract class BaseControl<TValue> {
  abstract getValue(): TValue;
}

class ItemControl<TValue> extends BaseControl<TValue> {
  constructor(public value: TValue) {
    super();
  }

  getValue(): TValue {
    return this.value;
  }
}

class GroupControl<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls> = GroupValue<TControls>,
> extends BaseControl<TValue> {
  constructor(public controls: TControls) {
    super();
  }

  getValue(): TValue {
    const values = {} as TValue;
    for (const [key, control] of Object.entries(this.controls)) {
      values[key as keyof TValue] = control.getValue();
    }
    return values;
  }
}

const group1 = new GroupControl({
  lv2: new ItemControl(""),
});

const group = new GroupControl({
  lv1: group1,
});

const nestGroup = new GroupControl({
  lv1: new GroupControl({
    lv2: new ItemControl(""),
  }),
});
