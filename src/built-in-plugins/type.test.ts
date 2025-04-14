import type { JSONSchema } from '../json-schema/index.js'
import { describe, it, expect } from 'vitest'

import {
  MultipleOfAtomicSchema,
  TypeAtomicSchema,
  typeExtraction,
} from './type.js'
import { schemaDescribesSubset } from '../schema-describes-subset/schema-describes-subset.js'
import { split as splitWithOptions } from '../atomic-schema/split/index.js'
import { toInternalOptions } from '../options/options.js'
import type { ExtractFunctionArguments } from '../plugin/plugin.js'
import { toDNF } from '../dnf/index.js'

const options = toInternalOptions({})
const split: ExtractFunctionArguments['split'] = (schema) =>
  splitWithOptions({
    schema,
    options,
  })
const toArgs = (schema: JSONSchema & object): ExtractFunctionArguments => ({
  schema,
  split,
})

describe(TypeAtomicSchema, () => {
  it('ignores invalid inputs', () => {
    expect(new TypeAtomicSchema('invalid').type).toMatchInlineSnapshot(`
      [
        "null",
        "number",
        "string",
        "boolean",
        "array",
        "object",
      ]
    `)

    expect(new TypeAtomicSchema(['invalid', 'number']).type)
      .toMatchInlineSnapshot(`
      [
        "number",
      ]
    `)

    expect(new TypeAtomicSchema(['invalid', 'invalid2']).type)
      .toMatchInlineSnapshot(`
      [
        "null",
        "number",
        "string",
        "boolean",
        "array",
        "object",
      ]
    `)

    expect(new TypeAtomicSchema().type).toMatchInlineSnapshot(`
      [
        "null",
        "number",
        "string",
        "boolean",
        "array",
        "object",
      ]
    `)

    expect(new TypeAtomicSchema([]).type).toMatchInlineSnapshot(`
      [
        "null",
        "number",
        "string",
        "boolean",
        "array",
        "object",
      ]
    `)
  })

  it('uses valid input', () => {
    expect(new TypeAtomicSchema('string').type).toMatchInlineSnapshot(`
      [
        "string",
      ]
    `)
  })
})

describe(typeExtraction.extract, () => {
  it('extracts integer type', () => {
    expect(typeExtraction.extract(toArgs({ type: 'integer' })))
      .toMatchInlineSnapshot(`
      AllOfSchema {
        "allOf": [
          TypeAtomicSchema {
            "type": [
              "number",
            ],
          },
          MultipleOfAtomicSchema {
            "multipleOf": 1,
          },
        ],
      }
    `)
  })

  it('ignores invalid types', () => {
    expect(typeExtraction.extract(toArgs({ type: [] }))).toMatchInlineSnapshot(
      `true`,
    )

    expect(typeExtraction.extract(toArgs({ type: 5 }))).toMatchInlineSnapshot(
      `true`,
    )
  })
})

describe(schemaDescribesSubset, () => {
  it('works with type schemas', () => {
    expect(
      schemaDescribesSubset({ type: 'number' }, { type: ['number', 'string'] }),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ type: ['number', 'string'] }, { type: 'number' }),
    ).toBe(null)
    expect(
      schemaDescribesSubset({ type: 'number' }, { type: ['null', 'string'] }),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { type: 'integer' },
        { type: ['number', 'string'] },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { type: 'integer' },
        { anyOf: [{ type: 'number' }, { type: 'boolean' }] },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ type: 'integer' }, { not: { type: 'string' } }),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ type: 'integer' }, { not: { type: 'number' } }),
    ).toBe(null)
    expect(
      schemaDescribesSubset(true, {
        type: ['number', 'boolean', 'string', 'null', 'array', 'object'],
      }),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          type: ['number', 'boolean', 'string', 'null', 'array', 'object'],
        },
        { type: ['number', 'null'] },
      ),
    ).toBe(false)
  })

  it('works with nullable keyword', () => {
    expect(
      schemaDescribesSubset(
        { const: null },
        { type: 'number', nullable: true },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { type: ['number', 'null'] },
        { type: 'number', nullable: true },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { type: ['number', 'null'] },
        { type: 'number', nullable: false },
      ),
    ).toBe(false)

    expect(
      schemaDescribesSubset(
        { const: null },
        { type: 'number', nullable: true },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { const: null },
        { type: 'number', nullable: false },
      ),
    ).toBe(false)
  })
})

describe(toDNF, () => {
  it('works with nullable keyword', () => {
    expect(toDNF({ type: 'number', nullable: true })).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "const": null,
          },
          {
            "type": "number",
          },
        ],
      }
    `)

    expect(toDNF({ type: 'number', nullable: false })).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "type": "number",
          },
        ],
      }
    `)

    expect(toDNF({ type: ['number', 'string', 'boolean'], nullable: true }))
      .toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "const": null,
          },
          {
            "const": true,
          },
          {
            "const": false,
          },
          {
            "type": "number",
          },
          {
            "type": "string",
          },
        ],
      }
    `)
  })

  it('ignores `nullable` if `null` would be impossible for other reasons', () => {
    expect(toDNF({ type: 'number', nullable: true, not: { minimum: 5 } }))
      .toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "not": {
                  "const": 5,
                },
              },
            ],
            "maximum": 5,
            "type": "number",
          },
        ],
      }
    `)
  })
})

describe(MultipleOfAtomicSchema, () => {
  it('creates the expected JSON', () => {
    const schema = new MultipleOfAtomicSchema(3)
    expect(schema.toJSONSchema()).toMatchInlineSnapshot(`
      {
        "multipleOf": 3,
      }
    `)
  })
})
