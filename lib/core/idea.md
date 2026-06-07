# Ron Form (ron-form)

A TypeScript headless form library that has the managing engine structured in node tree. Each node is a form control.

## Types of form control

- BaseControl: The foundation class that defines abstract properties & methods for all other controls (children classes).
- ItemControl: The smallest form control unit, leaves in the tree. It is used for primitive values, or objects that work as one entity such as Date.
- ParentControl: The base class for GroupControl and ListControl, defines common and abstract methods.
- GroupControl: Stores and manages a record (object) of controls.
- ListControl: Stores and manages an array of controls.
- FormControl: The entry of the form system. Extends GroupControl with form submit functionality.

Example form structure:

```ts
FormControl {
  GroupControl {
    name: 'personalInfo',
    controls: {
      ItemControl: {
        name: 'name',
        value: 'John'
      },
      ItemControl: {
        name: 'age',
        value: 25
      },
    }
  },
  ListControl {
    name: 'skills',
    controls: [
      ItemControl: {
        name: '0',
        value: 'Javascript'
      },
      ItemControl: {
        name: '1',
        value: 'React'
      },
    ]
  },
  ListControl {
    name: 'experience',
    controls: [
      GroupControl {
        // ...
      }
    ]
  }
}
```

## Structure of a form control - BaseControl

### Properties:

- `name` - id for the parent control's management. It is forced to `root` on FormControl.
- `parent` - the parent control. It is the instance itself on FormControl.
- `errors`

### Methods:

- `getValue`
- `setValue`
- `patchValue`
- `resetValue`

- `isTouched`: boolean
- `isDirty`: boolean
- `isValid`: boolean
- `getState`: isValid, isTouched, isDirty, and `errors`
- `resetState`

- `reset` - reset value and state
- `validate` - run validation and update state
- `subscribe` - listen to value and/or state changes. return unsubscribe

## ItemControl<TValue> extends BaseControl

### Extra properties:

- `value`: TValue
- `defaultValue`?: TValue
- `touched`: if user has changed this control's value (boolean)

### Special methods implementation:

- `getValue`: TValue
- `setValue(value: TValue)` - update value
- `patchValue(value: TValue)` - same as setValue
- `resetValue` - set value to defaultValue

- `isTouched` - return `touched`
- `isDirty` - return if current value is different from default value
- `isValid` - return if no `errors`
- `resetState` - reset `touched`, `errors`

## ParentControl extends BaseControl

### Extra properties:

- `controlList`: BaseControl[] - child controls stored in array

### Special methods implementation:

- `resetValue` - call `resetValue` on all descendant controls

- `isTouched` - return if `isTouched` on any child control return true
- `isDirty` - return if `isDirty` on any child control return true
- `isValid` - return if no `errors` on this control and all descendant controls

## GroupControl extends ParentControl

### Extra properties:

- `controls`: TControls - record of BaseControl

### Infer types

- `TValue`: resemble the shape of TControls. Example:

```ts
TControls {
  name: ItemControl<string>,
  age: ItemControl<number>,
}

TValue {
  name: string,
  age: number,
}
```

### Special methods implementation:

- `getValue` - call `getValue` on all child controls and return values in the shape of `TValue`
- `setValue(value: TValue)` - set value on each child control accordingly
- `patchValue(value: Partial<TValue>)` - set value on each child control accordingly

- `resetState` - call `resetState` on all descendant controls

## ListControl extends ParentControl

### Extra properties:

- `sampleControl`: BaseControl
- `touched`: if user has inserted, removed, replaced, re-arranged any item (boolean)

### Infer types

- `TChildControl`: typeof BaseControl
- `TItemValue`: type infer from BaseControl.
- `TValue`: type infer from BaseControl in array.

Example:

```ts
sampleControl = ItemControl<string>

TChildControl = ItemControl<string>
TItemValue = string
TValue = string[]
```

### Special methods implementation:

1. `getValue` - call `getValue` on all child controls and return values in the shape of `TValue`

2. `setValue(value: TValue)`

- set value on each child control accordingly
- if length of `TValue` is longer than length of `controlList` (ParentControl), add new control from `sampleControl`
- if length of `TValue` is shorter than length of `controlList` (ParentControl), remove redundant controls

3. `patchValue(value: TValue)`

- set value on each child control accordingly
- difference in length of `TValue` and `controlList` leads to no action

4. `resetState` - call `resetState` on all descendant controls, and set `touched` to false

### Extra methods

1. `insertItem(value?: TItemValue, index?: number): TChildControl | undefined`

- If value is provided (not undefined), the new child control will have this value
- If index is undefined, the new child control will be inserted at the end of the list
- If index < 0 || index > controlList.length, this operation will fail and return undefined

2. `insertItems(countOrValues: number | TItemValue[], index?: number): TChildControl[] | undefined`

- If index is undefined, new items will be inserted at the end of the list
- If index < 0 || index > items.length, this operation will fail and return undefined

3. `removeItemAt(index: number): TChildControl | undefined)`

- If index < 0 || index > items.length, this operation will fail and return undefined
- Return the removed control

4. `clearItems`
