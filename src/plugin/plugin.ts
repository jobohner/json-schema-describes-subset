import { Ajv2020 as Ajv } from 'ajv/dist/2020.js'

import type { JSONSchema, JSONSchemaObject } from '../json-schema/index.js'
import type {
  LogicalCombination,
  AtomicSchema, // eslint-disable-line @typescript-eslint/no-unused-vars
} from '../atomic-schema/index.js'
import type { RawDNF } from '../atomic-schema/to-raw-dnf/index.js'
import type {
  toDNF, // eslint-disable-line @typescript-eslint/no-unused-vars
  schemaDescribesEmptySet, // eslint-disable-line @typescript-eslint/no-unused-vars
} from '../dnf/index.js'
import type { InstancesByConstructor } from '../utils/instances-by-constructor/index.js'
import type {
  Options, // eslint-disable-line @typescript-eslint/no-unused-vars
  InternalOptions,
} from '../options/index.js'
import type { JSONSchemaType } from '../json-schema-type/index.js'
import type { Prettify } from '../utils/type-helpers/index.js'
import type {
  builtInExtractionPlugins, // eslint-disable-line @typescript-eslint/no-unused-vars
  builtInSimplificationPlugins, // eslint-disable-line @typescript-eslint/no-unused-vars
  BuiltInExtractionPluginId,
  BuiltInSimplificationPluginId,
} from '../built-in-plugins/index.js'
import type {
  formatPlugin, // eslint-disable-line @typescript-eslint/no-unused-vars
} from '../custom-plugins/index.js'

/**
 * Can be used to modify how schemas are interpreted, for example by regarding
 * additional keywords.
 *
 * There are three kinds of plugins:
 *
 * - {@link ValidationPlugin},
 * - {@link ExtractionPlugin}, and
 * - {@link SimplificationPlugin}.
 *
 * A plugin added to {@link Options.plugins} is an array of one or more of
 * these.
 *
 * Usually a plugin consists of
 *
 * - a {@link ValidationPlugin} that modifies how
 *   data values are validated against a JSON Schema and
 * - one or more {@link ExtractionPlugin | Extraction-} and/or
 *   {@link SimplificationPlugin}s that adjust, how schemas are transformed into
 *   their respective simplified disjunctive normal form.
 *
 * Examples for plugins are the internal
 * {@link "built-in-plugins-collection" | built in plugins}
 * and the predefined custom {@link formatPlugin}.
 */
export type Plugin = (
  | ValidationPlugin
  | ExtractionPlugin
  | SimplificationPlugin
)[]

/**
 * In order to transform a schema into its disjunctive normal form (DNF), at
 * first {@link ExtractionPlugin}s are used to extract
 * {@link LogicalCombination}s of {@link AtomicSchema}s.
 */
export interface ExtractionPlugin {
  /**
   * Use this to extract a {@link LogicalCombination} of {@link AtomicSchema}s
   * from the keywords of the provided schema.
   */
  extract: (args: {
    /**
     * The schema to extract from. This schema is the one that is to be
     * transformed into its DNF.
     */
    schema: JSONSchemaObject
    /**
     * Use this to recursively split "logical" subschemas (like the ones defined
     * by the `not`, `anyOf` or `allOf` keywords (among others)).
     */
    split: (schema: JSONSchema) => LogicalCombination
  }) => LogicalCombination
  /**
   * Instead of adding functionality, an {@link ExtractionPlugin} can also
   * replace one of the {@link builtInExtractionPlugins}, by setting
   * {@link ExtractionPlugin.overrides} to that built in plugin's id.
   */
  overrides?: BuiltInExtractionPluginId | undefined
  /** @hidden */
  simplify?: undefined
}

export type ExtractFunctionArguments = Parameters<
  ExtractionPlugin['extract']
>[0]

export type NonConstConjunctionSchemaObject = {
  type?: JSONSchemaType
  const?: never
  anyOf?: never
  not?: never
  allOf?: JSONSchema[]
  [key: string]: unknown
}

export type AllOfElement<Conjunction extends { allOf?: unknown[] }> =
  Conjunction extends { allOf?: (infer Element)[] } ? Element : never

export type ConjunctionSchemaObject<
  Conjunction extends NonConstConjunctionSchemaObject,
> =
  | {
      const: unknown
    }
  | Conjunction

export type ConjunctionSchema<
  Conjunction extends NonConstConjunctionSchemaObject,
> = boolean | ConjunctionSchemaObject<Conjunction>

export function isConstSchema(value: unknown): value is { const: unknown } {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return 'const' in value
}

export type ValidateConst = (constValue: unknown) => false | { const: unknown }

export interface SimplificationPluginArguments {
  /**
   * The value of the `type` keyword of the currently processed disjunct.
   *
   * @expandType JSONSchemaType
   */
  type: JSONSchemaType
  /**
   * The merged result of all previously applied {@link SimplificationPlugin}s.
   */
  previousSimplificationResultSchema: Readonly<NonConstConjunctionSchemaObject>
  /**
   * Use this to retrieve {@link AtomicSchema}s that are (a not negated) part of
   * the currently processed disjunct.
   */
  atomicSchemasByConstructor: InstancesByConstructor
  /**
   * Use this to retrieve {@link AtomicSchema}s that are a negated part of the
   * currently processed disjunct.
   */
  negatedAtomicSchemasByConstructor: InstancesByConstructor
  /**
   * Use this instead of importing {@link schemaDescribesEmptySet}.
   */
  schemaDescribesEmptySet: (schema: JSONSchema) => boolean | null
  /**
   * Use this to split subschemas like the ones defined with keywords like
   * `items`. (Subschemas referenced by "logical" keywords like `anyOf`, `allOf`
   * or `not` are already taken care of and do not need to be split again.)
   */
  splitToRawDNF: (schema: JSONSchema) => RawDNF
  options: InternalOptions
  /**
   * If the disjunct was narrowed down to a single possible value, this function
   * can be used to create a `{ const: ... }` schema from it or `false` if that
   * value does not satisfy the original schema. The returned value can then be
   * returned by {@link SimplificationPlugin.simplify}.
   */
  validateConst: ValidateConst
}

/**
 * After a schema has been transformed to its DNF, each disjunct is
 * simplified using {@link SimplificationPlugin}s, merging or omitting keywords
 * if possible or to `false` if a contradiction is detected.
 */
export interface SimplificationPlugin<
  AppliesToJSONSchemaType extends JSONSchemaType = JSONSchemaType,
  NonConstConjunctionSchemaObjectSimplifyReturnType extends
    NonConstConjunctionSchemaObject = NonConstConjunctionSchemaObject,
  MergeableKeyword extends
    keyof NonConstConjunctionSchemaObjectSimplifyReturnType = keyof NonConstConjunctionSchemaObjectSimplifyReturnType,
> {
  /**
   * Only the disjuncts with a `type` that is also specified here, are
   * simplified using this plugin.
   *
   * If this is not set, or set to `undefined` the plugin is applied to any
   * disjunct regardless of their type.
   */
  appliesToJSONSchemaType?:
    | AppliesToJSONSchemaType
    | AppliesToJSONSchemaType[]
    | undefined
  /**
   * For some keywords, multiple values can be merged into one. (For example
   * multiple `minimum` values can be merged). The result of {@link toDNF} will
   * contain these keywords (if present) as direct properties as opposed to
   * other keywords which cannot be merged and end up as elements of the
   * simplified disjunct's `allOf` array.
   */
  mergeableKeywords: MergeableKeyword[]
  /**
   * @returns A {@link ConjunctionSchema} that will be merged into the
   * simplified disjuncts. Return `false` if a contradiction is detected.
   *
   * The returned {@link ConjunctionSchema} must not contain the `type` keyword
   * because it will be already defined and will be added to the result later.
   */
  simplify: (
    args: SimplificationPluginArguments,
  ) => ConjunctionSchema<NonConstConjunctionSchemaObjectSimplifyReturnType> & {
    type?: never
  }
  /**
   * Instead of adding functionality, a {@link SimplificationPlugin} can also
   * replace one of the {@link builtInSimplificationPlugins}, by setting
   * {@link SimplificationPlugin.overrides} to that built in plugin's id.
   */
  overrides?: BuiltInSimplificationPluginId | undefined
  /** @hidden */
  extract?: undefined
}

export type SimplificationPluginType<
  SimplificationPlugin_ extends SimplificationPlugin,
> =
  SimplificationPlugin_ extends SimplificationPlugin<
    infer AppliesToJSONSchemaType
  >
    ? AppliesToJSONSchemaType
    : JSONSchemaType

export type NonConstConjunctionSchemaObjectSimplifyReturnType<
  SimplificationPlugin_ extends SimplificationPlugin,
> = Extract<
  ReturnType<SimplificationPlugin_['simplify']>,
  NonConstConjunctionSchemaObject
>

/**
 * Without `type`, which is technically also a mergeable keyword, but is added
 * separately
 */
export type SimplificationPluginMergeableKeyword<
  SimplificationPlugin_ extends SimplificationPlugin,
> = Exclude<
  // ObjectUnionKey<
  //   NonConstConjunctionSchemaObjectSimplifyReturnType<SimplificationPlugin_>
  // >,
  SimplificationPlugin_['mergeableKeywords'][number],
  'const' | 'anyOf' | 'not' | 'allOf' | 'type'
> &
  string

export type SimplificationPluginWithMergeableKeyword<
  Plugin extends SimplificationPlugin,
  Keyword extends string,
> = Plugin extends SimplificationPlugin
  ? Keyword extends Plugin['mergeableKeywords'][number]
    ? Plugin
    : never
  : never

export type SimplificationPluginWithType<
  Plugin extends SimplificationPlugin,
  Type extends JSONSchemaType,
> = Plugin extends SimplificationPlugin
  ? Type extends SimplificationPluginType<Plugin>
    ? Plugin
    : never
  : never

export type SimplificationResultNonConstConjunctionSchemaObjectForType<
  Plugin extends SimplificationPlugin,
  Type extends JSONSchemaType,
> = { type: Type } & {
  [Key in SimplificationPluginMergeableKeyword<
    SimplificationPluginWithType<Plugin, Type>
  >]?: NonConstConjunctionSchemaObjectSimplifyReturnType<
    SimplificationPluginWithMergeableKeyword<
      SimplificationPluginWithType<Plugin, Type>,
      Key
    >
  >[Key]
} & {
  allOf?: AllOfElement<
    NonConstConjunctionSchemaObjectSimplifyReturnType<
      SimplificationPluginWithType<Plugin, Type>
    >
  >[]
  const?: never
  anyOf?: never
  not?: never
}

export type SimplificationResultSchemaForType<
  SimplificationPlugin_ extends SimplificationPlugin,
  Type extends JSONSchemaType,
> = Prettify<
  ConjunctionSchema<
    SimplificationResultNonConstConjunctionSchemaObjectForType<
      SimplificationPlugin_,
      Type
    >
  >
>

export type SimplificationResultSchemaByType<
  SimplificationPlugin_ extends SimplificationPlugin,
  Type extends JSONSchemaType = JSONSchemaType,
> = Type extends unknown
  ? SimplificationResultSchemaForType<SimplificationPlugin_, Type>
  : never

/**
 * Customizes the internally used
 * {@link https://ajv.js.org/json-schema.html#draft-2020-12 | Ajv (draft 2020-12)}
 * instance in order to support e. g. the `format` keyword or non-standard
 * keywords.
 *
 * Ajv is used internally e. g. to check whether a `const` property satisfies a
 * schema or if a property name satisfies `propertyNames`.
 *
 * A custom plugin which is added to {@link Options.plugins} would usually
 * contain a {@link ValidationPlugin}, because the purpose of these custom
 * plugins is to interpret a schema in a different way than it would be
 * interpreted by default.
 *
 * As opposed to {@link ExtractionPlugin}s and {@link SimplificationPlugin}s,
 * which are used internally as built in plugins, there are no internal built in
 * {@link ValidationPlugin}s. This is because the default behavior is supported
 * out of the box.
 */
export interface ValidationPlugin {
  /**
   * Can be used to modify `ajv`, for example by using `ajv.addKeyword(...)`.
   */
  modifyAjv: (ajv: Ajv) => void
  /** @hidden */
  simplify?: undefined
  /** @hidden */
  extract?: undefined
  /** @hidden */
  appliesToJSONSchemaType?: undefined
}

export function pluginIsExtractionPlugin<Plugin_ extends Plugin[number]>(
  plugin: Plugin_,
): plugin is Extract<Plugin_, ExtractionPlugin> {
  return 'extract' in plugin
}

export function pluginIsSimplificationPlugin<Plugin_ extends Plugin[number]>(
  plugin: Plugin_,
): plugin is Extract<Plugin_, SimplificationPlugin> {
  return 'simplify' in plugin
}

export function pluginIsValidationPlugin<Plugin_ extends Plugin[number]>(
  plugin: Plugin_,
): plugin is Extract<Plugin_, ValidationPlugin> {
  return 'modifyAjv' in plugin
}
