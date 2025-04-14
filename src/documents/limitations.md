# Limitations

So far, the focus of this project for
[discriminative functions](discriminative-functions.md) like {@link
index!schemaDescribesSubset} or {@link index!schemaDescribesEmptySet} has been
to find reasons why `true` would be the correct result. They do so fairly
powerfully and will find such reasons in many complex schemas. These reasons are
also referred to as [_contradictions_](contradictions.md) because they are
determined by {@link index!schemaDescribesEmptySet} and a contradiction would be
a reason why a schema would not accept any value.

However there are also cases where such reasons for a `true` result cannot be
found (see the
[examples below](#examples-for-currently-undetected-contradictions)). When
reasons for a `true` result couldn't be found, usually `null` is returned,
meaning either there are no reasons to return `true` and actually `false` would
be the correct result (true negative) or there are reasons to return `true`, but
they couldn't be determined (false negative). Currently only some trivial cases
actually return `false`.

In many use cases, where `false` and "possibly `false`" results would be treated
equally, this behavior would be completely sufficient. For example, if changes
to an API are checked for backwards compatibility using {@link
index!schemaDescribesSubset}, you would only want to know whether the result is
`true` or not.

All falsy return values could therefore be regarded as "`false` with possible
false negatives".

🚧TODO🚧: comprehensive description of how each keyword is evaluated, so that
the reader gets an idea of what to expect exactly. Maybe as doc of each built-in
plugin?

## Examples for currently undetected contradictions

The following are examples of keywords which may impose currently undetected
contradictions and therefore might cause false negative `null` results.

### `pattern` and `patternProperties`

When comparing string patterns, they are checked for equality, but their
internal logic is not analyzed any further.

{@include ./limitations-examples/snapshots/string-pattern-examples.md}

### `$ref`

`$ref`s are currently only compared for whether they reference the same
resource. Future improvements could involve inlining referenced resources and
therefore produce less false negative results.

🚧TODO🚧: add more examples, so that the reader gets an idea of what to expect
exactly

## Currently unsupported keywords

Some keywords are not supported yet at all (`$dynamicRef`, `$dynamicAnchor`,
`unevaluatedItems` and `unevaluatedProperties`). Using schemas that contain any
of them might cause errors to be thrown or possibly false negatives (`null`) to
be returned. See {@link index!JSONSchema} for details.
