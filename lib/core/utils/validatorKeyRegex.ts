/**
 * Not used, we've moved to not allow a specific array item path, e.g. "a.0"
 */
export const validatorKeyRegex = (path: string) => {
  // If the segment is a number, replace it with a wildcard regex to match either the number or [n]
  const wildcardPath = path
    .split(".")
    .map((segment) => (/^\d+$/.test(segment) ? `(?:${segment}|\\[n\\])` : segment))
    .join("\\.");

  return new RegExp(`^${wildcardPath}$`);
};
