export const cache = <TKey, TValue>(getter: (key: TKey) => TValue) => {
  const map = new Map<TKey, TValue>();

  return {
    get: (key: TKey) => {
      if (map.has(key)) {
        return map.get(key)!;
      }

      const value = getter(key);

      map.set(key, value);

      return value;
    },
  };
};
