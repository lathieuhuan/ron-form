import type { AnyObject, DeepKeys } from "./types";

import { get } from "./utils/object";

type PropertySegment = {
  type: "property";
  value: string;
};

type ItemSegment = {
  type: "item";
  value: number;
};

type IdentitySegment = PropertySegment | ItemSegment;

/**
 * If every segment is a property: `key.nestedKey.etc`.
 * Otherwise: `JSON.stringify(segments)`.
 */
export type FieldId = string;

function encode(segments: IdentitySegment[]): FieldId {
  if (segments.every((segment) => segment.type === "property")) {
    return segments.map((segment) => segment.value).join(".");
  }

  return JSON.stringify(segments);
}

function decode(fieldId: FieldId): IdentitySegment[] {
  if (!fieldId.startsWith("[")) {
    return fieldId.split(".").map((value) => ({
      type: "property",
      value,
    }));
  }

  return JSON.parse(fieldId) as IdentitySegment[];
}

function isIndex(value: string): boolean {
  return /^\d+$/.test(value);
}

export class FieldIdentityRegistry<TFormValues> {
  private arrayItemIds = new Map<FieldId, number[]>();
  private itemId = 1;

  private nextItemId(): number {
    return this.itemId++;
  }

  toFieldId(path: DeepKeys<TFormValues>, values: TFormValues): FieldId | null {
    const pathSegments = path.split(".");
    const idSegments: IdentitySegment[] = [];
    let current: unknown = values;

    for (const pathSegment of pathSegments) {
      if (Array.isArray(current) && isIndex(pathSegment)) {
        const index = Number(pathSegment);

        if (index < 0 || index >= current.length) {
          return null;
        }

        const arrayKey = encode(idSegments);
        const itemIds = this.ensureItemIds(arrayKey, current.length);

        idSegments.push({
          type: "item",
          value: itemIds[index],
        });
        current = current[index];
        continue;
      }

      idSegments.push({
        type: "property",
        value: pathSegment,
      });

      if (current == null || typeof current !== "object") {
        current = undefined;
      } else {
        current = (current as AnyObject)[pathSegment];
      }
    }

    return encode(idSegments);
  }

  toFieldKey(fieldId: FieldId, values: TFormValues): DeepKeys<TFormValues> | null {
    const idSegments = decode(fieldId);
    const publicSegments: string[] = [];
    const stableSegments: IdentitySegment[] = [];
    let current: unknown = values;

    for (const segment of idSegments) {
      if (segment.type === "property") {
        publicSegments.push(segment.value);
        stableSegments.push(segment);

        if (current == null || typeof current !== "object") {
          current = undefined;
        } else {
          current = (current as AnyObject)[segment.value];
        }

        continue;
      }

      if (!Array.isArray(current)) {
        return null;
      }

      const itemIds = this.arrayItemIds.get(encode(stableSegments));
      const index = itemIds?.indexOf(segment.value) ?? -1;

      if (index < 0 || index >= current.length) {
        return null;
      }

      publicSegments.push(String(index));
      stableSegments.push(segment);
      current = current[index];
    }

    return publicSegments.join(".");
  }

  prepareArray(
    path: DeepKeys<TFormValues>,
    values: TFormValues,
    fallbackLength?: number,
  ): FieldId | null {
    const value = get(values as AnyObject, path);

    if (!Array.isArray(value) && fallbackLength === undefined) {
      return null;
    }

    const key = this.toFieldId(path, values);

    if (key == null) {
      return null;
    }

    this.ensureItemIds(key, Array.isArray(value) ? value.length : fallbackLength!);

    return key;
  }

  insert(arrayId: FieldId, index: number): FieldId {
    const itemIds = this.arrayItemIds.get(arrayId) ?? [];
    const itemId = this.nextItemId();

    itemIds.splice(index, 0, itemId);
    this.arrayItemIds.set(arrayId, itemIds);

    return this.itemFieldId(arrayId, itemId);
  }

  remove(arrayId: FieldId, index: number): FieldId | null {
    const itemIds = this.arrayItemIds.get(arrayId);

    if (itemIds == null || index < 0 || index >= itemIds.length) {
      return null;
    }

    const [itemId] = itemIds.splice(index, 1);
    const removedItemKey = this.itemFieldId(arrayId, itemId);

    this.removeArrayDescendants(removedItemKey);

    return removedItemKey;
  }

  move(arrayId: FieldId, fromIndex: number, toIndex: number): void {
    const itemIds = this.arrayItemIds.get(arrayId);

    if (itemIds == null) {
      return;
    }

    const [itemId] = itemIds.splice(fromIndex, 1);
    itemIds.splice(toIndex, 0, itemId);
  }

  swap(arrayId: FieldId, indexA: number, indexB: number): void {
    const itemIds = this.arrayItemIds.get(arrayId);

    if (itemIds == null) {
      return;
    }

    [itemIds[indexA], itemIds[indexB]] = [itemIds[indexB], itemIds[indexA]];
  }

  replace(arrayId: FieldId, length: number): FieldId[] {
    const oldItemIds = this.arrayItemIds.get(arrayId) ?? [];
    const removedItemIds = oldItemIds.map((itemId) => this.itemFieldId(arrayId, itemId));

    for (const removedItemId of removedItemIds) {
      this.removeArrayDescendants(removedItemId);
    }

    this.arrayItemIds.set(
      arrayId,
      Array.from({ length }, () => this.nextItemId()),
    );

    return removedItemIds;
  }

  isSameOrDescendant(fieldId: FieldId, prefix: FieldId): boolean {
    const segments = decode(fieldId);
    const prefixSegments = decode(prefix);

    if (segments.length < prefixSegments.length) {
      return false;
    }

    return prefixSegments.every((segment, index) => {
      const candidate = segments[index];

      return candidate.type === segment.type && candidate.value === segment.value;
    });
  }

  clear(): void {
    this.arrayItemIds.clear();
  }

  /** Ensure item ids of the array are created up to the given length. */
  private ensureItemIds(arrayKey: FieldId, length: number): number[] {
    const itemIds = this.arrayItemIds.get(arrayKey) ?? [];

    while (itemIds.length < length) {
      itemIds.push(this.nextItemId());
    }

    this.arrayItemIds.set(arrayKey, itemIds);

    return itemIds;
  }

  private itemFieldId(arrayId: FieldId, itemId: number): FieldId {
    return encode([
      ...decode(arrayId),
      {
        type: "item",
        value: itemId,
      },
    ]);
  }

  private removeArrayDescendants(itemKey: FieldId): void {
    for (const key of this.arrayItemIds.keys()) {
      if (this.isSameOrDescendant(key, itemKey)) {
        this.arrayItemIds.delete(key);
      }
    }
  }
}
