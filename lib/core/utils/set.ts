import { isObject } from "./isObject";

const indexRegex = /^\d+$/;

export function set(obj: Record<string, unknown>, path: string, value: unknown) {
  if (obj == null) {
    return false;
  }

  try {
    const keys = path.split(".");
    let parent: Record<string, unknown> = obj;
    let current: unknown = obj;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (current == null) {
        const prevKey = keys[i - 1];

        parent[prevKey] = indexRegex.test(key) ? [] : {};
        current = parent[prevKey];
      }

      if (!isObject(current)) {
        return false;
      }

      if (i === keys.length - 1) {
        current[key] = value;
      } else {
        parent = current;
        current = current[key];
      }

    }

    return true;
  } catch (e) {
    console.info("Error occurred while setting value to", path);
    console.error(e);
    return false;
  }
}
