export function useInitialValue<T>(getter: () => T) {
  let initialValue: T | undefined;
  return initialValue || (initialValue = getter());
}
