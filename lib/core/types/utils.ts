export type Noop = () => void;

export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};
