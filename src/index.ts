/**
 * This package provides tools for static JSON schema analysis.
 *
 * One of these is its eponymous function {@link schemaDescribesSubset} which
 * tries to determine whether all data values that satisfy one JSON schema also
 * satisfy another one (which would mean that the first schema described a
 * subset of the set of data values that satisfy the second schema).
 *
 * Other functions that might be useful include
 * - {@link schemaDescribesEmptySet}, which tries to determine whether a schema
 *   does not accept any values at all
 * - {@link toDNF}, which transforms a schema to a
 *   [*disjunctive normal form*](https://en.wikipedia.org/wiki/Disjunctive_normal_form)
 * - {@link schemasAreEquivalent}, which tries to determine whether two schemas
 *   both accept the exact same data values.
 * - {@link schemaDescribesUniverse}, which tries to determine whether a schema
 *   will accept any arbitrary JSON value.
 *
 * All of these functions work out of the box with
 * {@link JSONSchema | standard JSON Schema}, but can also regard
 * {@link Plugin | custom keywords using plugins}.
 *
 * @packageDocumentation
 */

export { type JSONSchema, type JSONSchemaObject } from './json-schema/index.js'

export {
  schemaDescribesSubset,
  type SchemaDescribesSubset,
} from './schema-describes-subset/index.js'

export {
  schemaDescribesEmptySet,
  toDNF,
  type SchemaDescribesEmptySet,
  type DNF,
  type GeneralDNF,
  type GeneralDNFSpelledOut,
  type DefaultDNF,
  type DefaultDNFSpelledOut,
  type Disjunct,
} from './dnf/index.js'

export {
  schemasAreEquivalent,
  schemaDescribesUniverse,
} from './derived/index.js'

export { type Options, type InternalOptions } from './options/index.js'

export type {
  Plugin,
  ExtractionPlugin,
  ExtractFunctionArguments,
  SimplificationPlugin,
  SimplificationPluginArguments,
  ValidationPlugin,
  ConjunctionSchema,
  NonConstConjunctionSchemaObject,
} from './plugin/index.js'

export {
  AtomicSchemaObject as NonBooleanAtomicSchema,
  NotSchema,
  AllOfSchema,
  AnyOfSchema,
  type LogicalCombinationOfLiterals,
  type AtomicSchema,
  type LogicLiteral,
  type LogicalCombination,
  isAtomicSchema,
  isLogicLiteral,
  negateAtomicSchema,
  toJSONSchema,
  type RawDNF,
} from './atomic-schema/index.js'

export {
  allJSONSchemaTypes,
  type AllJSONSchemaTypes,
  type JSONSchemaType,
  filterJSONSchemaTypes,
  getOtherJSONSchemaTypes,
  isJSONSchemaType,
} from './json-schema-type/index.js'

export {
  AdditionalPropertiesAtomicSchema,
  ConstAtomicSchema,
  ContainsAtomicSchema,
  ItemsAtomicSchema,
  MaximumAtomicSchema,
  MaxItemsAtomicSchema,
  MaxLengthAtomicSchema,
  MaxPropertiesAtomicSchema,
  MinimumAtomicSchema,
  MinItemsAtomicSchema,
  MinLengthAtomicSchema,
  MinPropertiesAtomicSchema,
  MultipleOfAtomicSchema,
  PatternAtomicSchema,
  PatternPropertyAtomicSchema,
  PrefixItemAtomicSchema,
  PropertyAtomicSchema,
  PropertyNamesAtomicSchema,
  RefAtomicSchema,
  RequiredAtomicSchema,
  TypeAtomicSchema,
  UnevaluatedItemsAtomicSchema,
  UnevaluatedPropertiesAtomicSchema,
  UniqueItemsAtomicSchema,
  type AdditionalPropertiesAtomicSchemaJSON,
  type ArrayConjunctionSchema,
  type BuiltInExtractionPluginId,
  type BuiltInSimplificationPluginId,
  type BuiltInSimplificationPlugin,
  type NumberConjunctionSchema,
  type ObjectConjunctionSchema,
  type PatternPropertiesAtomicSchemaJSON,
  type RefAtomicSchemaJSON,
  type RefConjunctionSchema,
  type RefConjunctionSchemaAllOf,
  type RefConjunctionSchemaAllOfElement,
  type StringConjunctionSchema,
  getTypeArray,
  typeArrayToLogicalCombination,
  builtInExtractionPlugins,
  builtInSimplificationPlugins,
} from './built-in-plugins/index.js'

export * from './built-in-plugins-collection.js'

export { InstancesByConstructor } from './utils/instances-by-constructor/index.js'
