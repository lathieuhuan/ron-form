type Nullable<T> = T & (undefined | null);

interface AnyDeepKeyAndValue<K extends string = string, V = any> {
  key: K;
  value: V;
}

// ===== ARRAY =====

type ArrayAccessor<TParent extends AnyDeepKeyAndValue> =
  `${TParent["key"] extends never ? "" : TParent["key"]}.${number}`;

interface ArrayDeepKeyAndValue<
  in out TParent extends AnyDeepKeyAndValue,
  in out T extends ReadonlyArray<any>,
> extends AnyDeepKeyAndValue {
  key: ArrayAccessor<TParent>;
  value: T[number] | Nullable<TParent["value"]>;
}

type DeepKeyAndValueArray<
  TParent extends AnyDeepKeyAndValue,
  T extends ReadonlyArray<any>,
  TAcc,
> = DeepKeysAndValuesImpl<
  NonNullable<T[number]>,
  ArrayDeepKeyAndValue<TParent, T>,
  TAcc | ArrayDeepKeyAndValue<TParent, T>
>;

// ===== TUPLE =====

type AllTupleKeys<T> = T extends any ? keyof T & `${number}` : never;

type TupleAccessor<
  TParent extends AnyDeepKeyAndValue,
  TKey extends string,
> = `${TParent["key"] extends never ? "" : TParent["key"]}[${TKey}]`;

interface TupleDeepKeyAndValue<
  in out TParent extends AnyDeepKeyAndValue,
  in out T,
  in out TKey extends AllTupleKeys<T>,
> extends AnyDeepKeyAndValue {
  key: TupleAccessor<TParent, TKey>;
  value: T[TKey] | Nullable<TParent["value"]>;
}

type DeepKeyAndValueTuple<
  TParent extends AnyDeepKeyAndValue,
  T extends ReadonlyArray<any>,
  TAcc,
  TAllKeys extends AllTupleKeys<T> = AllTupleKeys<T>,
> = TAllKeys extends any
  ? DeepKeysAndValuesImpl<
      NonNullable<T[TAllKeys]>,
      TupleDeepKeyAndValue<TParent, T, TAllKeys>,
      TAcc | TupleDeepKeyAndValue<TParent, T, TAllKeys>
    >
  : never;

// ===== OBJECT =====

type AllObjectKeys<T> = T extends any ? keyof T & (string | number) : never;

export type ObjectAccessor<
  TParent extends AnyDeepKeyAndValue,
  TKey extends string | number,
> = TParent["key"] extends never ? `${TKey}` : `${TParent["key"]}.${TKey}`;

type ObjectValue<TParent extends AnyDeepKeyAndValue, T, TKey extends AllObjectKeys<T>> =
  | T[TKey]
  | Nullable<TParent["value"]>;

export interface ObjectDeepKeyAndValue<
  in out TParent extends AnyDeepKeyAndValue,
  in out T,
  in out TKey extends AllObjectKeys<T>,
> extends AnyDeepKeyAndValue {
  key: ObjectAccessor<TParent, TKey>;
  value: ObjectValue<TParent, T, TKey>;
}

export type DeepKeyAndValueObject<
  TParent extends AnyDeepKeyAndValue,
  T,
  TAcc,
  TAllKeys extends AllObjectKeys<T> = AllObjectKeys<T>,
> = TAllKeys extends any
  ? DeepKeysAndValuesImpl<
      NonNullable<T[TAllKeys]>,
      ObjectDeepKeyAndValue<TParent, T, TAllKeys>,
      TAcc | ObjectDeepKeyAndValue<TParent, T, TAllKeys>
    >
  : never;

// =====  =====

type UnknownAccessor<TParent extends AnyDeepKeyAndValue> = TParent["key"] extends never
  ? string
  : `${TParent["key"]}.${string}`;

interface UnknownDeepKeyAndValue<TParent extends AnyDeepKeyAndValue> extends AnyDeepKeyAndValue {
  key: UnknownAccessor<TParent>;
  value: unknown;
}

export type DeepKeysAndValuesImpl<
  T,
  TParent extends AnyDeepKeyAndValue = never,
  TAcc = never,
> = unknown extends T
  ? TAcc | UnknownDeepKeyAndValue<TParent>
  : unknown extends T // this stops runaway recursion when T is any
    ? T
    : T extends string | number | boolean | bigint | Date
      ? TAcc
      : T extends ReadonlyArray<any>
        ? number extends T["length"]
          ? DeepKeyAndValueArray<TParent, T, TAcc>
          : DeepKeyAndValueTuple<TParent, T, TAcc>
        : keyof T extends never
          ? TAcc | UnknownDeepKeyAndValue<TParent>
          : T extends object
            ? DeepKeyAndValueObject<TParent, T, TAcc>
            : TAcc;

export type DeepKeysAndValues<T> =
  DeepKeysAndValuesImpl<T> extends AnyDeepKeyAndValue ? DeepKeysAndValuesImpl<T> : never;

type DeepRecord<T> = {
  [TRecord in DeepKeysAndValues<T> as TRecord["key"]]: TRecord["value"];
};

export type DeepKeys<T> = unknown extends T ? string : DeepKeysAndValues<T>["key"];

export type DeepValue<TValue, TAccessor> = unknown extends TValue
  ? TValue
  : TAccessor extends DeepKeys<TValue>
    ? DeepRecord<TValue>[TAccessor]
    : never;

export type DeepItemValue<TValues, TField> =
  DeepValue<TValues, TField> extends Array<infer TItem> ? TItem : never;
