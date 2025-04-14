import { describe, it, expect } from 'vitest'

import { enhanceSchema, createValidate } from './validate.js'

describe(enhanceSchema, () => {
  it('leaves boolean schemas unaltered', () => {
    expect(enhanceSchema(true, [])).toBe(true)
    expect(enhanceSchema(false, [])).toBe(false)
    expect(
      enhanceSchema(true, [
        { $id: 'https://example.com/maximum9', maximum: 9 },
      ]),
    ).toBe(true)
    expect(
      enhanceSchema(false, [
        { $id: 'https://example.com/maximum9', maximum: 9 },
      ]),
    ).toBe(false)
  })

  it('adds empty definitions', () => {
    expect(enhanceSchema({}, [])).toMatchInlineSnapshot(`
      {
        "$defs": {},
      }
    `)

    expect(enhanceSchema({ type: 'number', minimum: 5 }, []))
      .toMatchInlineSnapshot(`
      {
        "$defs": {},
        "minimum": 5,
        "type": "number",
      }
    `)

    expect(enhanceSchema({ type: 'number', minimum: 5, $defs: {} }, []))
      .toMatchInlineSnapshot(`
      {
        "$defs": {},
        "minimum": 5,
        "type": "number",
      }
    `)
  })

  it('adds definitions with $id', () => {
    expect(
      enhanceSchema({ type: 'number', minimum: 5 }, [
        { $id: 'https://example.com/maximum9', maximum: 9 },
      ]),
    ).toMatchInlineSnapshot(`
      {
        "$defs": {
          "https://example.com/maximum9": {
            "$id": "https://example.com/maximum9",
            "maximum": 9,
          },
        },
        "minimum": 5,
        "type": "number",
      }
    `)

    expect(
      enhanceSchema({ type: 'number', minimum: 5, $defs: {} }, [
        { $id: 'https://example.com/maximum9', maximum: 9 },
      ]),
    ).toMatchInlineSnapshot(`
      {
        "$defs": {
          "https://example.com/maximum9": {
            "$id": "https://example.com/maximum9",
            "maximum": 9,
          },
        },
        "minimum": 5,
        "type": "number",
      }
    `)

    expect(
      enhanceSchema(
        {
          type: 'number',
          minimum: 5,
          $defs: {
            'https://example.com/maximum9': {
              maximum: 9,
            },
          },
        },
        [{ $id: 'https://example.com/maximum9', maximum: 9 }],
      ),
    ).toMatchInlineSnapshot(`
      {
        "$defs": {
          "https://example.com/maximum9": {
            "maximum": 9,
          },
          "https://example.com/maximum9 1": {
            "$id": "https://example.com/maximum9",
            "maximum": 9,
          },
        },
        "minimum": 5,
        "type": "number",
      }
    `)

    expect(
      enhanceSchema(
        {
          type: 'number',
          minimum: 5,
          $defs: {
            'https://example.com/maximum9': {
              maximum: 9,
            },
            'https://example.com/maximum9 1': {
              maximum: 9,
            },
          },
        },
        [{ $id: 'https://example.com/maximum9', maximum: 9 }],
      ),
    ).toMatchInlineSnapshot(`
      {
        "$defs": {
          "https://example.com/maximum9": {
            "maximum": 9,
          },
          "https://example.com/maximum9 1": {
            "maximum": 9,
          },
          "https://example.com/maximum9 2": {
            "$id": "https://example.com/maximum9",
            "maximum": 9,
          },
        },
        "minimum": 5,
        "type": "number",
      }
    `)

    expect(
      enhanceSchema(
        {
          $id: 'https://example.com/',
          allOf: [
            { $ref: 'https://example.com/minimum4' },
            { $ref: 'https://example.com/maximum9' },
            { $ref: 'https://example.com/multipleOf2' },
            { $id: 'https://example.com/multipleOf3', multipleOf: 3 },
          ],
          $defs: {
            maximum9: { $id: 'https://example.com/maximum9', maximum: 9 },
          },
        },
        [
          {
            $id: 'https://example.com/minimum4',
            minimum: 4,
            $defs: {
              multipleOf2: {
                $id: 'https://example.com/multipleOf2',
                multipleOf: 2,
              },
            },
          },
        ],
      ),
    ).toMatchInlineSnapshot(`
      {
        "$defs": {
          "https://example.com/minimum4": {
            "$defs": {
              "multipleOf2": {
                "$id": "https://example.com/multipleOf2",
                "multipleOf": 2,
              },
            },
            "$id": "https://example.com/minimum4",
            "minimum": 4,
          },
          "maximum9": {
            "$id": "https://example.com/maximum9",
            "maximum": 9,
          },
        },
        "$id": "https://example.com/",
        "allOf": [
          {
            "$ref": "https://example.com/minimum4",
          },
          {
            "$ref": "https://example.com/maximum9",
          },
          {
            "$ref": "https://example.com/multipleOf2",
          },
          {
            "$id": "https://example.com/multipleOf3",
            "multipleOf": 3,
          },
        ],
      }
    `)
  })

  it('adds definitions without $id', () => {
    expect(enhanceSchema({ type: 'number', minimum: 5 }, [{ maximum: 9 }]))
      .toMatchInlineSnapshot(`
      {
        "$defs": {
          "def 0": {
            "maximum": 9,
          },
        },
        "minimum": 5,
        "type": "number",
      }
    `)

    expect(
      enhanceSchema({ type: 'number', minimum: 5 }, [
        { maximum: 9 },
        { multipleOf: 2 },
      ]),
    ).toMatchInlineSnapshot(`
      {
        "$defs": {
          "def 0": {
            "maximum": 9,
          },
          "def 1": {
            "multipleOf": 2,
          },
        },
        "minimum": 5,
        "type": "number",
      }
    `)

    expect(
      enhanceSchema(
        {
          type: 'number',
          minimum: 5,
          $defs: {
            'def 0': true,
            'def 1': true,
            'def 2': true,
            'def 4': true,
          },
        },
        [{ maximum: 9 }, { multipleOf: 2 }],
      ),
    ).toMatchInlineSnapshot(`
      {
        "$defs": {
          "def 0": true,
          "def 1": true,
          "def 2": true,
          "def 3": {
            "maximum": 9,
          },
          "def 4": true,
          "def 5": {
            "multipleOf": 2,
          },
        },
        "minimum": 5,
        "type": "number",
      }
    `)
  })
})

describe(createValidate, () => {
  it('returns the expected result', () => {
    const schema = {
      $defs: {
        'https://example.com/minimum4': {
          $defs: {
            multipleOf2: {
              $id: 'https://example.com/multipleOf2',
              multipleOf: 2,
            },
          },
          $id: 'https://example.com/minimum4',
          minimum: 4,
        },
        maximum9: {
          $id: 'https://example.com/maximum9',
          maximum: 9,
        },
      },
      allOf: [
        {
          $ref: 'https://example.com/minimum4',
        },
        {
          $ref: 'https://example.com/maximum9',
        },
        {
          $ref: 'https://example.com/multipleOf2',
        },
        {
          $id: 'https://example.com/multipleOf3',
          multipleOf: 3,
        },
      ],
    }

    const validate = createValidate([], [])

    expect(validate(schema, 6)).toBe(true)
    expect(validate({ ...schema }, 9)).toBe(false)
    expect(validate({ not: schema }, 6)).toBe(false)
    expect(validate({ not: schema }, 9)).toBe(true)
  })

  it(`works together with ${enhanceSchema.name}`, () => {
    const schema = {
      allOf: [
        { $ref: 'https://example.com/minimum4' },
        { $ref: 'https://example.com/maximum9' },
        { $ref: 'https://example.com/multipleOf2' },
        { $id: 'https://example.com/multipleOf3', multipleOf: 3 },
      ],
      $defs: {
        maximum9: { $id: 'https://example.com/maximum9', maximum: 9 },
      },
    }

    const definitions = [
      {
        $id: 'https://example.com/minimum4',
        minimum: 4,
        $defs: {
          multipleOf2: {
            $id: 'https://example.com/multipleOf2',
            multipleOf: 2,
          },
        },
      },
    ]

    const validate = createValidate([], definitions)

    expect(validate(schema, 6)).toBe(true)
    expect(validate(schema, 9)).toBe(false)
    expect(validate({ not: schema }, 6)).toBe(false)
    expect(validate({ not: schema }, 9)).toBe(true)
  })
})
