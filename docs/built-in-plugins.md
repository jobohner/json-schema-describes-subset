# Built in plugins

All internally used built in
[ExtractionPlugin](/docs/customization.md#extractionplugin)s and
[SimplificationPlugin](/docs/customization.md#simplificationplugin)s. They work
just like the custom plugins which are added to
[Options.plugins](/docs/README.md#plugins), but are used internally to create
the default behavior,

There are no internally used built in
[ValidationPlugin](/docs/customization.md#validationplugin)s, because without
any custom plugins, default validation is desired.

## Built in `ExtractionPlugin`s

### `allOfExtraction`

> `const` **allOfExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in: [built-in-plugins/all-of.ts:6](/src/built-in-plugins/all-of.ts#L6)

### `anyOfExtraction`

> `const` **anyOfExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in: [built-in-plugins/any-of.ts:6](/src/built-in-plugins/any-of.ts#L6)

### `arrayExtraction`

> `const` **arrayExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in: [built-in-plugins/array.ts:199](/src/built-in-plugins/array.ts#L199)

### `constExtraction`

> `const` **constExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in: [built-in-plugins/const.ts:30](/src/built-in-plugins/const.ts#L30)

### `ifThenElseExtraction`

> `const` **ifThenElseExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in:
[built-in-plugins/if-then-else.ts:38](/src/built-in-plugins/if-then-else.ts#L38)

### `notExtraction`

> `const` **notExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in: [built-in-plugins/not.ts:5](/src/built-in-plugins/not.ts#L5)

### `numberExtraction`

> `const` **numberExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in:
[built-in-plugins/number/number.ts:64](/src/built-in-plugins/number/number.ts#L64)

### `objectExtraction`

> `const` **objectExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in:
[built-in-plugins/object/object.ts:216](/src/built-in-plugins/object/object.ts#L216)

### `oneOfExtraction`

> `const` **oneOfExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in: [built-in-plugins/one-of.ts:11](/src/built-in-plugins/one-of.ts#L11)

### `refExtraction`

> `const` **refExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in: [built-in-plugins/ref.ts:43](/src/built-in-plugins/ref.ts#L43)

### `stringExtraction`

> `const` **stringExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in: [built-in-plugins/string.ts:75](/src/built-in-plugins/string.ts#L75)

### `typeExtraction`

> `const` **typeExtraction**:
> [`ExtractionPlugin`](/docs/customization.md#extractionplugin)

Defined in: [built-in-plugins/type.ts:101](/src/built-in-plugins/type.ts#L101)

## Built in `SimplificationPlugin`s

### `arraySimplification`

> `const` **arraySimplification**: `object`

Defined in: [built-in-plugins/array.ts:317](/src/built-in-plugins/array.ts#L317)

#### Type declaration

##### appliesToJSONSchemaType

> `readonly` **appliesToJSONSchemaType**: `"array"` = `'array'`

##### mergeableKeywords

> `readonly` **mergeableKeywords**: \[`"items"`, `"prefixItems"`, `"minItems"`,
> `"maxItems"`, `"uniqueItems"`]

##### simplify()

> `readonly` **simplify**(`__namedParameters`):
> [`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<[`ArrayConjunctionSchema`](/src/built-in-plugins/array.ts#L291)>

###### Parameters

| Parameter           | Type                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| `__namedParameters` | [`SimplificationPluginArguments`](/docs/customization.md#simplificationpluginarguments) |

###### Returns

[`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<[`ArrayConjunctionSchema`](/src/built-in-plugins/array.ts#L291)>

### `constSimplification`

> `const` **constSimplification**: `object`

Defined in: [built-in-plugins/const.ts:53](/src/built-in-plugins/const.ts#L53)

#### Type declaration

##### appliesToJSONSchemaType

> `readonly` **appliesToJSONSchemaType**: `undefined` = `undefined`

##### mergeableKeywords

> `readonly` **mergeableKeywords**: \[] = `[]`

##### simplify()

> `readonly` **simplify**(`__namedParameters`):
> [`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<{ `allOf`: `never`\[]; }>

###### Parameters

| Parameter           | Type                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| `__namedParameters` | [`SimplificationPluginArguments`](/docs/customization.md#simplificationpluginarguments) |

###### Returns

[`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<{ `allOf`: `never`\[]; }>

### `numberSimplification`

> `const` **numberSimplification**: `object`

Defined in:
[built-in-plugins/number/number.ts:118](/src/built-in-plugins/number/number.ts#L118)

#### Type declaration

##### appliesToJSONSchemaType

> `readonly` **appliesToJSONSchemaType**: `"number"` = `'number'`

##### mergeableKeywords

> `readonly` **mergeableKeywords**: \[`"minimum"`, `"maximum"`, `"multipleOf"`]

##### simplify()

> `readonly` **simplify**(`__namedParameters`):
> [`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<[`NumberConjunctionSchema`](/src/built-in-plugins/number/number.ts#L111)>

###### Parameters

| Parameter           | Type                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| `__namedParameters` | [`SimplificationPluginArguments`](/docs/customization.md#simplificationpluginarguments) |

###### Returns

[`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<[`NumberConjunctionSchema`](/src/built-in-plugins/number/number.ts#L111)>

### `objectSimplification`

> `const` **objectSimplification**: `object`

Defined in:
[built-in-plugins/object/object.ts:410](/src/built-in-plugins/object/object.ts#L410)

#### Type declaration

##### appliesToJSONSchemaType

> `readonly` **appliesToJSONSchemaType**: `"object"` = `'object'`

##### mergeableKeywords

> `readonly` **mergeableKeywords**: \[`"properties"`, `"patternProperties"`,
> `"required"`, `"propertyNames"`, `"minProperties"`, `"maxProperties"`]

##### simplify()

> `readonly` **simplify**(`__namedParameters`):
> [`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<[`ObjectConjunctionSchema`](/src/built-in-plugins/object/object.ts#L392)>

###### Parameters

| Parameter           | Type                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| `__namedParameters` | [`SimplificationPluginArguments`](/docs/customization.md#simplificationpluginarguments) |

###### Returns

[`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<[`ObjectConjunctionSchema`](/src/built-in-plugins/object/object.ts#L392)>

### `refSimplification`

> `const` **refSimplification**: `object`

Defined in: [built-in-plugins/ref.ts:84](/src/built-in-plugins/ref.ts#L84)

#### Type declaration

##### appliesToJSONSchemaType

> `readonly` **appliesToJSONSchemaType**: `undefined` = `undefined`

##### mergeableKeywords

> `readonly` **mergeableKeywords**: \[] = `[]`

##### simplify()

> `readonly` **simplify**(`__namedParameters`):
> [`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<[`RefConjunctionSchema`](/src/built-in-plugins/ref.ts#L80)>

###### Parameters

| Parameter           | Type                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| `__namedParameters` | [`SimplificationPluginArguments`](/docs/customization.md#simplificationpluginarguments) |

###### Returns

[`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<[`RefConjunctionSchema`](/src/built-in-plugins/ref.ts#L80)>

### `stringSimplification`

> `const` **stringSimplification**: `object`

Defined in:
[built-in-plugins/string.ts:109](/src/built-in-plugins/string.ts#L109)

#### Type declaration

##### appliesToJSONSchemaType

> `readonly` **appliesToJSONSchemaType**: `"string"` = `'string'`

##### mergeableKeywords

> `readonly` **mergeableKeywords**: \[`"minLength"`, `"maxLength"`]

##### simplify()

> `readonly` **simplify**(`__namedParameters`):
> [`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<[`StringConjunctionSchema`](/src/built-in-plugins/string.ts#L99)>

###### Parameters

| Parameter           | Type                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| `__namedParameters` | [`SimplificationPluginArguments`](/docs/customization.md#simplificationpluginarguments) |

###### Returns

[`ConjunctionSchema`](/src/plugin/plugin.ts#L117)<[`StringConjunctionSchema`](/src/built-in-plugins/string.ts#L99)>
