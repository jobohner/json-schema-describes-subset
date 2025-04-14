import type { JSONSchema } from '../json-schema/index.js'
import { describe, it, expect } from 'vitest'

import { constExtraction } from './const.js'
import { schemaDescribesSubset } from '../schema-describes-subset/schema-describes-subset.js'
import { split as splitWithOptions } from '../atomic-schema/split/index.js'
import { toInternalOptions } from '../options/options.js'
import type { ExtractFunctionArguments } from '../plugin/plugin.js'

const options = toInternalOptions({})
const split: ExtractFunctionArguments['split'] = (schema) =>
  splitWithOptions({ schema, options })
const toArgs = (schema: JSONSchema & object): ExtractFunctionArguments => ({
  schema,
  split,
})

describe(constExtraction.extract, () => {
  it('extracts consts', () => {
    expect(constExtraction.extract(toArgs({ const: 0 })))
      .toMatchInlineSnapshot(`
      ConstAtomicSchema {
        "const": 0,
      }
    `)
    expect(constExtraction.extract(toArgs({ const: '' })))
      .toMatchInlineSnapshot(`
      ConstAtomicSchema {
        "const": "",
      }
    `)
    expect(
      constExtraction.extract(toArgs({ const: false, enum: [false, true] })),
    ).toMatchInlineSnapshot(`
      ConstAtomicSchema {
        "const": false,
      }
    `)
    expect(constExtraction.extract(toArgs({ const: [0] })))
      .toMatchInlineSnapshot(`
      ConstAtomicSchema {
        "const": [
          0,
        ],
      }
    `)
  })

  it('extracts enums', () => {
    expect(
      constExtraction.extract(toArgs({ enum: [0, 1, 2, '', false, [], null] })),
    ).toMatchInlineSnapshot(`
      AnyOfSchema {
        "anyOf": [
          ConstAtomicSchema {
            "const": 0,
          },
          ConstAtomicSchema {
            "const": 1,
          },
          ConstAtomicSchema {
            "const": 2,
          },
          ConstAtomicSchema {
            "const": "",
          },
          ConstAtomicSchema {
            "const": false,
          },
          ConstAtomicSchema {
            "const": [],
          },
          ConstAtomicSchema {
            "const": null,
          },
        ],
      }
    `)
  })

  it('extracts false if enums and const contradicts', () => {
    expect(constExtraction.extract(toArgs({ const: 0, enum: [1, 2] }))).toBe(
      false,
    )
  })
})

describe(`${schemaDescribesSubset.name} using const plugin`, () => {
  it('works with const schemas', () => {
    expect(schemaDescribesSubset({ type: 'number' }, { const: 5 })).toBe(null)
    expect(schemaDescribesSubset({ const: 5 }, { type: 'number' })).toBe(true)
    expect(
      schemaDescribesSubset(
        { anyOf: [{ const: 5 }, { const: 8 }] },
        { type: 'number' },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { const: 8 },
        { anyOf: [{ const: 5 }, { const: 8 }] },
      ),
    ).toBe(true)
    expect(schemaDescribesSubset({ const: 5 }, { type: 'string' })).toBe(false)
    expect(
      schemaDescribesSubset(
        { anyOf: [{ const: 5 }, { const: 8 }] },
        { const: 5 },
      ),
    ).toBe(false)
  })

  it('works with enums', () => {
    expect(schemaDescribesSubset({ const: 5 }, { enum: [5, 6, 7] })).toBe(true)
    expect(schemaDescribesSubset({ const: 4 }, { enum: [5, 6, 7] })).toBe(false)
    expect(schemaDescribesSubset({ enum: [5, 6] }, { enum: [5, 6, 7] })).toBe(
      true,
    )
    expect(schemaDescribesSubset({ enum: [4, 5] }, { enum: [5, 6, 7] })).toBe(
      false,
    )
    expect(
      schemaDescribesSubset({ enum: [4, 5], const: 5 }, { enum: [5, 6, 7] }),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { enum: [4, 5] },
        { anyOf: [{ enum: [5, 6, 7] }, { enum: [2, 3, 4] }] },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ enum: [4, 5], const: 3 }, { const: 6 }),
    ).toBe(true)
  })
})
