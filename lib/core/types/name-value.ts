type Nullable<T> = T & (undefined | null);

interface AnyDeepNameAndValue<K extends string = string, V = any> {
  name: K;
  value: V;
}

// ===== ARRAY =====

type ArrayAccessor<TParent extends AnyDeepNameAndValue> =
  `${TParent["name"] extends never ? "" : TParent["name"]}.${number}`;

interface ArrayDeepNameAndValue<
  in out TParent extends AnyDeepNameAndValue,
  in out T extends ReadonlyArray<any>,
> extends AnyDeepNameAndValue {
  name: ArrayAccessor<TParent>;
  value: T[number] | Nullable<TParent["value"]>;
}

type DeepNameAndValueArray<
  TParent extends AnyDeepNameAndValue,
  T extends ReadonlyArray<any>,
  TAcc,
> = DeepNamesAndValuesImpl<
  NonNullable<T[number]>,
  ArrayDeepNameAndValue<TParent, T>,
  TAcc | ArrayDeepNameAndValue<TParent, T>
>;

// ===== TUPLE =====

type AllTupleNames<T> = T extends any ? keyof T & `${number}` : never;

type TupleAccessor<
  TParent extends AnyDeepNameAndValue,
  TKey extends string,
> = `${TParent["name"] extends never ? "" : TParent["name"]}[${TKey}]`;

interface TupleDeepNameAndValue<
  in out TParent extends AnyDeepNameAndValue,
  in out T,
  in out TKey extends AllTupleNames<T>,
> extends AnyDeepNameAndValue {
  name: TupleAccessor<TParent, TKey>;
  value: T[TKey] | Nullable<TParent["value"]>;
}

type DeepNameAndValueTuple<
  TParent extends AnyDeepNameAndValue,
  T extends ReadonlyArray<any>,
  TAcc,
  TAllKeys extends AllTupleNames<T> = AllTupleNames<T>,
> = TAllKeys extends any
  ? DeepNamesAndValuesImpl<
      NonNullable<T[TAllKeys]>,
      TupleDeepNameAndValue<TParent, T, TAllKeys>,
      TAcc | TupleDeepNameAndValue<TParent, T, TAllKeys>
    >
  : never;

// ===== OBJECT =====

type AllObjectNames<T> = T extends any ? keyof T & (string | number) : never;

export type ObjectAccessor<
  TParent extends AnyDeepNameAndValue,
  TKey extends string | number,
> = TParent["name"] extends never ? `${TKey}` : `${TParent["name"]}.${TKey}`;

type ObjectValue<TParent extends AnyDeepNameAndValue, T, TKey extends AllObjectNames<T>> =
  | T[TKey]
  | Nullable<TParent["value"]>;

export interface ObjectDeepNameAndValue<
  in out TParent extends AnyDeepNameAndValue,
  in out T,
  in out TKey extends AllObjectNames<T>,
> extends AnyDeepNameAndValue {
  name: ObjectAccessor<TParent, TKey>;
  value: ObjectValue<TParent, T, TKey>;
}

export type DeepNameAndValueObject<
  TParent extends AnyDeepNameAndValue,
  T,
  TAcc,
  TAllKeys extends AllObjectNames<T> = AllObjectNames<T>,
> = TAllKeys extends any
  ? DeepNamesAndValuesImpl<
      NonNullable<T[TAllKeys]>,
      ObjectDeepNameAndValue<TParent, T, TAllKeys>,
      TAcc | ObjectDeepNameAndValue<TParent, T, TAllKeys>
    >
  : never;

// ===== UNKNOWN =====

type UnknownAccessor<TParent extends AnyDeepNameAndValue> = TParent["name"] extends never
  ? string
  : `${TParent["name"]}.${string}`;

interface UnknownDeepNameAndValue<TParent extends AnyDeepNameAndValue> extends AnyDeepNameAndValue {
  name: UnknownAccessor<TParent>;
  value: unknown;
}

// ===== IMPLEMENTATION =====

export type DeepNamesAndValuesImpl<
  T,
  TParent extends AnyDeepNameAndValue = never,
  TAcc = never,
> = unknown extends T
  ? TAcc | UnknownDeepNameAndValue<TParent>
  : unknown extends T // this stops runaway recursion when T is any
    ? T
    : T extends string | number | boolean | bigint | Date
      ? TAcc
      : T extends ReadonlyArray<any>
        ? number extends T["length"]
          ? DeepNameAndValueArray<TParent, T, TAcc>
          : DeepNameAndValueTuple<TParent, T, TAcc>
        : keyof T extends never
          ? TAcc | UnknownDeepNameAndValue<TParent>
          : T extends object
            ? DeepNameAndValueObject<TParent, T, TAcc>
            : TAcc;

export type DeepNamesAndValues<T> =
  DeepNamesAndValuesImpl<T> extends AnyDeepNameAndValue ? DeepNamesAndValuesImpl<T> : never;

type DeepRecord<T> = {
  [TRecord in DeepNamesAndValues<T> as TRecord["name"]]: TRecord["value"];
};

export type DeepNames<T> = unknown extends T ? string : DeepNamesAndValues<T>["name"];

export type DeepValue<TValue, TAccessor> = unknown extends TValue
  ? TValue
  : TAccessor extends DeepNames<TValue>
    ? DeepRecord<TValue>[TAccessor]
    : TAccessor extends WildcardDeepNames<TValue>
      ? WildcardDeepRecord<TValue>[TAccessor]
      : never;

export type DeepItemValue<TValues, TField> =
  DeepValue<TValues, TField> extends Array<infer TItem> ? TItem : never;

// ===== WILDCARD ARRAY NAME - VALUE =====

type WildcardArrayAccessor<TParent extends AnyDeepNameAndValue> =
  `${TParent["name"] extends never ? "" : TParent["name"]}.[n]`;

interface WildcardArrayDeepNameAndValue<
  in out TParent extends AnyDeepNameAndValue,
  in out T extends ReadonlyArray<any>,
> extends AnyDeepNameAndValue {
  name: WildcardArrayAccessor<TParent>;
  value: T[number] | Nullable<TParent["value"]>;
}

type WildcardDeepNameAndValueArray<
  TParent extends AnyDeepNameAndValue,
  T extends ReadonlyArray<any>,
  TAcc,
> = WildcardDeepNamesAndValuesImpl<
  NonNullable<T[number]>,
  WildcardArrayDeepNameAndValue<TParent, T>,
  TAcc | WildcardArrayDeepNameAndValue<TParent, T>
>;

type WildcardDeepNameAndValueObject<
  TParent extends AnyDeepNameAndValue,
  T,
  TAcc,
  TAllNames extends AllObjectNames<T> = AllObjectNames<T>,
> = TAllNames extends any
  ? WildcardDeepNamesAndValuesImpl<
      NonNullable<T[TAllNames]>,
      ObjectDeepNameAndValue<TParent, T, TAllNames>,
      TAcc | ObjectDeepNameAndValue<TParent, T, TAllNames>
    >
  : never;

type WildcardDeepNamesAndValues<T> =
  WildcardDeepNamesAndValuesImpl<T> extends AnyDeepNameAndValue
    ? WildcardDeepNamesAndValuesImpl<T>
    : never;

type WildcardDeepRecord<T> = {
  [TRecord in WildcardDeepNamesAndValues<T> as TRecord["name"]]: TRecord["value"];
};

type WildcardDeepNamesAndValuesImpl<
  T,
  TParent extends AnyDeepNameAndValue = never,
  TAcc = never,
> = unknown extends T
  ? TAcc | UnknownDeepNameAndValue<TParent>
  : unknown extends T // this stops runaway recursion when T is any
    ? T
    : T extends string | number | boolean | bigint | Date
      ? TAcc
      : T extends ReadonlyArray<any>
        ? number extends T["length"]
          ? WildcardDeepNameAndValueArray<TParent, T, TAcc>
          : never
        : keyof T extends never
          ? TAcc | UnknownDeepNameAndValue<TParent>
          : T extends object
            ? WildcardDeepNameAndValueObject<TParent, T, TAcc>
            : TAcc;

export type WildcardDeepNames<T> = unknown extends T
  ? string
  : WildcardDeepNamesAndValues<T>["name"];

// type Values = {
//   array: Array<{
//     name: string;
//     age: number | null;
//   }>;
// };

// type Keys = WildcardDeepKeys<Values>;
// type Value = DeepValue<Values, "array.N.age">;

// const keys: Keys[] = ["array.N.age", "array"];
// const value: Value = 1;
