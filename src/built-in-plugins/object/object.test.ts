import { describe, it, expect } from 'vitest'

import {
  createGetPropertyValueSchemaByKeyPattern,
  MaxPropertiesAtomicSchema,
  MinPropertiesAtomicSchema,
  PropertyAtomicSchema,
  RequiredAtomicSchema,
  UnevaluatedPropertiesAtomicSchema,
} from './object.js'
import { schemaDescribesEmptySet, toDNF } from '../../index.js'
import { schemaDescribesSubset } from '../../schema-describes-subset/index.js'
import { createValidate } from '../../validate/index.js'

const validate = createValidate([], [])

describe(RequiredAtomicSchema, () => {
  it('creates the expected JSON', () => {
    const schema = new RequiredAtomicSchema('a')
    expect(schema.toJSONSchema()).toMatchInlineSnapshot(`
      {
        "required": [
          "a",
        ],
      }
    `)
  })
})

describe(MinPropertiesAtomicSchema, () => {
  it('creates the expected JSON', () => {
    const schema = new MinPropertiesAtomicSchema(3)
    expect(schema.toJSONSchema()).toMatchInlineSnapshot(`
      {
        "minProperties": 3,
      }
    `)
  })
})

describe(MaxPropertiesAtomicSchema, () => {
  it('creates the expected JSON', () => {
    const schema = new MaxPropertiesAtomicSchema(3)
    expect(schema.toJSONSchema()).toMatchInlineSnapshot(`
      {
        "maxProperties": 3,
      }
    `)
  })
})

describe(PropertyAtomicSchema, () => {
  it('creates the expected JSON', () => {
    const schema = new PropertyAtomicSchema('a', true)
    expect(schema.toJSONSchema()).toMatchInlineSnapshot(`
      {
        "properties": {
          "a": true,
        },
      }
    `)
  })
})

describe(UnevaluatedPropertiesAtomicSchema, () => {
  it('throws on `toJSON`', () => {
    const schema = new UnevaluatedPropertiesAtomicSchema()
    expect(() => schema.toJSONSchema()).toThrowErrorMatchingInlineSnapshot(
      `[Error: unimplemented]`,
    )
  })
})

describe(createGetPropertyValueSchemaByKeyPattern, () => {
  it('works with empty patternPropertyAtomicSchemasByKeyPattern', () => {
    const getPropertyValueSchemaByKeyPattern =
      createGetPropertyValueSchemaByKeyPattern({
        validate,
        propertyNames: true,
        additionalPropertiesAtomicSchemas: [],
        patternPropertyAtomicSchemasByKeyPattern: {},
        schemaDescribesEmptySet,
      })

    expect(getPropertyValueSchemaByKeyPattern('^a+$')).toMatchInlineSnapshot(
      `true`,
    )
  })
})

describe(`${schemaDescribesEmptySet.name} using built-in object plugin`, () => {
  it('works with unsatisfiable properties', () => {
    expect(
      schemaDescribesEmptySet({
        required: ['a'],
        allOf: [
          { not: { properties: { b: false } } },
          { not: { properties: { c: false } } },
        ],
        maxProperties: 2,
      }),
    ).toBe(true)
    expect(
      schemaDescribesEmptySet({
        required: ['a'],
        allOf: [
          { not: { properties: { b: false } } },
          { not: { properties: { c: false } } },
        ],
        maxProperties: 3,
      }),
    ).toBe(null)
    expect(
      schemaDescribesEmptySet({
        required: ['a'],
        allOf: [
          { not: { properties: { a: false } } },
          { not: { properties: { b: false } } },
        ],
        maxProperties: 2,
      }),
    ).toBe(null)
  })

  it('works with unsatisfiable patternProperties', () => {
    expect(
      schemaDescribesEmptySet({
        type: 'object',
        patternProperties: { '^a$': false },
        required: ['a'],
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'object',
        patternProperties: { '^b$': false },
        required: ['a'],
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        type: 'object',
        properties: { a: { type: 'string' } },
        patternProperties: { '^a$': { type: 'number' } },
        required: ['a'],
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'object',
        properties: { a: { type: 'integer' } },
        patternProperties: { '^a$': { type: 'number' } },
        required: ['a'],
      }),
    ).toBe(null)
  })

  it('works with additionalProperties', () => {
    expect(
      schemaDescribesEmptySet({
        type: 'object',
        additionalProperties: false,
        patternProperties: { '^a+$': { type: 'string' } },
        required: ['b'],
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'object',
        additionalProperties: false,
        patternProperties: { '^b+$': { type: 'string' } },
        required: ['b'],
      }),
    ).toBe(null)
  })

  it('works with negated propertyNames', () => {
    expect(
      schemaDescribesEmptySet({
        type: 'object',
        not: { propertyNames: { enum: ['a', 'b', 'c'] } },
      }),
    ).toBe(null)
  })

  it('works with maxProperties and propertyNames', () => {
    expect(
      schemaDescribesEmptySet({
        maxProperties: 1,
        required: ['abc'],
        not: { propertyNames: { minLength: 2 } },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 1,
        required: ['ab'],
        not: { propertyNames: { minLength: 2 } },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 1,
        required: ['ab'],
        not: { propertyNames: { const: 'ab' } },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 2,
        required: ['ab'],
        not: { propertyNames: { const: 'ab' } },
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 2,
        required: ['ab', 'cd'],
        not: { propertyNames: { minLength: 2 } },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 2,
        required: ['ab'],
        not: { propertyNames: { minLength: 2 } },
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 1,
        required: ['a'],
        not: { propertyNames: { minLength: 2 } },
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 2,
        required: ['ab'],
        not: { propertyNames: { minLength: 2 } },
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 2,
        required: ['ab'],
        not: {
          anyOf: [
            { propertyNames: { minLength: 2 } },
            { propertyNames: { const: 'abc' } },
          ],
        },
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 3,
        required: ['ab', 'cd'],
        not: {
          anyOf: [
            { propertyNames: { minLength: 2 } },
            { propertyNames: { maxLength: 2 } },
          ],
        },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 3,
        required: ['ab'],
        not: {
          anyOf: [
            { propertyNames: { minLength: 2 } },
            { propertyNames: { maxLength: 2 } },
          ],
        },
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 3,
        required: ['x'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
          ],
        },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 4,
        required: ['x'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
          ],
        },
      }),
    ).toBe(null)
  })

  it('works with maxProperties, negated propertyNames and negated patternProperties', () => {
    expect(
      schemaDescribesEmptySet({
        maxProperties: 3,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { pattern: '^..$' } },
            { patternProperties: { '^..$': { type: 'number' } } },
          ],
        },
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 2,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { pattern: '^..$' } },
            { patternProperties: { '^..$': { type: 'number' } } },
          ],
        },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 3,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { pattern: '^...$' } },
            { patternProperties: { '^..$': { type: 'number' } } },
          ],
        },
      }),
    ).toBe(
      /* false negative, no check for pattern overlap */
      null,
    )

    expect(
      schemaDescribesEmptySet({
        maxProperties: 5,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
            { patternProperties: { '^.$': { type: 'number' } } },
          ],
        },
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 5,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
            { patternProperties: { '^..$': { type: 'number' } } },
          ],
        },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 5,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
            { patternProperties: { '^.$': { type: 'number' } } },
            { patternProperties: { '^..$': { type: 'number' } } },
          ],
        },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 5,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
            { patternProperties: { '^..$': { type: 'number' } } },
            { patternProperties: { '^...$': { type: 'number' } } },
          ],
        },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 6,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
            { patternProperties: { '^..$': { type: 'number' } } },
            { patternProperties: { '^...$': { type: 'number' } } },
          ],
        },
      }),
    ).toBe(
      /* false negative, no check for pattern overlap */
      null,
    )
  })

  it('works with limitations for negated propertyNames', () => {
    expect(
      schemaDescribesEmptySet({
        not: { propertyNames: { not: { enum: ['a', 'b'] } } },
        properties: {
          a: false,
          b: false,
        },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        not: { propertyNames: { not: { enum: ['a', 'b'] } } },
        properties: { a: false },
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        not: { propertyNames: { not: { enum: ['a', 'b'] } } },
        properties: { a: false },
        additionalProperties: false,
      }),
    ).toBe(true)
  })

  it('works with maxProperties, negated propertyNames and negated additionalProperties', () => {
    expect(
      schemaDescribesEmptySet({
        maxProperties: 5,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
            {
              additionalProperties: { type: 'boolean' },
              properties: { xyz: true },
              patternProperties: {
                '^..$': true,
                '^.$': true,
              },
            },
          ],
        },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 5,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
            {
              additionalProperties: { type: 'boolean' },
              properties: { xyz: true },
              patternProperties: {
                '^..$': true,
              },
            },
          ],
        },
      }),
    ).toBe(null)
  })

  it('works with maxProperties, negated propertyNames, negated patternProperties and negated additionalProperties', () => {
    expect(
      schemaDescribesEmptySet({
        maxProperties: 6,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
            {
              additionalProperties: { type: 'boolean' },
              properties: { xyz: true },
              patternProperties: {
                '^..$': true,
                '^.$': true,
              },
            },
            { patternProperties: { '^..$': { type: 'number' } } },
          ],
        },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        maxProperties: 7,
        required: ['x', 'y'],
        not: {
          anyOf: [
            { propertyNames: { not: { enum: ['a', 'b'] } } },
            { propertyNames: { not: { enum: ['c', 'd'] } } },
            { propertyNames: { not: { enum: ['e', 'f'] } } },
            { propertyNames: { not: { enum: ['f', 'g'] } } },
            {
              additionalProperties: { type: 'boolean' },
              properties: { xyz: true },
              patternProperties: {
                '^..$': true,
                '^.$': true,
              },
            },
            { patternProperties: { '^..$': { type: 'number' } } },
          ],
        },
      }),
    ).toBe(null)
  })

  it('works with minProperties and propertyNames', () => {
    expect(
      schemaDescribesEmptySet({
        type: 'object',
        minProperties: 1,
        propertyNames: false,
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'object',
        minProperties: 1,
        propertyNames: true,
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        type: 'object',
        minProperties: 1,
        propertyNames: { type: 'number' },
      }),
    ).toBe(true)
  })

  it('works with required and propertyNames', () => {
    expect(
      schemaDescribesEmptySet({
        type: 'object',
        required: ['a', 'b'],
        propertyNames: { pattern: '^a+$' },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'object',
        required: ['a'],
        propertyNames: { pattern: '^a+$' },
      }),
    ).toBe(null)
  })
})

describe(`${schemaDescribesSubset.name} using built-in object plugin`, () => {
  it('works with minProperties/maxProperties', () => {
    expect(
      schemaDescribesSubset({ minProperties: 6 }, { minProperties: 5 }),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ minProperties: 5 }, { minProperties: 5 }),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ minProperties: 4 }, { minProperties: 5 }),
    ).toBe(null)

    expect(schemaDescribesSubset({}, { minProperties: 5 })).toBe(null)

    expect(schemaDescribesSubset({ minProperties: 5 }, {})).toBe(true)

    expect(
      schemaDescribesSubset({ maxProperties: 6 }, { maxProperties: 5 }),
    ).toBe(null)

    expect(
      schemaDescribesSubset({ maxProperties: 4 }, { maxProperties: 5 }),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ maxProperties: 5 }, { maxProperties: 5 }),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { minProperties: 4, required: ['a', 'b', 'c', 'd', 'e'] },
        { minProperties: 5 },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { maxProperties: 2 },
        {
          anyOf: [
            { properties: { a: { type: 'string' } } },
            { properties: { b: { type: 'string' } } },
            { properties: { c: { type: 'string' } } },
          ],
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { maxProperties: 2 },
        {
          anyOf: [
            { properties: { a: { type: 'string' } } },
            { properties: { a: { type: ['string', 'number'] } } },
            { properties: { b: { type: 'string' } } },
          ],
        },
      ),
    ).toBe(null)
  })

  it('works with maxProperties and patternProperties', () => {
    expect(
      schemaDescribesSubset(
        { maxProperties: 0 },
        { patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { maxProperties: 1 },
        { patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { maxProperties: 1 },
        {
          anyOf: [
            { properties: { x: { type: 'string' } } },
            { patternProperties: { '^a$': { type: 'string' } } },
          ],
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { maxProperties: 1 },
        {
          anyOf: [
            { properties: { a: { type: 'string' } } },
            { patternProperties: { '^a$': { type: 'string' } } },
          ],
        },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { maxProperties: 1 },
        {
          anyOf: [
            { patternProperties: { '^a$': { type: 'string' } } },
            { patternProperties: { '^b$': { type: 'string' } } },
          ],
        },
      ),
    ).toBe(
      /* false negative by design */
      null,
    )

    expect(
      schemaDescribesSubset(
        { maxProperties: 1, required: ['b'] },
        { patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { maxProperties: 1, required: ['a'] },
        { patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { maxProperties: 2, required: ['b', 'c'] },
        { patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { maxProperties: 2, required: ['a', 'b'] },
        { patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(null)
  })

  it('works with maxProperties and propertyNames', () => {
    expect(
      schemaDescribesSubset(
        { maxProperties: 0 },
        { propertyNames: { minLength: 2 } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { maxProperties: 1 },
        { propertyNames: { minLength: 2 } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { maxProperties: 1, required: ['abc'] },
        { propertyNames: { minLength: 2 } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { maxProperties: 1, required: ['a'] },
        { propertyNames: { minLength: 2 } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { maxProperties: 2, required: ['abc', 'def'] },
        { propertyNames: { minLength: 2 } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { maxProperties: 2, required: ['abc', 'd'] },
        { propertyNames: { minLength: 2 } },
      ),
    ).toBe(null)
  })

  it('works with required', () => {
    expect(
      schemaDescribesSubset(
        { required: ['a', 'b', 'c', 'd'] },
        { required: ['a', 'b'] },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { required: ['a', 'b'] },
        { required: ['a', 'b', 'c', 'd'] },
      ),
    ).toBe(null)
  })

  it('works with consts and object constraints', () => {
    expect(
      schemaDescribesSubset({ const: { a: false } }, { required: ['a'] }),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ const: { b: false } }, { required: ['a'] }),
    ).toBe(false)
    expect(
      schemaDescribesSubset(
        { const: { a: false } },
        { not: { required: ['a'] } },
      ),
    ).toBe(false)
    expect(
      schemaDescribesSubset(
        { const: { b: false } },
        { not: { required: ['a'] } },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ const: { a: false } }, { minProperties: 1 }),
    ).toBe(true)
    expect(schemaDescribesSubset({ const: {} }, { minProperties: 1 })).toBe(
      false,
    )
    expect(
      schemaDescribesSubset({ const: { a: false } }, { maxProperties: 1 }),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { const: { a: false, b: false } },
        { maxProperties: 1 },
      ),
    ).toBe(false)
  })

  it('works with unsatisfiable properties', () => {
    expect(
      schemaDescribesSubset(
        { required: ['a'], maxProperties: 2 },
        { anyOf: [{ properties: { b: false } }, { properties: { c: false } }] },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { required: ['a'], maxProperties: 3 },
        { anyOf: [{ properties: { b: false } }, { properties: { c: false } }] },
      ),
    ).toBe(null)
  })

  it('works with properties', () => {
    expect(
      schemaDescribesSubset(
        { required: ['a'], properties: { a: { type: 'string' } } },
        { required: ['a'], properties: { a: { type: 'number' } } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { required: ['a'], properties: { a: { type: 'string' } } },
        { required: ['a'], properties: { a: { type: ['string', 'number'] } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { properties: { a: { type: 'string' } } },
        { properties: { a: { type: 'number' } } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { properties: { a: { type: 'string' } } },
        { properties: { a: { type: 'string' } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { required: ['a'], properties: { a: { type: 'string' } } },
        { properties: { a: { type: 'string' } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { properties: { a: { type: 'string' } } },
        { required: ['a'], properties: { a: { type: 'string' } } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { properties: { a: { type: 'string' }, b: { type: 'number' } } },
        { properties: { a: { type: 'string' } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { properties: { a: { type: 'string' } } },
        { properties: { a: { type: 'string' }, b: { type: 'number' } } },
      ),
    ).toBe(null)
  })

  it('works with patternProperties and const', () => {
    expect(
      schemaDescribesSubset(
        { const: { a: 5 } },
        { patternProperties: { '^a$': { type: 'number' } } },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { const: { a: '5' } },
        { patternProperties: { '^a$': { type: 'number' } } },
      ),
    ).toBe(false)
  })

  it('works with unsatisfiable patternProperties', () => {
    expect(
      schemaDescribesSubset(
        { patternProperties: { 'a+': { type: 'string' } } },
        { properties: { a: { type: ['string', 'number'] } } },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { properties: { a: { type: 'string' } } },
        { patternProperties: { 'a+': { type: 'string' } } },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { patternProperties: { 'a+': { type: 'boolean' } } },
        { properties: { a: { type: ['string', 'number'] } } },
      ),
    ).toBe(null)
  })

  it('works with patternProperties', () => {
    expect(
      schemaDescribesSubset(
        { required: ['a'], patternProperties: { '^a$': { type: 'string' } } },
        { required: ['a'], patternProperties: { '^a$': { type: 'number' } } },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { required: ['a'], patternProperties: { '^a$': { type: 'string' } } },
        { required: ['a'], patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { required: ['a'], patternProperties: { '^a$': { type: 'string' } } },
        {
          required: ['a'],
          patternProperties: { '^a$': { type: ['string', 'number'] } },
        },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a$': { type: 'string' } } },
        {
          anyOf: [
            {
              patternProperties: { '^a$': { type: ['string'] } },
            },
            {
              patternProperties: { '^a$': { type: ['number'] } },
            },
          ],
        },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a$': { type: 'boolean' } } },
        {
          anyOf: [
            {
              patternProperties: { '^a$': { type: ['string'] } },
            },
            {
              patternProperties: { '^a$': { type: ['number'] } },
            },
          ],
        },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a$': { const: 1 } } },
        {
          anyOf: [
            {
              patternProperties: { '^a$': { const: 0 } },
            },
            {
              patternProperties: { '^a$': { const: 1 } },
            },
          ],
        },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a$': { const: 2 } } },
        {
          anyOf: [
            {
              patternProperties: { '^a$': { const: 0 } },
            },
            {
              patternProperties: { '^a$': { const: 1 } },
            },
          ],
        },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        {
          anyOf: [
            {
              patternProperties: { '^a$': { const: 0 } },
            },
            {
              patternProperties: { '^a$': { const: 1 } },
            },
          ],
        },
        {
          anyOf: [
            {
              patternProperties: { '^a$': { const: 0 } },
            },
            {
              patternProperties: { '^a$': { const: 1 } },
            },
          ],
        },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a$': { type: 'string' } } },
        { patternProperties: { '^a$': { type: 'number' } } },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a$': { type: 'string' } } },
        { patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { required: ['a'], patternProperties: { '^a$': { type: 'string' } } },
        { patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a$': { type: 'string' } } },
        { required: ['a'], patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        {
          patternProperties: {
            '^a$': { type: 'string' },
            '^b$': { type: 'number' },
          },
        },
        { patternProperties: { '^a$': { type: 'string' } } },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a$': { type: 'string' } } },
        {
          patternProperties: {
            '^a$': { type: 'string' },
            '^b$': { type: 'number' },
          },
        },
      ),
    ).toBe(null)
  })

  it('works with properties and patternProperties', () => {
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a+$': { type: 'number' } } },
        { properties: { a: { type: 'number' } } },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a+$': { type: 'number' } } },
        { properties: { b: { type: 'number' } } },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { patternProperties: { '^a+$': { type: 'number' } } },
        { properties: { a: { type: 'string' } } },
      ),
    ).toBe(null)
  })

  it('works with additionalProperties and const', () => {
    expect(
      schemaDescribesSubset(
        { const: { a: 10 } },
        {
          additionalProperties: { type: 'integer' },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { const: { a: 10, b: true, c: 'string' } },
        {
          additionalProperties: { type: 'integer' },
          properties: { b: { type: 'boolean' } },
          patternProperties: { '^c$': { type: 'string' } },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { const: { a: 10 } },
        {
          additionalProperties: { type: 'boolean' },
        },
      ),
    ).toBe(false)

    expect(
      schemaDescribesSubset(
        { const: { a: 10, b: true, c: 'string' } },
        {
          additionalProperties: { type: 'boolean' },
          properties: { b: { type: 'boolean' } },
          patternProperties: { '^c$': { type: 'string' } },
        },
      ),
    ).toBe(false)
  })

  it('works with additionalProperties', () => {
    expect(
      schemaDescribesSubset(
        { additionalProperties: { type: 'number' } },
        { properties: { a: { type: 'number' } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { additionalProperties: { type: 'number' } },
        { patternProperties: { '^a+$': { type: 'number' } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { additionalProperties: { type: 'number' } },
        {
          patternProperties: {
            '^a+$': { type: 'number' },
            '^b+$': { type: 'number' },
          },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { additionalProperties: { type: 'number' } },
        {
          patternProperties: {
            '^a+$': { type: 'number' },
            '^b+$': { type: 'string' },
          },
        },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        {
          patternProperties: { '^a+$': { type: 'number' } },
          additionalProperties: { type: 'string' },
        },
        { patternProperties: { '^a+$': { type: 'number' } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          properties: { x: { type: 'string' } },
          additionalProperties: { type: 'number' },
        },
        { patternProperties: { '^a+$': { type: 'number' } } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { additionalProperties: { type: 'number' } },
        { properties: { a: { type: 'string' } } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { additionalProperties: { type: 'number' } },
        { patternProperties: { '^a+$': { type: 'string' } } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: false,
          patternProperties: { '^a+$': { type: 'string' } },
        },
        {
          properties: { b: { type: 'number' } },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: false,
          patternProperties: { '^a+$': { type: 'string' } },
        },
        {
          properties: { a: { type: 'number' } },
        },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
        },
        {
          additionalProperties: { type: 'number' },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' } },
        },
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' } },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' } },
        },
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' }, b: { type: 'number' } },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' }, b: { type: 'number' } },
        },
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' } },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' }, b: { type: 'number' } },
        },
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' }, b: { type: 'number' } },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' } },
        },
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' }, b: { type: 'boolean' } },
        },
      ),
    ).toBe(null)

    expect(
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
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' }, b: { type: 'boolean' } },
        },
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' } },
        },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          properties: { a: { type: 'string' }, b: { type: 'boolean' } },
        },
        {
          additionalProperties: { type: ['number', 'boolean'] },
          properties: { a: { type: 'string' } },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
          properties: { b: { type: 'boolean' } },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
          properties: { b: { type: 'boolean' } },
        },
      ),
    ).toBe(true)

    expect(
      /* {"b": 5} satisfies both schemas
       * {"aa": "string"} satisfies only the second schema
       * {"": 5} satisfies both schemas
       * {"": "string"} satisfies none of the schemas
       */
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^a*$': { type: 'number' },
          },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
        },
      ),
    ).toBe(true)

    expect(
      /* {"b": 5} satisfies both schemas
       * {"aa": "string"} satisfies only the first schema
       */
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^a*$': { type: 'number' },
          },
        },
      ),
    ).toBe(null)

    expect(
      /* {"b": 5} satisfies both schemas
       * {"aa": "string"} satisfies only the first schema
       */
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
        },
        {
          additionalProperties: { type: ['number', 'boolean'] },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^a*$': { type: 'number' },
          },
        },
      ),
    ).toBe(null)

    expect(
      /* {"a": "string"} satisfies only the first schema */
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^a*$': { type: ['boolean', 'number'] },
          },
        },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^b+$': { type: 'number' },
          },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^b+$': { type: 'number' },
          },
        },
      ),
    ).toBe(true)

    expect(
      /* {"": 5} satisfies only the first schema */
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^a*$': { type: 'boolean' },
          },
        },
      ),
    ).toBe(null)

    expect(
      /* {"": true} satisfies only the first schema */
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^a*$': { type: 'boolean' },
          },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
        },
      ),
    ).toBe(null)

    expect(
      /* {"b": 5} satisfies both schemas
       * {"aa": "string"} satisfies only the second schema
       * {"": 5} satisfies only the second schema
       * {"": true} satisfies both schemas
       * {"": "string"} satisfies none of the schemas
       */
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^a*$': { type: 'boolean' },
          },
        },
        {
          additionalProperties: { type: ['number', 'boolean'] },
          patternProperties: { '^a+$': { type: 'string' } },
        },
      ),
    ).toBe(true)

    expect(
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
                '^b+$': { type: 'number' },
              },
            },
            {
              additionalProperties: { type: 'number' },
              patternProperties: {
                '^a+$': { type: 'string' },
                '^b+$': true,
              },
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
    ).toBe(true)

    expect(
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
                '^b+$': { type: 'number' },
              },
            },
            {
              additionalProperties: { type: 'number' },
              patternProperties: {
                '^b+$': true,
              },
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
    ).toBe(
      /* False negative. There is actually no overlap between `'^b+$'`
       * and `'^a+$'` */
      null,
    )

    expect(
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
          ],
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
          },
        },
      ),
    ).toBe(null)

    expect(
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
    ).toBe(true)

    expect(
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
                '^b*$': { type: 'number' },
              },
            },
            {
              additionalProperties: { type: 'number' },
              patternProperties: {
                '^a+$': { type: 'string' },
                '^b+$': true,
              },
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
    ).toBe(
      /* False negative. Any property key that matches `'^b+$'` also matches
       * `'^b*$'`. Therefore its value must match the schema
       * `{ type: 'number' }` */
      null,
    )

    expect(
      schemaDescribesSubset(
        {
          allOf: [
            {
              additionalProperties: { type: 'number' },
              properties: {
                aa: { type: 'string' },
                aaa: { type: 'string' },
                aaaa: { type: 'string' },
              },
              patternProperties: {
                '^c+$': { type: 'string' },
              },
            },
            {
              additionalProperties: { type: 'number' },
              patternProperties: {
                '^a+$': { type: 'string' },
                '^b+$': true,
              },
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
    ).toBe(
      /* False negative. Values for keys that match `'^b+$'` actually must be of
       * `{ type: 'number' }`, but it is not checked that there is no overlap
       * between `'^b+$'` and `'^c+$'` */
      null,
    )

    expect(
      schemaDescribesSubset(
        {
          allOf: [
            {
              additionalProperties: { type: 'number' },
              properties: {
                aa: { type: 'string' },
                aaa: { type: 'string' },
                aaaa: { type: 'string' },
              },
            },
            {
              additionalProperties: { type: 'number' },
              patternProperties: {
                '^a+$': { type: 'string' },
                '^b+$': true,
              },
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
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          allOf: [
            {
              additionalProperties: { type: 'number' },
              properties: {
                aa: { type: 'string' },
                aaa: { type: 'string' },
                aaaa: { type: 'string' },
                bb: { type: 'string' },
              },
            },
            {
              additionalProperties: { type: 'number' },
              patternProperties: {
                '^a+$': { type: 'string' },
                '^b+$': true,
              },
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
    ).toBe(null)
  })

  it('works with additionalProperties and maxProperties', () => {
    expect(
      schemaDescribesSubset(
        {
          additionalProperties: false,
          properties: {
            a: { type: 'string' },
            b: { type: 'number' },
            c: { type: 'boolean' },
          },
        },
        { maxProperties: 3 },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: false,
          properties: {
            a: { type: 'string' },
            b: { type: 'number' },
            c: { type: 'boolean' },
          },
        },
        { maxProperties: 2 },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: false,
          properties: {
            a: { type: 'string' },
            b: { type: 'number' },
            c: false,
          },
        },
        { maxProperties: 2 },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          allOf: [
            { additionalProperties: { type: 'string' } },
            {
              additionalProperties: { type: 'number' },
              properties: {
                a: { type: 'string' },
                b: { type: 'string' },
                c: false,
              },
            },
          ],
        },
        { maxProperties: 2 },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          allOf: [
            { additionalProperties: { type: ['string', 'number'] } },
            {
              additionalProperties: { type: 'number' },
              properties: {
                a: { type: 'string' },
                b: { type: 'string' },
                c: false,
              },
            },
          ],
        },
        { maxProperties: 2 },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: false,
          properties: {
            a: { type: 'string' },
            b: { type: 'number' },
          },
          patternProperties: {
            '^c$': { type: 'boolean' },
          },
        },
        { maxProperties: 3 },
      ),
    ).toBe(/* false negative */ null)
  })

  it('works with propertyNames and const', () => {
    expect(
      schemaDescribesSubset(
        { const: { a: 10 } },
        { propertyNames: { pattern: '^a+$' } },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { const: { b: 10 } },
        { propertyNames: { pattern: '^a+$' } },
      ),
    ).toBe(false)
  })

  it('works with propertyNames', () => {
    expect(
      schemaDescribesSubset(
        { propertyNames: { pattern: '^a+$' } },
        { propertyNames: { pattern: '^a+$' } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { propertyNames: { pattern: '^a+$' } },
        { propertyNames: { pattern: '^b+$' } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { propertyNames: { minLength: 3 } },
        { propertyNames: { minLength: 3 } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { propertyNames: { minLength: 4 } },
        { propertyNames: { minLength: 3 } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { propertyNames: { minLength: 3 } },
        { propertyNames: { minLength: 4 } },
      ),
    ).toBe(null)
  })

  it('works with propertyNames and additionalProperties', () => {
    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
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
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^b+$': { type: 'string' },
            '^c+$': { type: 'string' },
          },
          properties: {
            d: { type: 'boolean' },
            e: { type: 'boolean' },
            f: { type: 'boolean' },
          },
          propertyNames: { enum: ['a', 'b', 'd', 'e'] },
        },
        {
          additionalProperties: false,
          patternProperties: {
            '^a+$': { type: 'string' },
            '^b+$': { type: 'string' },
            '^c+$': { type: 'string' },
          },
          properties: {
            d: { type: 'boolean' },
            e: { type: 'boolean' },
            f: { type: 'boolean' },
          },
        },
      ),
    ).toBe(true)

    expect(
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
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: { type: 'object' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^b+$': { type: 'boolean' },
          },
          propertyNames: { pattern: '^a+$' },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          additionalProperties: false,
          patternProperties: {
            '^a+$': { type: 'string' },
            '^b+$': { type: 'boolean' },
          },
          propertyNames: { pattern: '^a+$' },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: { '^a+$': { type: 'string' } },
        },
      ),
    ).toBe(true)

    expect(
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
    ).toBe(true)
  })

  it('works with dependentRequired', () => {
    expect(
      schemaDescribesSubset(
        { required: ['a', 'b', 'c'] },
        { dependentRequired: { a: ['b', 'c'] } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { required: ['b', 'c'] },
        { dependentRequired: { a: ['b', 'c'] } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { required: ['a', 'b'] },
        { dependentRequired: { a: ['b', 'c'] } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { required: ['b'] },
        { dependentRequired: { a: ['b', 'c'] } },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { required: ['b'], propertyNames: { pattern: '^b+$' } },
        { dependentRequired: { a: ['b', 'c'] } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          required: ['b'],
          patternProperties: { '^b+$': true },
          additionalProperties: false,
        },
        { dependentRequired: { a: ['b', 'c'] } },
      ),
    ).toBe(true)
  })

  it('works with dependentSchemas', () => {
    expect(
      schemaDescribesSubset(
        {
          properties: {
            b: { type: 'string' },
          },
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
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          properties: {
            b: { type: ['string', 'number'] },
          },
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
    ).toBe(null)

    expect(
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
    ).toBe(true)
  })

  it('works with `unevaluatedProperties` (to a minimal degree)', () => {
    expect(
      schemaDescribesSubset(
        { type: 'array' },
        { unevaluatedProperties: { type: 'boolean' } },
      ),
    ).toBe(true)

    expect(() =>
      schemaDescribesSubset(
        { type: 'object' },
        { unevaluatedProperties: { type: 'boolean' } },
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword 'unevaluatedProperties'. This currently cannot be transformed to a dnf.]`,
    )
  })
})

describe(`${toDNF.name} using built-in object plugin`, () => {
  it('returns the expected dnf', () => {
    expect(
      toDNF({
        type: 'object',
        properties: { a: { type: 'number' } },
        patternProperties: { '^a+$': { type: 'string' } },
        required: ['c'],
        minProperties: 2,
        maxProperties: 200,
        allOf: [
          {
            properties: { a: { minimum: 5 }, b: { type: 'number' } },
            required: ['b'],
            maxProperties: 100,
            propertyNames: { maxLength: 90 },
            additionalProperties: { type: 'boolean' },
          },
          {
            properties: { b: { type: 'number' } },
            patternProperties: {
              '^a+$': { minLength: 5 },
              '^aa+$': { minLength: 6 },
            },
            minProperties: 3,
            propertyNames: { maxLength: 100 },
            additionalProperties: { type: 'boolean' },
          },
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "additionalProperties": {
                  "type": "boolean",
                },
                "properties": {
                  "a": true,
                  "b": true,
                },
              },
              {
                "additionalProperties": {
                  "type": "boolean",
                },
                "patternProperties": {
                  "^a+$": true,
                  "^aa+$": true,
                },
                "properties": {
                  "b": true,
                },
              },
            ],
            "maxProperties": 100,
            "minProperties": 3,
            "patternProperties": {
              "^a+$": {
                "allOf": [
                  {
                    "minLength": 5,
                  },
                  {
                    "type": "string",
                  },
                ],
              },
              "^aa+$": {
                "allOf": [
                  {
                    "minLength": 6,
                  },
                  {
                    "type": "boolean",
                  },
                ],
              },
            },
            "properties": {
              "a": {
                "allOf": [
                  {
                    "minimum": 5,
                  },
                  {
                    "type": "number",
                  },
                  {
                    "minLength": 5,
                  },
                  {
                    "type": "string",
                  },
                ],
              },
              "b": {
                "allOf": [
                  {
                    "type": "number",
                  },
                  {
                    "type": "number",
                  },
                ],
              },
            },
            "propertyNames": {
              "allOf": [
                {
                  "maxLength": 90,
                },
                {
                  "maxLength": 100,
                },
                {
                  "type": "string",
                },
              ],
            },
            "required": [
              "b",
              "c",
            ],
            "type": "object",
          },
        ],
      }
    `)
  })

  it('throws on `unevaluatedProperties`', () => {
    expect(() =>
      toDNF({ type: 'object', unevaluatedProperties: { type: 'string' } }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword 'unevaluatedProperties'. This currently cannot be transformed to a dnf.]`,
    )

    expect(() =>
      toDNF({
        type: 'object',
        not: { unevaluatedProperties: { type: 'string' } },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword 'unevaluatedProperties'. This currently cannot be transformed to a dnf.]`,
    )
  })

  it("doesn't throw on `unevaluatedProperties` if there's another contradiction", () => {
    expect(
      toDNF({
        type: 'object',
        unevaluatedProperties: { type: 'string' },
        minProperties: 5,
        maxProperties: 4,
      }),
    ).toMatchInlineSnapshot(`false`)
  })
})
