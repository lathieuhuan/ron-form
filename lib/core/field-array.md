# Enhance Array Field handling

## Problems

`fieldMetaMap` in FormCore is keyed by field name (DeepKeys), leading to 2 problems:

1. When the field array changes in item order, the field metas stay the same, causing field value and meta mismatching.

2. When the async validation of an item is running and the field array changes in item order, the validation result will be updated into the wrong meta.

## Solution

Each field array has an internal ordered list of item IDs. Public values, field names,
subscriptions, validators, and errors continue to use index-based paths.

Field metadata and async-validation bookkeeping use stable keys composed from these IDs.
Inserting creates a new identity, removing deletes the removed identity and its descendant
state, and moving or swapping reorders IDs while preserving item state. Nested arrays are
scoped by their parent item IDs, so their state also survives parent reordering.

Async validation captures the stable field key. On completion, the key is resolved to the
item's current index before metadata is updated and public error paths are produced. Results
are discarded when the item has been removed or replaced. Aborted runs are always removed
from validating state.

Calling `setFieldValue` for an entire array is a full replacement. All item identities,
descendant metadata, and pending descendant validation are discarded, and the replacement
items receive fresh identities. `reset` also clears all identities and pending validation.
