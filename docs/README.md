# json-schema-describes-subset

`0.3.0`

This package provides tools for static JSON schema analysis.

One of these is its eponymous function
[schemaDescribesSubset](#schemadescribessubset) which tries to determine whether
all data values that satisfy one JSON schema also satisfy another one (which
would mean that the first schema described a subset of the set of data values
that satisfy the second schema).

Other functions that might be useful include

- [schemaDescribesEmptySet](#schemadescribesemptyset), which tries to determine
  whether a schema does not accept any values at all
- [toDNF](#todnf), which transforms a schema to a
  [_disjunctive normal form_](https://en.wikipedia.org/wiki/Disjunctive_normal_form)
- [schemasAreEquivalent](#schemasareequivalent), which tries to determine
  whether two schemas both accept the exact same data values.
- [schemaDescribesUniverse](#schemadescribesuniverse), which tries to determine
  whether a schema will accept any arbitrary JSON value.

All of these functions work out of the box with
[standard JSON Schema](#jsonschema), but can also regard
[custom keywords using plugins](/docs/customization.md#plugin).

## Installation

```console
npm install json-schema-describes-subset
```

## Terminology

### Discriminative functions

The functions [schemaDescribesSubset](#schemadescribessubset),
[schemaDescribesEmptySet](#schemadescribesemptyset),
[schemasAreEquivalent](#schemasareequivalent) and
[schemaDescribesUniverse](#schemadescribesuniverse), which return
`boolean | null` values are referred to as **_discriminative functions_**. (As
opposed to [toDNF](#todnf), which doesn't discriminate anything but rather
transforms the provided schema.)

### Contradictions

The reasons why a [discriminative function](#discriminative-functions) would
return `true` are also referred to as **_contradictions_**, since they are
determined in [schemaDescribesEmptySet](#schemadescribesemptyset) and a schema's
internal contradiction would be a reason why the schema doesn't accept any value
and therefore describes the empty set.

### "subschema", "subset schema" and "superset schema"

It might appear natural to refer to a schema that describes the subset of the
set described by another schema as "subschema". This project however sticks to
the terminology of the
[JSON Schema specification](https://json-schema.org/draft/2020-12/json-schema-core#section-4.3.5),
where "subschema" refers to a schema that is contained in a surrounding parent
schema. Instead "subset schema" or "superset schema" might be used to express
the relation between the sets of data values that satisfy the respective
schemas.

## `schemaDescribesSubset`

> **schemaDescribesSubset**(`potentialSubsetSchema`, `potentialSupersetSchema`,
> `options?`): `null` | `boolean`

Defined in:
[schema-describes-subset/schema-describes-subset.ts:99](/src/schema-describes-subset/schema-describes-subset.ts#L99)

Tries to determine whether the first argument JSON schema
(`potentialSubsetSchema`) describes a subset of the set of data values described
by the second argument JSON schema (`potentialSupersetSchema`).

### Parameters

| Parameter                 | Type                        |
| ------------------------- | --------------------------- |
| `potentialSubsetSchema`   | [`JSONSchema`](#jsonschema) |
| `potentialSupersetSchema` | [`JSONSchema`](#jsonschema) |
| `options?`                | [`Options`](#options)       |

### Returns

`null` | `boolean`

Returns `true` if it does find a reason to do so.

If such a reason cannot be found, usually `null` is returned to indicate the
possibility of false negatives. (Not having found any reason to return `true`
doesn't mean that there aren't any.)

This behavior is sufficient for many use cases and has been the focus so far.
The ability to determine true positive `true` results is fairly powerful and
will work in many complex cases. (See the following [examples](#example) and
[Limitations](#limitations).) The true positive `false` return value is
currently only returned if an example data value that satisfies
`potentialSubsetSchema` but not `potentialSupersetSchema` can be trivially
found. See [Limitations](#limitations) for more details.

### Example

If a few of the following examples that return `true` seem unintuitive at first
glance, try to find a data value that satisfies the first schema but not the
second one. Failing to find such a data value might help to understand why
`true` is returned. (If, contrary to expectations, you actually are able to find
such a data value, please do report a
[bug](https://github.com/jobohner/json-schema-describes-subset/issues)).

```ts
import { schemaDescribesSubset } from 'json-schema-describes-subset'

console.log(
  schemaDescribesSubset(
    {
      type: 'number',
    },
    true,
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(false, {
    type: 'number',
  }),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      type: ['number', 'boolean', 'string', 'null'],
    },
    { type: ['number', 'null'] },
  ),
) // logs: `false`

console.log(
  schemaDescribesSubset(
    { type: 'integer' },
    { type: ['number', 'string', 'boolean'] },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      minimum: 5.5,
    },
    {
      exclusiveMinimum: 5.5,
    },
  ),
) // logs: `false`

console.log(
  schemaDescribesSubset(
    {
      minimum: 5.6,
    },
    {
      exclusiveMinimum: 5.5,
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { minimum: 10, maximum: 30, multipleOf: 5 },
    { anyOf: [{ multipleOf: 3 }, { multipleOf: 20 }, { enum: [10, 25] }] },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { type: 'string', maxLength: 5, minLength: 10 },
    { type: 'null' },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      prefixItems: [{ type: 'string' }, { type: 'boolean' }],
      items: { type: 'object' },
    },
    {
      prefixItems: [
        { type: ['string', 'number'] },
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { contains: { type: 'number' }, minContains: 5 },
    { minItems: 5 },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      prefixItems: [{ type: 'number' }, { type: 'boolean' }],
      items: { type: 'string' },
      maxItems: 3,
    },
    { uniqueItems: true },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { required: ['a'], maxProperties: 2 },
    {
      anyOf: [
        { properties: { b: { type: 'string' } } },
        { properties: { c: { type: 'string' } } },
      ],
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { maxProperties: 2, required: ['abc', 'def'] },
    { propertyNames: { minLength: 2 } },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { maxProperties: 1 },
    {
      anyOf: [
        { properties: { x: { type: 'string' } } },
        { patternProperties: { '^a$': { type: 'string' } } },
      ],
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      additionalProperties: { type: 'number' },
      properties: { a: { type: 'string' } },
    },
    {
      additionalProperties: { type: 'number' },
      properties: {
        a: { type: 'string' },
        b: { type: ['boolean', 'number'] },
      },
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      allOf: [
        {
          properties: {
            aa: { type: 'string' },
            aaa: { type: 'string' },
            aaaa: { type: 'string' },
          },
          patternProperties: {
            '^b+$': { type: 'string' },
          },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^b+$': true,
          },
        },
        {
          propertyNames: { not: { pattern: '^b+$' } },
        },
      ],
    },
    {
      additionalProperties: { type: 'number' },
      patternProperties: {
        '^a+$': { type: 'string' },
      },
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      patternProperties: {
        '^a+$': { type: 'string' },
        '^b+$': { type: 'boolean' },
      },
      propertyNames: { pattern: '^a+$' },
    },
    {
      additionalProperties: false,
      patternProperties: { '^a+$': { type: 'string' } },
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { required: ['a', 'b', 'c'] },
    { dependentRequired: { a: ['b', 'c'] } },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      properties: {
        b: { type: 'number' },
      },
      additionalProperties: false,
    },
    {
      properties: {
        b: { type: ['string', 'number'] },
      },
      dependentSchemas: {
        a: {
          properties: {
            b: {
              type: 'string',
            },
          },
        },
      },
    },
  ),
) // logs: `true`
```

### Remarks

#### Use Cases

This function is useful whenever you want to ensure that different data
interfaces are compatible with each other.

For example, it can be used to check whether a new API version is backwards
compatible with the old one.

Several other good use cases where a function like `schemaDescribesSubset` might
come in handy, are described in the introduction of the paper
[Type Safety with JSON Subschema](https://arxiv.org/abs/2106.05271), which
follows the same goal as this function using a slightly different approach.

#### How does this work?

The implementation utilizes [schemaDescribesEmptySet](#schemadescribesemptyset)
and the fact that A ⊆ B if and only if A ∩ ¬B = ∅. (That relation should be
obvious if illustrated in a venn diagram.)

It basically looks similar to this:

```typescript
function schemaDescribesSubset(
  potentialSubsetSchema: JSONSchema,
  potentialSupersetSchema: JSONSchema,
): boolean | null {
  return schemaDescribesEmptySet({
    allOf: [potentialSubsetSchema, { not: potentialSupersetSchema }],
  })
}
```

#### Good to know: Validation using `schemaDescribesSubset`

`schemaDescribesSubset` uses
[Ajv](https://ajv.js.org/json-schema.html#draft-2020-12) to validate `consts`
among others. It can be configured using
[ValidationPlugin](/docs/customization.md#validationplugin)s. If you ever need a
routine that validates a value `a` against a schema `B` and that is equally
configured, an alternative to importing and configuring Ajv would be to use:

```typescript
schemaDescribesSubset({ const: a }, B)
```

This is one of the cases where
[a definite boolean is always returned and never `null`](#limitations).

However, since this is not optimized for performance, configuring and using a
validator might often be the better choice.

## `JSONSchema`

> **JSONSchema** = [`JSONSchemaObject`](/src/json-schema/json-schema.ts#L6) |
> `boolean`

Defined in: [json-schema/json-schema.ts:56](/src/json-schema/json-schema.ts#L56)

A schema compatible with the
[JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)
specification. If you would like to use one of the functions provided by this
project with an older JSON Schema draft, you could try to use something like
[alterschema](https://github.com/sourcemeta-research/alterschema).

In the functions that accept more than one schema
([schemaDescribesSubset](#schemadescribessubset) and
[schemasAreEquivalent](#schemasareequivalent)) it is assumed that when a schema
resource's `$id` appears in more than one of the root schemas, the respective
schemas are identical.

Since currently [Ajv](https://ajv.js.org/json-schema.html#draft-2020-12) is used
under the hood, the [`nullable`](https://ajv.js.org/json-schema.html#nullable)
keyword is supported out of the box, despite of not being a standard JSON Schema
keyword.

Custom keywords can be supported and the behavior of standard keywords can be
customized using [Plugin](/docs/customization.md#plugin)s.

In order to be permissive towards custom keywords, the type is equivalent to

```ts
Record<string, unknown> | boolean
```

but it still provides code completion and tool tip documentation for standard
keywords.

There are only limited checks whether the provided schemas are actually valid.
Providing invalid schemas will cause undefined behavior.

Referenced schema resources (`$ref`) are not retrieved via their url. If a
referenced resource is not part of the schema itself, it needs to be provided in
[Options.definitions](#definitions).

### ⚠️ Currently unsupported keywords

Some of the standard keywords of
[JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12) are not
supported yet at all (`$dynamicRef`, `$dynamicAnchor`, `unevaluatedItems` and
`unevaluatedProperties`). JSON schemas passed as arguments to [toDNF](#todnf)
that contain any of them might cause an exception to be thrown. If such schemas
are passed to any of the [discriminative functions](#discriminative-functions)
(like [schemaDescribesSubset](#schemadescribessubset) or
[schemaDescribesEmptySet](#schemadescribesemptyset)) a false negative `null`
value might be returned.

## `Options`

> **Options** = `object`

Defined in: [options/options.ts:35](/src/options/options.ts#L35)

### Properties

#### baseURI?

> `optional` **baseURI**: `string` | (`string` | `null` | `undefined`)\[]

Defined in: [options/options.ts:48](/src/options/options.ts#L48)

If a schema does not have an `$id` or the `$id` is a relative URI, a `baseURI`
can be provided in the `Options` object. For example, this could be the schema's
retrieval URI.

Providing a non relative baseURI (either as part of the `Options` object or
`$id`) is important if the schema contains relative `$ref`s.

In functions that accept more than one schema as arguments (like
[schemaDescribesSubset](#schemadescribessubset) or
[schemasAreEquivalent](#schemasareequivalent)) `baseURI` can be an array of
strings which correspond to each schema.

---

#### definitions?

> `optional` **definitions**: `Exclude`<[`JSONSchema`](#jsonschema),
> `boolean`>\[]

Defined in: [options/options.ts:57](/src/options/options.ts#L57)

Referenced schema resources (`$ref`) are not retrieved via their url. If a
referenced resource is not part of the schema itself, it needs to be provided
here.

TODO: make this also accept an object with retrieval urls as keys. This would
also support referenced to boolean schemas better.

---

#### plugins?

> `optional` **plugins**: [`Plugin`](/docs/customization.md#plugin)\[]

Defined in: [options/options.ts:65](/src/options/options.ts#L65)

Support non standard custom keywords by adding
[plugins](/docs/customization.md#plugin). There is one predefined custom plugin:
[formatPlugin](/docs/customization.md#formatplugin).

## Limitations

So far, the focus of this project for
[discriminative functions](#discriminative-functions) like
[schemaDescribesSubset](#schemadescribessubset) or
[schemaDescribesEmptySet](#schemadescribesemptyset) has been to find reasons why
`true` would be the correct result. They do so fairly powerfully and will find
such reasons in many complex schemas. These reasons are also referred to as
[_contradictions_](#contradictions) because they are determined by
[schemaDescribesEmptySet](#schemadescribesemptyset) and a contradiction would be
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
to an API are checked for backwards compatibility using
[schemaDescribesSubset](#schemadescribessubset), you would only want to know
whether the result is `true` or not.

All falsy return values could therefore be regarded as "`false` with possible
false negatives".

🚧TODO🚧: comprehensive description of how each keyword is evaluated, so that
the reader gets an idea of what to expect exactly. Maybe as doc of each built-in
plugin?

### Examples for currently undetected contradictions

The following are examples of keywords which may impose currently undetected
contradictions and therefore might cause false negative `null` results.

#### `pattern` and `patternProperties`

When comparing string patterns, they are checked for equality, but their
internal logic is not analyzed any further.

```typescript
schemaDescribesSubset(
  // potentialSubsetSchema:
  { pattern: '^[abc]{3}$' },
  // potentialSupersetSchema:
  { pattern: '^[abc]{2,3}$' },
) // returns `null`
```

This returns **`null`** even though the schema `{ pattern: '^[abc]{3}$' }` does
in fact describe a subset of the set of values that satisfy
`{ pattern: '^[abc]{2,3}$' }`, but this is not determined by
`schemaDescribesSubset`, since unequal patterns aren't analyzed any further.

In some cases it is possible to receive an unambiguous result by creating the
schemas in a way where equal patterns appear in both schemas:

```typescript
schemaDescribesSubset(
  // potentialSubsetSchema:
  { pattern: '^[abc]{3}$' },
  // potentialSupersetSchema:
  { anyOf: [{ pattern: '^[abc]{2}$' }, { pattern: '^[abc]{3}$' }] },
) // returns `true`
```

This `potentialSupersetSchema` is equivalent to the one in the previous example,
but shares a pattern with the `potentialSubsetSchema` and therefore `true` can
be determined as the result.

Also, constant values might be tested against patterns, so that the following
returns `true`:

```typescript
schemaDescribesSubset(
  // potentialSubsetSchema:
  { required: ['a', 'aa'], maxProperties: 2 },
  // potentialSupersetSchema:
  { propertyNames: { pattern: '^a+$' } },
) // returns `true`
```

#### `$ref`

`$ref`s are currently only compared for whether they reference the same
resource. Future improvements could involve inlining referenced resources and
therefore produce less false negative results.

🚧TODO🚧: add more examples, so that the reader gets an idea of what to expect
exactly

### Currently unsupported keywords

Some keywords are not supported yet at all (`$dynamicRef`, `$dynamicAnchor`,
`unevaluatedItems` and `unevaluatedProperties`). Using schemas that contain any
of them might cause errors to be thrown or possibly false negatives (`null`) to
be returned. See [JSONSchema](#jsonschema) for details.

## `schemaDescribesEmptySet`

> **schemaDescribesEmptySet**(`schema`, `options?`): `null` | `boolean`

Defined in: [dnf/dnf.ts:607](/src/dnf/dnf.ts#L607)

Tries to determine whether the provided JSON Schema is unsatisfiable and
therefore describes the empty set. In that case, the schema would be equivalent
to the `false` schema.

### Parameters

| Parameter  | Type                        |
| ---------- | --------------------------- |
| `schema`   | [`JSONSchema`](#jsonschema) |
| `options?` | [`Options`](#options)       |

### Returns

`null` | `boolean`

Returns `true` if it does find a reason why the schema will not accept any
value.

If such a reason cannot be found, usually `null` is returned to indicate the
possibility of false negatives.

The true positive `false` return value is currently only returned if an example
data value that satisfies the schema can be trivially found. See
[Limitations](#schemadescribesemptyset) for more details.

### Example

```ts
import { schemaDescribesEmptySet } from 'json-schema-describes-subset'

console.log(schemaDescribesEmptySet(false)) // logs: `true`

console.log(
  schemaDescribesEmptySet(
    // this schema will accept anything that is not a number
    { minimum: 2, maximum: 1 },
  ),
) // logs: `false`

console.log(
  schemaDescribesEmptySet({
    type: 'number',
    minimum: 2,
    maximum: 1,
  }),
) // logs: `true`
```

### Remarks

### How does this work?

The provided schema is first transformed to a
[disjunctive normal form](https://en.wikipedia.org/wiki/Disjunctive_normal_form)
similar to the one returned by [toDNF](#todnf). Then each disjunct is checked
for contradictions which would make it unsatisfiable. If a contradiction is
found for each disjunct, the complete schema is unsatisfiable and `true` is
returned.

## `toDNF`

> **toDNF**<`Options_`>(`schema`, `options?`): `DNFFromOptions`<`Options_`>

Defined in: [dnf/dnf.ts:446](/src/dnf/dnf.ts#L446)

Transforms the given schema to a
[disjunctive normal form](https://en.wikipedia.org/wiki/Disjunctive_normal_form)
similar to the one utilized by
[schemaDescribesEmptySet](#schemadescribesemptyset).

### Type Parameters

| Type Parameter                                            | Default type |
| --------------------------------------------------------- | ------------ |
| `Options_` _extends_ `undefined` \| [`Options`](#options) | `undefined`  |

### Parameters

| Parameter  | Type                        |
| ---------- | --------------------------- |
| `schema`   | [`JSONSchema`](#jsonschema) |
| `options?` | `Options_`                  |

### Returns

`DNFFromOptions`<`Options_`>

The resulting dnf schema will be equivalent to the provided schema (meaning that
it will accept the same data values) but all
[boolean combinations](https://json-schema.org/understanding-json-schema/reference/combining)
will be restructured.

Subschemas that represent property values of a JSON object or elements of a JSON
array do not represent boolean combinations. They are currently considered
atomic for that purpose.

The resulting dnf schema will be simplified so that disjuncts that were
determined to be unsatisfiable are already eliminated. If each disjunct was
determined to be unsatisfiable the return value is `false`.

The return type's most general form (without specified [plugin](#plugins) types,
for example returned by `toDNF<Options>(...)`) is equivalent to:

```ts
type GeneralDNFSpelledOut =
  | boolean
  | {
      anyOf: (
        | { const: unknown }
        | {
            [mergeableKeyword: string]: unknown
            type: 'string' | 'number' | 'object' | 'array'
            allOf?: JSONSchema[]
            const?: never
            anyOf?: never
            not?: never
          }
      )[]
    }
```

If the provided option's type does not contain any custom [plugins](#plugins),
the default return type (for example returned by `toDNF(schema)` (without
options) or by `toDNF<{ plugins: [] }>(...)`) is equivalent to:

```ts
type DefaultDNFSpelledOut =
  | boolean
  | {
      anyOf: (
        | { const: unknown }
        | {
            type: 'number'
            maximum?: number
            minimum?: number
            multipleOf?: number
            allOf?: (
              | { not: { const: number } }
              | { not: { multipleOf: number } }
              | { $ref: string }
              | { not: { $ref: string } }
            )[]
            const?: never
            anyOf?: never
            not?: never
          }
        | {
            type: 'string'
            maxLength?: number
            minLength?: number
            allOf?: (
              | { not: { const: string } }
              | { pattern: string }
              | { not: { pattern: string } }
              | { $ref: string }
              | { not: { $ref: string } }
            )[]
            const?: never
            anyOf?: never
            not?: never
          }
        | {
            type: 'object'
            maxProperties?: number
            minProperties?: number
            patternProperties?: Record<string, JSONSchema>
            properties?: Record<string, JSONSchema>
            propertyNames?: JSONSchema
            required?: string[]
            allOf?: (
              | { not: { const: Record<string, unknown> } }
              | {
                  additionalProperties: JSONSchema
                  properties?: Record<string, true>
                  patternProperties?: Record<string, true>
                }
              | { not: { patternProperties: Record<string, JSONSchema> } }
              | {
                  not: {
                    additionalProperties: JSONSchema
                    properties?: Record<string, true>
                    patternProperties?: Record<string, true>
                  }
                }
              | { not: { propertyNames: JSONSchema } }
              | { $ref: string }
              | { not: { $ref: string } }
            )[]
            const?: never
            anyOf?: never
            not?: never
          }
        | {
            type: 'array'
            items?: JSONSchema
            maxItems?: number
            minItems?: number
            prefixItems?: JSONSchema[]
            uniqueItems?: boolean
            allOf?: (
              | { not: { const: unknown[] } }
              | {
                  contains: JSONSchema
                  minContains?: number
                  maxContains?: number
                }
              | {
                  not: { uniqueItems?: boolean }
                }
              | {
                  not: {
                    prefixItems?: true[]
                    items?: JSONSchema
                  }
                }
              | { $ref: string }
              | { not: { $ref: string } }
            )[]
            const?: never
            anyOf?: never
            not?: never
          }
      )[]
    }
```

The return type will adjust according to the (explicit or inferred) type of the
property `plugins` of the provided `options`.

### Example

```typescript
import { toDNF } from 'json-schema-describes-subset'

console.log(
  toDNF({
    anyOf: [{ minimum: 2 }, { exclusiveMinimum: 1 }],
  }),
)
```

logs:

```json
{
  "anyOf": [
    { "const": null },
    { "const": true },
    { "const": false },
    { "type": "number", "minimum": 1, "allOf": [{ "not": { "const": 1 } }] },
    { "type": "string" },
    { "type": "array" },
    { "type": "object" }
  ]
}
```

---

```typescript
import { toDNF } from 'json-schema-describes-subset'

console.log(
  toDNF({
    anyOf: [{ multipleOf: 2 }, { multipleOf: 3 }, { multipleOf: 4 }],
  }),
)
```

logs:

```json
{
  "anyOf": [
    { "const": null },
    { "const": true },
    { "const": false },
    { "type": "number", "multipleOf": 2 },
    { "type": "number", "multipleOf": 3 },
    { "type": "string" },
    { "type": "array" },
    { "type": "object" }
  ]
}
```

### Remarks

#### Use cases

This function was created mainly for demonstration purposes, but might also have
some real world use cases. For example when creating a data mocking tool, that
generates example data for a given schema, it might be easier to generate that
data for one of the logically flat disjuncts instead of a complex schema which
is logically deeply nested.

## `schemasAreEquivalent`

> **schemasAreEquivalent**(`schemaA`, `schemaB`, `options?`): `null` | `boolean`

Defined in: [derived/derived.ts:60](/src/derived/derived.ts#L60)

Tries to determine whether the provided schemas accept the exact same set of
data values.

### Parameters

| Parameter  | Type                        |
| ---------- | --------------------------- |
| `schemaA`  | [`JSONSchema`](#jsonschema) |
| `schemaB`  | [`JSONSchema`](#jsonschema) |
| `options?` | [`Options`](#options)       |

### Returns

`null` | `boolean`

The [limitations](#limitations) concerning false negative `null` results apply
here.

### Example

🚧TODO🚧

### Remarks

#### Use cases

One possible use case could be: If you are creating a tool that transforms a
JSON Schema to another representation (like [toDNF](#todnf)), this function
could be useful to help create tests.

## `schemaDescribesUniverse`

> **schemaDescribesUniverse**(`schema`, `options?`): `null` | `boolean`

Defined in: [derived/derived.ts:30](/src/derived/derived.ts#L30)

Tries to determine whether the provided schema accepts any JSON value. In that
case, the schema would be equivalent to the `true` or `{}` schema.

### Parameters

| Parameter  | Type                        |
| ---------- | --------------------------- |
| `schema`   | [`JSONSchema`](#jsonschema) |
| `options?` | [`Options`](#options)       |

### Returns

`null` | `boolean`

The [limitations](#limitations) concerning false negative `null` results apply
here.

### Example

🚧TODO🚧

### Remarks

#### Use cases

Can't think of any 🤷‍♂️. This function was created only because it was so easy to
do so.

## Vision

This project is under active development. The following tries to deliver an idea
of what future changes might (or might not) include.

### What this project does _not_ try to achieve

The following does not fall within this project's scope:

- Create a JSON Schema validation tool

  There already are good validation solutions. For this project
  [Ajv](https://ajv.js.org/json-schema.html#draft-2020-12) is used internally
  for validation. This is regarded by of this project's functions. For example,
  if [schemaDescribesEmptySet](#schemadescribesemptyset) returns true, there
  isn't any value that would satisfy the schema according to Ajv.

  (Technically it would actually be fairly easy to switch to another validation
  solution)

- Support of older JSON Schema drafts

  This project tries to always support the latest JSON Schema draft (currently
  2020-12). You could try to convert your schemas that are built according to an
  older draft before passing them to any of this project's functions using a
  tool like [alterschema](https://github.com/sourcemeta-research/alterschema).

### What this project _does_ try to achieve

The main focus of this project is its eponymous function
[schemaDescribesSubset](#schemadescribessubset). A major goal is to minimize
[false negative (`null`) results](#limitations) while simultaneously making sure
that a boolean result is always true positive/true negative. One way to get
closer to that goal is to add or optimize support for
[standard keywords](#limitations).

Additional
[predefined custom plugins](/docs/customization.md#predefined-custom-plugins)
might be added to support more non standard keywords, if they are very common.

Another goal is to increase the number of cases where a boolean result is
returned.

## Contributing

Any kind of
[feedback](https://github.com/jobohner/json-schema-describes-subset/issues) and
[code contribution](/CONTRIBUTING.md#pull-requests) is highly appreciated. Make
sure to always adhere to this project's [code of conduct](/CODE_OF_CONDUCT.md)

See [`CONTRIBUTING.md`](/CONTRIBUTING.md) for details.

## Contributors

- Johannes Bohner <johannes.bohner@gmail.com>

## License

[MIT](/LICENSE)
