export abstract class ProtectedControl<TValue = unknown> {
  protected abstract _setValue(value: TValue | undefined): void;
  protected abstract _patchValue(value: unknown): void;
  protected abstract _resetValue(): void;
}
