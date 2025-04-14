import isArray from 'lodash/isArray.js'

import { isJSONSchema, type JSONSchema } from '../json-schema/index.js'
import {
  AllOfSchema,
  AnyOfSchema,
  AtomicSchemaObject,
  NotSchema,
  type LogicalCombination,
  type LogicalCombinationOfLiterals,
} from '../atomic-schema/index.js'
import type {
  SimplificationPlugin,
  ExtractionPlugin,
  ConjunctionSchema,
} from '../plugin/index.js'
import {
  negateIntegerMaximum,
  negateIntegerMinimum,
} from '../utils/negate-integer-min-max/index.js'
import { TypeAtomicSchema } from './type.js'
import { schemaDescribesSubsetFactory } from '../schema-describes-subset/schema-describes-subset-factory.js'
import { createSameElementsArray } from '../utils/array/index.js'
import { isArrayOf, isNotNull } from '../utils/type-guards/index.js'
import { UnsupportedKeywordError } from '../unsupported-keyword-error/index.js'
import { getUniqueNegatedConstSchemasFromNegatedAtomicSchemasByConstructor } from './negated-const-helpers.js'

export function createTrueArray(length: number): true[] {
  return createSameElementsArray(length, true)
}

export class MinItemsAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly minItems: number) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new MaxItemsAtomicSchema(negateIntegerMinimum(this.minItems)),
      new TypeAtomicSchema('array'),
    ])
  }

  toJSONSchema(): { minItems: number } {
    return { minItems: this.minItems }
  }
}

export class MaxItemsAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly maxItems: number) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new MinItemsAtomicSchema(negateIntegerMaximum(this.maxItems)),
      new TypeAtomicSchema('array'),
    ])
  }

  toJSONSchema(): { maxItems: number } {
    return { maxItems: this.maxItems }
  }
}

export class ItemsAtomicSchema extends AtomicSchemaObject {
  constructor(
    public readonly startIndex: number,
    public readonly items: JSONSchema,
  ) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new NotSchema(this),
      /* actually redundant, but makes checking for contradictions easier */
      new TypeAtomicSchema('array'),
    ])
  }

  toJSONSchema(): {
    prefixItems?: true[]
    items: JSONSchema
  } {
    if (this.startIndex === 0) {
      return { items: this.items }
    }

    return {
      prefixItems: createTrueArray(this.startIndex),
      items: this.items,
    }
  }
}

export class PrefixItemAtomicSchema extends AtomicSchemaObject {
  constructor(
    public readonly index: number,
    public readonly prefixItem: JSONSchema,
  ) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new TypeAtomicSchema('array'),
      new MinItemsAtomicSchema(this.index + 1),
      new PrefixItemAtomicSchema(this.index, { not: this.prefixItem }),
    ])
  }

  toJSONSchema(): {
    prefixItems: [...true[], JSONSchema]
  } {
    return {
      prefixItems: [...createTrueArray(this.index), this.prefixItem],
    }
  }
}

export class ContainsAtomicSchema extends AtomicSchemaObject {
  public readonly minContains: number
  public readonly maxContains: number

  constructor(
    public readonly contains: JSONSchema,
    minContains: number,
    maxContains: number,
  ) {
    super()
    this.minContains = Math.ceil(minContains)
    this.maxContains = Math.floor(maxContains)
  }

  negate(): LogicalCombinationOfLiterals {
    if (this.minContains > this.maxContains) {
      return true
    }

    if (this.minContains <= 0 && this.maxContains === Infinity) {
      return false
    }

    const anyOf: (ContainsAtomicSchema | false)[] = [
      this.maxContains < Infinity &&
        new ContainsAtomicSchema(this.contains, this.maxContains + 1, Infinity),
      this.minContains > 0 &&
        new ContainsAtomicSchema(this.contains, 0, this.minContains - 1),
    ].filter((schema) => schema !== false)

    return new AllOfSchema([
      new TypeAtomicSchema('array'),
      ...(anyOf.length > 1 ? [new AnyOfSchema(anyOf)] : anyOf),
    ])
  }

  toJSONSchema(): {
    contains: JSONSchema
    minContains: number
    maxContains?: number
  } {
    return {
      contains: this.contains,
      minContains: this.minContains,
      ...(this.maxContains < Infinity ? { maxContains: this.maxContains } : {}),
    }
  }
}

export class UniqueItemsAtomicSchema extends AtomicSchemaObject {
  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new NotSchema(this),
      /* actually redundant, but makes checking for contradictions easier */
      new TypeAtomicSchema('array'),
    ])
  }

  toJSONSchema(): { uniqueItems: true } {
    return { uniqueItems: true }
  }
}

export class UnevaluatedItemsAtomicSchema extends AtomicSchemaObject {
  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new NotSchema(this),
      /* actually redundant, but makes checking for contradictions easier */
      new TypeAtomicSchema('array'),
    ])
  }

  toJSONSchema(): JSONSchema {
    throw new Error('unimplemented')
  }
}

export const arrayExtraction: ExtractionPlugin = {
  extract: ({
    schema: {
      minItems,
      maxItems,
      items,
      prefixItems,
      contains,
      minContains,
      maxContains,
      uniqueItems,
      unevaluatedItems,
    },
  }) => {
    const allOf: LogicalCombination[] = []

    if (typeof minItems === 'number') {
      allOf.push(new MinItemsAtomicSchema(minItems))
    }

    if (typeof maxItems === 'number') {
      allOf.push(new MaxItemsAtomicSchema(maxItems))
    }

    const prefixItemsIsArray = isArrayOf(isJSONSchema)(prefixItems)

    if (isJSONSchema(items)) {
      allOf.push(
        new ItemsAtomicSchema(
          prefixItemsIsArray ? prefixItems.length : 0,
          items,
        ),
      )
    }

    if (prefixItemsIsArray) {
      allOf.push(
        ...prefixItems.map(
          (prefixItem, index) => new PrefixItemAtomicSchema(index, prefixItem),
        ),
      )
    }

    if (isJSONSchema(contains)) {
      allOf.push(
        new ContainsAtomicSchema(
          contains,
          typeof minContains === 'number' ? minContains : 1,
          typeof maxContains === 'number' ? maxContains : Infinity,
        ),
      )
    }

    if (uniqueItems === true) {
      allOf.push(new UniqueItemsAtomicSchema())
    }

    if (unevaluatedItems !== undefined) {
      allOf.push(new UnevaluatedItemsAtomicSchema())
    }

    return allOf.length === 0 || new AllOfSchema(allOf)
  },
}

export function mergeItemsSchemas(
  prefixItems: PrefixItemAtomicSchema[],
  itemsArray: ItemsAtomicSchema[],
): JSONSchema[][] {
  const mergedItems: JSONSchema[][] = []

  for (const { index, prefixItem } of prefixItems) {
    const allOf = mergedItems[index]
    if (allOf !== undefined) {
      allOf.push(prefixItem)
    } else {
      while (mergedItems.length < index) {
        mergedItems.push([])
      }
      mergedItems.push([prefixItem])
    }
  }

  for (const { startIndex, items } of itemsArray) {
    for (const allOf of mergedItems.slice(startIndex)) {
      allOf.push(items)
    }
  }

  return mergedItems
}

export type ArrayConjunctionSchema = {
  minItems?: number
  maxItems?: number
  items?: JSONSchema
  prefixItems?: JSONSchema[]
  uniqueItems?: boolean
  allOf?: (
    | { not: { const: unknown[] } }
    | {
        contains: JSONSchema
        minContains?: number
        maxContains?: number
      }
    // | { unevaluatedItems: JSONSchema } // TODO: unevaluatedItems
    | {
        not: { uniqueItems?: boolean }
      }
    | {
        not: {
          prefixItems?: true[]
          items?: JSONSchema
        }
      }
  )[]
}

export const arraySimplification = {
  appliesToJSONSchemaType: 'array',
  mergeableKeywords: [
    'items',
    'prefixItems',
    'minItems',
    'maxItems',
    'uniqueItems',
  ],
  simplify({
    atomicSchemasByConstructor,
    negatedAtomicSchemasByConstructor,
    schemaDescribesEmptySet,
    validateConst,
  }): ConjunctionSchema<ArrayConjunctionSchema> {
    let minItems = Math.ceil(
      Math.max(
        0,
        ...atomicSchemasByConstructor
          .get(MinItemsAtomicSchema)
          .map(({ minItems }) => minItems),
      ),
    )

    const maxItems = Math.floor(
      Math.min(
        ...atomicSchemasByConstructor
          .get(MaxItemsAtomicSchema)
          .map(({ maxItems }) => maxItems),
      ),
    )

    if (minItems > maxItems) {
      return false
    }

    if (maxItems <= 0) {
      return validateConst([])
    }

    const uniqueItems = atomicSchemasByConstructor.has(UniqueItemsAtomicSchema)
    const negatedUniqueItems = negatedAtomicSchemasByConstructor.has(
      UniqueItemsAtomicSchema,
    )

    if (uniqueItems && negatedUniqueItems) {
      return false
    }

    const itemsAtomicSchemas = atomicSchemasByConstructor.get(ItemsAtomicSchema)

    const mergedItems = mergeItemsSchemas(
      atomicSchemasByConstructor.get(PrefixItemAtomicSchema),
      itemsAtomicSchemas,
    )

    const nonPrefixItems = itemsAtomicSchemas.map(({ items }) => items)

    if (minItems > mergedItems.length && nonPrefixItems.length > 0) {
      if (schemaDescribesEmptySet({ allOf: nonPrefixItems })) {
        return false
      }
    }

    for (const allOf of mergedItems.slice(0, minItems)) {
      if (schemaDescribesEmptySet({ allOf })) {
        return false
      }
    }

    type Contains = {
      contains: JSONSchema
      minContains: number
      maxContains: number
      /** `minContains` starting from this index */
      startIndex: number
    }

    /** Includes `contains` and negated `items` */
    const allContains: Contains[] = [
      ...atomicSchemasByConstructor
        .get(ContainsAtomicSchema)
        .map(({ contains, minContains, maxContains }) => ({
          contains,
          minContains,
          maxContains,
          startIndex: 0,
        })),
      ...negatedAtomicSchemasByConstructor
        .get(ItemsAtomicSchema)
        .map(({ items, startIndex }) => ({
          contains: { not: items },
          minContains: 1,
          maxContains: Infinity,
          startIndex,
        })),
    ]

    minItems = Math.max(
      minItems,
      ...allContains.map(
        ({ minContains, startIndex }) => startIndex + minContains,
      ),
    )

    if (minItems > maxItems) {
      return false
    }

    if (
      allContains.some(
        ({ minContains, maxContains }) => minContains > maxContains,
      )
    ) {
      return false
    }

    const schemaDescribesSubset = schemaDescribesSubsetFactory(
      schemaDescribesEmptySet,
    )

    /* compare `allContains` against each other */
    for (const containsA of allContains) {
      for (const containsB of allContains) {
        if (containsA === containsB) {
          continue
        }

        if (schemaDescribesSubset(containsA.contains, containsB.contains)) {
          /* every value that satisfies A, also satisfies B => minContains /
           * maxContains for B must also apply to A */
          containsA.minContains = Math.max(
            containsA.minContains,
            containsB.minContains,
          )
          containsA.maxContains = Math.min(
            containsA.maxContains,
            containsB.maxContains,
          )
          if (containsA.minContains > containsA.maxContains) {
            return false
          }
        }
      }
    }

    /**
     * Result for these might have changed with `minContainsLoop`, since
     * nonPrefixItems or mergedItems might have changed => check again
     */
    const checkMinContains: Contains[] = allContains.filter(
      ({ minContains }) => minContains > 0,
    )

    while (checkMinContains.length > 0) {
      const checkMinContainsAgain: Contains[] = []

      /* check `minContains` contradictions */
      minContainsLoop: for (const containsObject of checkMinContains) {
        const { contains, minContains, startIndex } = containsObject

        /* check against (non prefix) items, no need to compare with
         * `startIndex`, since startIndex is always >= mergedItems.length */

        const possibleNonPrefixItemsCount = ((): number => {
          const possibleNonPrefixItemsCount = maxItems - mergedItems.length

          if (
            possibleNonPrefixItemsCount <= 0 ||
            schemaDescribesEmptySet({
              allOf: [contains, ...nonPrefixItems],
            })
          ) {
            return 0
          }

          return possibleNonPrefixItemsCount
        })()

        if (possibleNonPrefixItemsCount > minContains) {
          /* all necessary contains fit within non prefix items and since
           * there are more `possibleNonPrefixItemsCount` than `minContains`,
           * we cannot conclude that any non prefix item must also satisfy
           * `contains` */
          checkMinContainsAgain.push(containsObject)
          continue
        }

        /* check against prefixItems */

        const possiblePrefixItems: JSONSchema[][] = []

        for (const prefixItemsAllOf of mergedItems.slice(startIndex)) {
          if (
            !schemaDescribesEmptySet({ allOf: [contains, ...prefixItemsAllOf] })
          ) {
            possiblePrefixItems.push(prefixItemsAllOf)
            if (
              possibleNonPrefixItemsCount + possiblePrefixItems.length >
              minContains
            ) {
              checkMinContainsAgain.push(containsObject)
              continue minContainsLoop
            }
          }
        }

        if (
          possibleNonPrefixItemsCount + possiblePrefixItems.length <
          minContains
        ) {
          /* cannot contain enough `contains` */
          return false
        }

        /*
         * `possibleNonPrefixItemsCount + possiblePrefixItems.length ===
         * minContains`, since `<` and `>` are checked above
         * can contain exactly the minimum necessary amount of `contains`, all
         * schemas at the relevant indexes must always also satisfy `contains`
         */

        /*
         * Checking every possible combination is too computationally intensive,
         * so this might result in false negatives.
         */
        possiblePrefixItems.every((allOf) => allOf.push(contains))
        if (possibleNonPrefixItemsCount > 0) {
          nonPrefixItems.push(contains)
          minItems = Math.max(
            minItems,
            mergedItems.length + possibleNonPrefixItemsCount,
          )
        }
      }

      if (checkMinContainsAgain.length === checkMinContains.length) {
        break
      }

      checkMinContains.length = 0
      checkMinContains.push(...checkMinContainsAgain)
    }

    /* check maxContains against mergedItems and itemsAtomcSchemas */
    for (const { contains, maxContains } of allContains) {
      if (maxContains === Infinity) {
        continue
      }

      let matchingItemsCount = 0
      const matchingNonPrefixItemsCount = minItems - mergedItems.length
      if (
        matchingNonPrefixItemsCount > 0 &&
        schemaDescribesSubset({ allOf: nonPrefixItems }, contains)
      ) {
        matchingItemsCount += matchingNonPrefixItemsCount
      }

      if (matchingItemsCount > maxContains) {
        return false
      }

      for (const allOf of mergedItems.slice(0, minItems)) {
        if (schemaDescribesSubset({ allOf }, contains)) {
          matchingItemsCount++
          if (matchingItemsCount > maxContains) {
            return false
          }
        }
      }
    }

    if (negatedUniqueItems) {
      /* if maxItems > mergedItems.length + 1, there are multiple elements that
       * only need to satisfy `items` and therefore might overlap => not
       * necessarily a contradiction */
      if (maxItems <= mergedItems.length + 1) {
        const requiredItems = mergedItems.slice(0, maxItems)
        if (maxItems > mergedItems.length) {
          requiredItems.push(
            nonPrefixItems.length > 0 ? nonPrefixItems : [true],
          )
        }

        const previouslyCheckedItems: JSONSchema[][] = []
        if (
          requiredItems.every((itemSchemas) => {
            if (
              previouslyCheckedItems.every((previouslyCheckedItemSchemas) => {
                return schemaDescribesEmptySet({
                  allOf: [...previouslyCheckedItemSchemas, ...itemSchemas],
                })
              })
            ) {
              previouslyCheckedItems.push(itemSchemas)
              return true
            }

            return false
          })
        ) {
          /* no overlap between items => items are always unique */
          return false
        }
      }
    }

    const prefixItems: JSONSchema[] = mergedItems
      .map<JSONSchema | null>((allOf) => {
        const [first, ...rest] = allOf
        if (first === undefined) {
          return null
        }

        if (rest.length === 0) {
          return first
        }

        return { allOf }
      })
      .filter(isNotNull)

    const unevaluatedItemsAtomicSchema =
      atomicSchemasByConstructor.get(UnevaluatedItemsAtomicSchema)[0] ??
      negatedAtomicSchemasByConstructor.get(UnevaluatedItemsAtomicSchema)[0]

    if (unevaluatedItemsAtomicSchema !== undefined) {
      throw new UnsupportedKeywordError('unevaluatedItems')
    }

    return {
      ...(minItems > 0 ? { minItems } : {}),
      ...(maxItems < Infinity ? { maxItems } : {}),
      ...(uniqueItems ? { uniqueItems } : {}),
      ...(prefixItems.length > 0 ? { prefixItems } : {}),
      ...(nonPrefixItems.length > 0
        ? { items: { allOf: nonPrefixItems } }
        : {}),
      allOf: [
        ...(negatedUniqueItems ? [{ not: { uniqueItems: true } }] : []),
        ...atomicSchemasByConstructor
          .get(ContainsAtomicSchema)
          .map(({ contains, minContains, maxContains }) => ({
            contains,
            ...(minContains > 0 ? { minContains } : {}),
            ...(maxContains < Infinity ? { maxContains } : {}),
          })),
        ...negatedAtomicSchemasByConstructor
          .get(ItemsAtomicSchema)
          .map(({ items, startIndex }) => ({
            not: {
              items,
              ...(startIndex > 0
                ? {
                    prefixItems: createTrueArray(startIndex),
                  }
                : {}),
            },
          })),
        ...getUniqueNegatedConstSchemasFromNegatedAtomicSchemasByConstructor(
          schemaDescribesEmptySet,
          negatedAtomicSchemasByConstructor,
          isArray,
        ),
      ],
    }
  },
} as const satisfies SimplificationPlugin
