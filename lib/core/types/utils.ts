export type Noop = () => void;

export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
