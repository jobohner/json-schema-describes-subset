import isNumber from 'lodash/isNumber.js'
import { describe, it, expect, expectTypeOf } from 'vitest'

import {
  getNegatedConstValuesFromNegatedAtomicSchemasByConstructor,
  getUniqueNegatedConstSchemas,
  getUniqueNegatedConstSchemasFromNegatedAtomicSchemasByConstructor,
} from './negated-const-helpers.js'

import { schemaDescribesEmptySet } from '../dnf/index.js'
import { InstancesByConstructor } from '../utils/instances-by-constructor/index.js'
import { ConstAtomicSchema } from './const.js'

describe(getNegatedConstValuesFromNegatedAtomicSchemasByConstructor, () => {
  it('returns the expected result', () => {
    const instancesByConstructor = new InstancesByConstructor([
      new ConstAtomicSchema(1),
      new TypeError(),
      new ConstAtomicSchema(2),
      new ConstAtomicSchema(3),
      new Set(),
      new ConstAtomicSchema(4),
      new ConstAtomicSchema('4'),
      new ConstAtomicSchema(2),
      new Map(),
      new ConstAtomicSchema(5),
      new ConstAtomicSchema(1),
    ])

    const result = getNegatedConstValuesFromNegatedAtomicSchemasByConstructor(
      instancesByConstructor,
      isNumber,
    )

    expectTypeOf(result).toEqualTypeOf<number[]>()

    expect(result).toMatchInlineSnapshot(`
      [
        1,
        2,
        3,
        4,
        2,
        5,
        1,
      ]
    `)
  })
})

describe(getUniqueNegatedConstSchemas, () => {
  it('returns the correctly filtered result', () => {
    const result = getUniqueNegatedConstSchemas(schemaDescribesEmptySet, [
      1,
      2,
      3,
      4,
      '4',
      2,
      5,
      1,
    ])

    expectTypeOf(result).toEqualTypeOf<{ not: { const: string | number } }[]>()

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "not": {
            "const": 1,
          },
        },
        {
          "not": {
            "const": 2,
          },
        },
        {
          "not": {
            "const": 3,
          },
        },
        {
          "not": {
            "const": 4,
          },
        },
        {
          "not": {
            "const": "4",
          },
        },
        {
          "not": {
            "const": 5,
          },
        },
      ]
    `)
  })
})

describe(
  getUniqueNegatedConstSchemasFromNegatedAtomicSchemasByConstructor,
  () => {
    it('returns the expected result', () => {
      const instancesByConstructor = new InstancesByConstructor([
        new ConstAtomicSchema(1),
        new TypeError(),
        new ConstAtomicSchema(2),
        new ConstAtomicSchema(3),
        new Set(),
        new ConstAtomicSchema(4),
        new ConstAtomicSchema('4'),
        new ConstAtomicSchema(2),
        new Map(),
        new ConstAtomicSchema(5),
        new ConstAtomicSchema(1),
      ])

      const result =
        getUniqueNegatedConstSchemasFromNegatedAtomicSchemasByConstructor(
          schemaDescribesEmptySet,
          instancesByConstructor,
          isNumber,
        )

      expectTypeOf(result).toEqualTypeOf<{ not: { const: number } }[]>()

      expect(result).toMatchInlineSnapshot(`
        [
          {
            "not": {
              "const": 1,
            },
          },
          {
            "not": {
              "const": 2,
            },
          },
          {
            "not": {
              "const": 3,
            },
          },
          {
            "not": {
              "const": 4,
            },
          },
          {
            "not": {
              "const": 5,
            },
          },
        ]
      `)
    })
  },
)
