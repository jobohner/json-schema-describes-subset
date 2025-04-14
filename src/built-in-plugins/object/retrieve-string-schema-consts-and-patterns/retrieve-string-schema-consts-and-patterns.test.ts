import { describe, it, expect } from 'vitest'

import {
  retrieveStringSchemaConstsAndPatterns,
  retrieveStringSchemaConstsAndPatternsFromRawDNF,
} from './retrieve-string-schema-consts-and-patterns.js'
import { AnyOfSchema } from '../../../atomic-schema/index.js'
import { splitToRawDNF } from '../../../atomic-schema/split/index.js'
import { toInternalOptions } from '../../../options/options.js'

const options = toInternalOptions({})

describe(retrieveStringSchemaConstsAndPatternsFromRawDNF, () => {
  it('returns false on empty dnf anyOf (this actually should not be happening with a valid schema)', () => {
    expect(
      retrieveStringSchemaConstsAndPatternsFromRawDNF(
        new AnyOfSchema([]),
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "isStringWithConstsOrPatterns": false,
      }
    `)
  })
})

describe(retrieveStringSchemaConstsAndPatterns, () => {
  it('retrieves the correct consts from enum', () => {
    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: { enum: ['a', 'b', 'c'] },
        options,
        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "consts": [
          "a",
          "b",
          "c",
        ],
        "isStringWithConstsOrPatterns": true,
        "patterns": [],
      }
    `)
  })

  it('retrieves the correct patterns', () => {
    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: {
          type: 'string',
          anyOf: [{ pattern: 'a' }, { pattern: 'b' }],
        },
        options,
        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "consts": [],
        "isStringWithConstsOrPatterns": true,
        "patterns": [
          "a",
          "b",
        ],
      }
    `)
  })

  it('returns false on non strings', () => {
    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: {
          anyOf: [{ pattern: 'a' }, { pattern: 'b' }],
        },
        options,
        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "isStringWithConstsOrPatterns": false,
      }
    `)
  })

  it('returns false on boolean schemas', () => {
    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: true,
        options,
        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "isStringWithConstsOrPatterns": false,
      }
    `)

    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: false,
        options,
        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "isStringWithConstsOrPatterns": false,
      }
    `)
  })

  it('returns false on invalid const schemas', () => {
    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: {
          type: 'string',
          const: 'a',
          pattern: 'b',
        },
        options,
        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "isStringWithConstsOrPatterns": false,
      }
    `)
  })

  it('returns false on negated schemas', () => {
    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: {
          type: 'string',
          not: { const: 'a' },
        },
        options,
        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "isStringWithConstsOrPatterns": false,
      }
    `)

    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: {
          type: 'string',
          const: 'b',
          not: { const: 'a' },
        },
        options,
        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "consts": [
          "b",
        ],
        "isStringWithConstsOrPatterns": true,
        "patterns": [],
      }
    `)
  })

  it('returns false on unexpected schemas', () => {
    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: { type: 'string', minLength: 2 },
        options,

        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "isStringWithConstsOrPatterns": false,
      }
    `)
  })

  it('returns false on schemas without const or pattern', () => {
    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: { type: 'string' },
        options,
        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "isStringWithConstsOrPatterns": false,
      }
    `)
  })

  it('omits consts when represented by pattern', () => {
    expect(
      retrieveStringSchemaConstsAndPatterns({
        schema: {
          type: 'string',
          anyOf: [{ enum: ['a', 'b'] }, { pattern: 'c' }, { pattern: 'b' }],
        },
        options,
        splitToRawDNF,
      }),
    ).toMatchInlineSnapshot(`
      {
        "consts": [
          "a",
        ],
        "isStringWithConstsOrPatterns": true,
        "patterns": [
          "c",
          "b",
        ],
      }
    `)
  })
})
