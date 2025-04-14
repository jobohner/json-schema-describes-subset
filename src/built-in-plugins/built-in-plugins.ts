import type { PartiallyUndefined } from '../utils/type-helpers/index.js'
import { arrayExtraction, arraySimplification } from './array.js'
import { constExtraction, constSimplification } from './const.js'
import { ifThenElseExtraction } from './if-then-else.js'
import { numberExtraction, numberSimplification } from './number/index.js'
import { objectExtraction, objectSimplification } from './object/index.js'
import { oneOfExtraction } from './one-of.js'
import { stringExtraction, stringSimplification } from './string.js'
import { typeExtraction } from './type.js'
import type { ExtractionPlugin, SimplificationPlugin } from '../plugin/index.js'
import { notExtraction } from './not.js'
import { allOfExtraction } from './all-of.js'
import { anyOfExtraction } from './any-of.js'
import { refExtraction, refSimplification } from './ref.js'

export * from './all-of.js'
export * from './any-of.js'
export * from './not.js'
export * from './const.js'
export * from './type.js'
export * from './number/index.js'
export * from './string.js'
export * from './array.js'
export * from './object/index.js'
export * from './ref.js'
export * from './if-then-else.js'
export * from './one-of.js'

export const builtInExtractionPlugins = {
  not: notExtraction,
  allOf: allOfExtraction,
  anyOf: anyOfExtraction,
  type: typeExtraction,
  const: constExtraction,
  number: numberExtraction,
  string: stringExtraction,
  object: objectExtraction,
  array: arrayExtraction,
  ifThenElse: ifThenElseExtraction,
  oneOf: oneOfExtraction,
  ref: refExtraction,
} as const satisfies Record<string, ExtractionPlugin>

/** @useDeclaredType */
export type BuiltInExtractionPluginId = keyof typeof builtInExtractionPlugins

export type BuiltInExtractionPluginOverrides = PartiallyUndefined<
  Record<BuiltInExtractionPluginId, ExtractionPlugin>
>

export function getBuiltInExtractionPlugins(
  overrides: BuiltInExtractionPluginOverrides,
): ExtractionPlugin[] {
  const moreGeneralOverrides: Record<string, ExtractionPlugin | undefined> =
    overrides

  return Object.entries(builtInExtractionPlugins).map(([id, plugin]) => {
    return moreGeneralOverrides[id] ?? plugin
  })
}

export const builtInSimplificationPlugins = {
  const: constSimplification,
  number: numberSimplification,
  string: stringSimplification,
  object: objectSimplification,
  array: arraySimplification,
  ref: refSimplification,
} as const satisfies Record<string, SimplificationPlugin>

export type BuiltInSimplificationPlugins = typeof builtInSimplificationPlugins

/** @useDeclaredType */
export type BuiltInSimplificationPluginId = keyof BuiltInSimplificationPlugins

export type BuiltInSimplificationPlugin =
  BuiltInSimplificationPlugins[BuiltInSimplificationPluginId]

export type BuiltInSimplificationPluginOverrides = PartiallyUndefined<
  Record<BuiltInSimplificationPluginId, SimplificationPlugin>
>

export function getBuiltInSimplificationPlugins<
  Overrides extends BuiltInSimplificationPluginOverrides,
>(
  overrides: Overrides,
): (
  | BuiltInSimplificationPlugin
  | NonNullable<Overrides[BuiltInSimplificationPluginId]>
)[] {
  const moreGeneralOverrides: Record<string, SimplificationPlugin | undefined> =
    overrides

  return Object.entries(builtInSimplificationPlugins).map(([id, plugin]) => {
    return moreGeneralOverrides[id] ?? plugin
  })
}
