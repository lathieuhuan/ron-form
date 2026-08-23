export function require(value?: string | number | null) {
  if (value == null || (typeof value === "string" && value.trim() === "")) {
    return "Required";
  }

  return null;
}
