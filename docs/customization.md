# Customization with plugins

## `Plugin`

> **Plugin** = ([`ValidationPlugin`](#validationplugin) |
> [`ExtractionPlugin`](#extractionplugin) |
> [`SimplificationPlugin`](#simplificationplugin))\[]

Defined in: [plugin/plugin.ts:55](/src/plugin/plugin.ts#L55)

Can be used to modify how schemas are interpreted, for example by regarding
additional keywords.

There are three kinds of plugins:

- [ValidationPlugin](#validationplugin),
- [ExtractionPlugin](#extractionplugin), and
- [SimplificationPlugin](#simplificationplugin).

A plugin added to [Options.plugins](/docs/README.md#plugins) is an array of one
or more of these.

Usually a plugin consists of

- a [ValidationPlugin](#validationplugin) that modifies how data values are
  validated against a JSON Schema and
- one or more [Extraction-](#extractionplugin) and/or
  [SimplificationPlugin](#simplificationplugin)s that adjust, how schemas are
  transformed into their respective simplified disjunctive normal form.

Examples for plugins are the internal
[built in plugins](/docs/built-in-plugins.md) and the predefined custom
[formatPlugin](#formatplugin).

## `ValidationPlugin`

Defined in: [plugin/plugin.ts:335](/src/plugin/plugin.ts#L335)

Customizes the internally used
[Ajv (draft 2020-12)](https://ajv.js.org/json-schema.html#draft-2020-12)
instance in order to support e. g. the `format` keyword or non-standard
keywords.

Ajv is used internally e. g. to check whether a `const` property satisfies a
schema or if a property name satisfies `propertyNames`.

A custom plugin which is added to [Options.plugins](/docs/README.md#plugins)
would usually contain a ValidationPlugin, because the purpose of these custom
plugins is to interpret a schema in a different way than it would be interpreted
by default.

As opposed to [ExtractionPlugin](#extractionplugin)s and
[SimplificationPlugin](#simplificationplugin)s, which are used internally as
built in plugins, there are no internal built in ValidationPlugins. This is
because the default behavior is supported out of the box.

### Properties

#### modifyAjv()

> **modifyAjv**: (`ajv`) => `void`

Defined in: [plugin/plugin.ts:339](/src/plugin/plugin.ts#L339)

Can be used to modify `ajv`, for example by using `ajv.addKeyword(...)`.

##### Parameters

| Parameter | Type      |
| --------- | --------- |
| `ajv`     | `Ajv2020` |

##### Returns

`void`

## `ExtractionPlugin`

Defined in: [plugin/plugin.ts:66](/src/plugin/plugin.ts#L66)

In order to transform a schema into its disjunctive normal form (DNF), at first
ExtractionPlugins are used to extract
[LogicalCombination](/src/atomic-schema/atomic-schema.ts#L24)s of
[AtomicSchema](/src/atomic-schema/atomic-schema.ts#L9)s.

### Properties

#### extract()

> **extract**: (`args`) =>
> [`LogicalCombination`](/src/atomic-schema/atomic-schema.ts#L24)

Defined in: [plugin/plugin.ts:71](/src/plugin/plugin.ts#L71)

Use this to extract a
[LogicalCombination](/src/atomic-schema/atomic-schema.ts#L24) of
[AtomicSchema](/src/atomic-schema/atomic-schema.ts#L9)s from the keywords of the
provided schema.

##### Parameters

| Parameter     | Type                                                                                                                                                            | Description                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `args`        | { `schema`: [`JSONSchemaObject`](/src/json-schema/json-schema.ts#L6); `split`: (`schema`) => [`LogicalCombination`](/src/atomic-schema/atomic-schema.ts#L24); } | -                                                                                                                                    |
| `args.schema` | [`JSONSchemaObject`](/src/json-schema/json-schema.ts#L6)                                                                                                        | The schema to extract from. This schema is the one that is to be transformed into its DNF.                                           |
| `args.split`  | (`schema`) => [`LogicalCombination`](/src/atomic-schema/atomic-schema.ts#L24)                                                                                   | Use this to recursively split "logical" subschemas (like the ones defined by the `not`, `anyOf` or `allOf` keywords (among others)). |

##### Returns

[`LogicalCombination`](/src/atomic-schema/atomic-schema.ts#L24)

---

#### overrides?

> `optional` **overrides**: `"string"` | `"number"` | `"object"` | `"array"` |
> `"allOf"` | `"anyOf"` | `"const"` | `"not"` | `"oneOf"` | `"type"` | `"ref"` |
> `"ifThenElse"`

Defined in: [plugin/plugin.ts:88](/src/plugin/plugin.ts#L88)

Instead of adding functionality, an ExtractionPlugin can also replace one of the
[builtInExtractionPlugins](/src/built-in-plugins/built-in-plugins.ts#L29), by
setting [ExtractionPlugin.overrides](#overrides) to that built in plugin's id.

## `SimplificationPlugin`

Defined in: [plugin/plugin.ts:177](/src/plugin/plugin.ts#L177)

After a schema has been transformed to its DNF, each disjunct is simplified
using SimplificationPlugins, merging or omitting keywords if possible or to
`false` if a contradiction is detected.

### Type Parameters

| Type Parameter                                                                                                               | Default type                                                      |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `AppliesToJSONSchemaType` _extends_ [`JSONSchemaType`](/src/json-schema-type/json-schema-type.ts#L18)                        | [`JSONSchemaType`](/src/json-schema-type/json-schema-type.ts#L18) |
| `NonConstConjunctionSchemaObjectSimplifyReturnType` _extends_ [`NonConstConjunctionSchemaObject`](/src/plugin/plugin.ts#L97) | [`NonConstConjunctionSchemaObject`](/src/plugin/plugin.ts#L97)    |
| `MergeableKeyword` _extends_ keyof `NonConstConjunctionSchemaObjectSimplifyReturnType`                                       | keyof `NonConstConjunctionSchemaObjectSimplifyReturnType`         |

### Properties

#### appliesToJSONSchemaType?

> `optional` **appliesToJSONSchemaType**: `AppliesToJSONSchemaType` |
> `AppliesToJSONSchemaType`\[]

Defined in: [plugin/plugin.ts:191](/src/plugin/plugin.ts#L191)

Only the disjuncts with a `type` that is also specified here, are simplified
using this plugin.

If this is not set, or set to `undefined` the plugin is applied to any disjunct
regardless of their type.

---

#### mergeableKeywords

> **mergeableKeywords**: `MergeableKeyword`\[]

Defined in: [plugin/plugin.ts:202](/src/plugin/plugin.ts#L202)

For some keywords, multiple values can be merged into one. (For example multiple
`minimum` values can be merged). The result of [toDNF](/docs/README.md#todnf)
will contain these keywords (if present) as direct properties as opposed to
other keywords which cannot be merged and end up as elements of the simplified
disjunct's `allOf` array.

---

#### overrides?

> `optional` **overrides**: `"string"` | `"number"` | `"object"` | `"array"` |
> `"const"` | `"ref"`

Defined in: [plugin/plugin.ts:220](/src/plugin/plugin.ts#L220)

Instead of adding functionality, a SimplificationPlugin can also replace one of
the
[builtInSimplificationPlugins](/src/built-in-plugins/built-in-plugins.ts#L62),
by setting [SimplificationPlugin.overrides](#overrides-1) to that built in
plugin's id.

---

#### simplify()

> **simplify**: (`args`) =>
> [`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<`NonConstConjunctionSchemaObjectSimplifyReturnType`>
> & `object`

Defined in: [plugin/plugin.ts:210](/src/plugin/plugin.ts#L210)

##### Parameters

| Parameter | Type                                                              |
| --------- | ----------------------------------------------------------------- |
| `args`    | [`SimplificationPluginArguments`](#simplificationpluginarguments) |

##### Returns

[`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<`NonConstConjunctionSchemaObjectSimplifyReturnType`>
& `object`

A [ConjunctionSchema](/src/plugin/plugin.ts#L117) that will be merged into the
simplified disjuncts. Return `false` if a contradiction is detected.

The returned [ConjunctionSchema](/src/plugin/plugin.ts#L117) must not contain
the `type` keyword because it will be already defined and will be added to the
result later.

### `SimplificationPluginArguments`

Defined in: [plugin/plugin.ts:131](/src/plugin/plugin.ts#L131)

#### Properties

##### atomicSchemasByConstructor

> **atomicSchemasByConstructor**:
> [`InstancesByConstructor`](/src/utils/instances-by-constructor/instances-by-constructor.ts#L4)

Defined in: [plugin/plugin.ts:146](/src/plugin/plugin.ts#L146)

Use this to retrieve [AtomicSchema](/src/atomic-schema/atomic-schema.ts#L9)s
that are (a not negated) part of the currently processed disjunct.

---

##### negatedAtomicSchemasByConstructor

> **negatedAtomicSchemasByConstructor**:
> [`InstancesByConstructor`](/src/utils/instances-by-constructor/instances-by-constructor.ts#L4)

Defined in: [plugin/plugin.ts:151](/src/plugin/plugin.ts#L151)

Use this to retrieve [AtomicSchema](/src/atomic-schema/atomic-schema.ts#L9)s
that are a negated part of the currently processed disjunct.

---

##### options

> **options**: [`InternalOptions`](/src/options/options.ts#L110)

Defined in: [plugin/plugin.ts:162](/src/plugin/plugin.ts#L162)

---

##### previousSimplificationResultSchema

> **previousSimplificationResultSchema**:
> `Readonly`<[`NonConstConjunctionSchemaObject`](/src/plugin/plugin.ts#L97)>

Defined in: [plugin/plugin.ts:141](/src/plugin/plugin.ts#L141)

The merged result of all previously applied
[SimplificationPlugin](#simplificationplugin)s.

---

##### schemaDescribesEmptySet()

> **schemaDescribesEmptySet**: (`schema`) => `null` | `boolean`

Defined in: [plugin/plugin.ts:155](/src/plugin/plugin.ts#L155)

Use this instead of importing
[schemaDescribesEmptySet](/docs/README.md#schemadescribesemptyset).

###### Parameters

| Parameter | Type                                       |
| --------- | ------------------------------------------ |
| `schema`  | [`JSONSchema`](/docs/README.md#jsonschema) |

###### Returns

`null` | `boolean`

---

##### splitToRawDNF()

> **splitToRawDNF**: (`schema`) =>
> [`RawDNF`](/src/atomic-schema/to-raw-dnf/to-raw-dnf.ts#L16)

Defined in: [plugin/plugin.ts:161](/src/plugin/plugin.ts#L161)

Use this to split subschemas like the ones defined with keywords like `items`.
(Subschemas referenced by "logical" keywords like `anyOf`, `allOf` or `not` are
already taken care of and do not need to be split again.)

###### Parameters

| Parameter | Type                                       |
| --------- | ------------------------------------------ |
| `schema`  | [`JSONSchema`](/docs/README.md#jsonschema) |

###### Returns

[`RawDNF`](/src/atomic-schema/to-raw-dnf/to-raw-dnf.ts#L16)

---

##### type

> **type**: `"string"` | `"number"` | `"boolean"` | `"object"` | `"array"` |
> `"null"`

Defined in: [plugin/plugin.ts:137](/src/plugin/plugin.ts#L137)

The value of the `type` keyword of the currently processed disjunct.

---

##### validateConst

> **validateConst**: `ValidateConst`

Defined in: [plugin/plugin.ts:169](/src/plugin/plugin.ts#L169)

If the disjunct was narrowed down to a single possible value, this function can
be used to create a `{ const: ... }` schema from it or `false` if that value
does not satisfy the original schema. The returned value can then be returned by
[SimplificationPlugin.simplify](#simplify).

## Predefined custom plugins

### `formatPlugin`

> `const` **formatPlugin**:
> [`FormatPlugin`](/src/custom-plugins/format-plugin/format-plugin.ts#L165)

Defined in:
[custom-plugins/format-plugin/format-plugin.ts:175](/src/custom-plugins/format-plugin/format-plugin.ts#L175)
