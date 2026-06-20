import type { ErrorMeta } from "../types";
import { isObject } from "./isObject";

export function parseRawError(error: unknown): { message: string; meta: ErrorMeta } {
  if (isObject(error) && typeof error.message === "string") {
    const { message, ...meta } = error;

    return {
      message,
      meta,
    };
  }

  return {
    message: typeof error === "string" ? error : "Error",
    meta: {},
  };
}
