import { describe, it, expect } from 'vitest'

import uniq from 'lodash/uniq.js'

import { schemaDescribesSubset } from './schema-describes-subset.js'

import type {
  ExtractionPlugin,
  SimplificationPlugin,
  SimplificationPluginArguments,
} from '../plugin/index.js'
import {
  AllOfSchema,
  AnyOfSchema,
  AtomicSchemaObject,
  NotSchema,
  type LogicalCombinationOfLiterals,
} from '../atomic-schema/atomic-schema.js'
import { TypeAtomicSchema } from '../built-in-plugins/type.js'
import type { Options } from '../options/index.js'
// import { createDefaultValidate } from '../validate/validate.js'

describe(schemaDescribesSubset, () => {
  it('works with boolean schemas', () => {
    expect(schemaDescribesSubset(false, true)).toBe(true)
    expect(schemaDescribesSubset(true, false)).toBe(false)
    expect(schemaDescribesSubset(false, false)).toBe(true)
    expect(schemaDescribesSubset(true, true)).toBe(true)

    expect(schemaDescribesSubset({ type: 'string' }, true)).toBe(true)
    expect(schemaDescribesSubset(true, { type: 'number' })).toBe(false)
    expect(schemaDescribesSubset(false, { type: 'null' })).toBe(true)
  })

  it('works with empty schemas', () => {
    expect(schemaDescribesSubset(false, {})).toBe(true)
    expect(schemaDescribesSubset({}, false)).toBe(false)
    expect(schemaDescribesSubset(false, false)).toBe(true)
    expect(schemaDescribesSubset({}, {})).toBe(true)

    expect(schemaDescribesSubset({ type: 'string' }, {})).toBe(true)
    expect(
      schemaDescribesSubset(
        {
          type: 'string',
          $schema: 'https://json-schema.org/draft/2020-12/schema',
        },
        {},
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
        },
        { type: 'number' },
      ),
    ).toBe(false)

    expect(schemaDescribesSubset({}, {})).toBe(true)
    expect(
      schemaDescribesSubset(
        {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
        },
        {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
        },
      ),
    ).toBe(true)
  })

  it('works with custom plugin that applies to multiple types', () => {
    /* the custom keyword charCount has no use case and is intended
     * to use for testing only */

    class CharCountAtomicSchema extends AtomicSchemaObject {
      constructor(public readonly charCount: number) {
        super()
      }

      toJSONSchema(): { charCount: number } {
        return { charCount: this.charCount }
      }

      negate(): LogicalCombinationOfLiterals {
        return new AllOfSchema([
          new NotSchema(this),
          /* actually redundant, but makes checking for contradictions easier */
          new AnyOfSchema([
            new TypeAtomicSchema('string'),
            new TypeAtomicSchema('boolean'),
          ]),
        ])
      }
    }

    const charCountExtraction: ExtractionPlugin = {
      extract: ({ schema }) => {
        const { charCount } = schema as typeof schema & { charCount: unknown }
        if (typeof charCount === 'number') {
          return new CharCountAtomicSchema(charCount)
        }
        return true
      },
    }

    const charCountSimplification = {
      appliesToJSONSchemaType: ['string', 'boolean'],
      mergeableKeywords: [],
      simplify({
        atomicSchemasByConstructor,
        negatedAtomicSchemasByConstructor,
      }: SimplificationPluginArguments): boolean {
        const charCountValues = uniq(
          atomicSchemasByConstructor
            .get(CharCountAtomicSchema)
            .map(({ charCount }) => charCount),
        )

        if (charCountValues.length > 1) {
          return false
        }

        const [charCount] = charCountValues

        if (
          charCount !== undefined &&
          negatedAtomicSchemasByConstructor
            .get(CharCountAtomicSchema)
            .some((schema) => charCount === schema.charCount)
        ) {
          return false
        }

        return true
      },
    } as const satisfies SimplificationPlugin

    const optionsWithCharCountPlugin: Options = {
      plugins: [[charCountExtraction, charCountSimplification]],
    }

    expect(
      schemaDescribesSubset({ charCount: 5 }, {}, optionsWithCharCountPlugin),
    ).toBe(true)

    expect(
      schemaDescribesSubset({}, { charCount: 5 }, optionsWithCharCountPlugin),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { charCount: 5 },
        { charCount: 5 },
        optionsWithCharCountPlugin,
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { charCount: 5, type: 'string' },
        { charCount: 5, type: ['string', 'boolean'] },
        optionsWithCharCountPlugin,
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { type: 'number' },
        { charCount: 5, type: 'number' },
        optionsWithCharCountPlugin,
      ),
    ).toBe(true)
  })

  it('works with unspecified custom keyword', () => {
    expect(schemaDescribesSubset({}, { abc: 5 })).toBe(true)
  })

  it('works with standard keyword', () => {
    expect(schemaDescribesSubset({}, { minimum: 5 })).toBe(null)
    expect(schemaDescribesSubset({ minimum: 5 }, {})).toBe(true)
  })

  it('compares base uris', () => {
    expect(
      schemaDescribesSubset(true, false, {
        baseURI: ['https://example.com', 'https://example.com'],
      }),
    ).toBe(
      // same ids => assume subset
      true,
    )

    expect(
      schemaDescribesSubset({ $id: 'https://example.com' }, false, {
        baseURI: [null, 'https://example.com'],
      }),
    ).toBe(
      // same ids => assume subset
      true,
    )

    expect(
      schemaDescribesSubset(true, false, {
        baseURI: ['https://example.com', 'https://example.com#'],
      }),
    ).toBe(
      // same ids => assume subset
      true,
    )

    expect(
      schemaDescribesSubset(true, false, {
        baseURI: ['https://example.com', 'https://example.com#/'],
      }),
    ).toBe(
      // same ids => assume subset
      true,
    )

    expect(
      schemaDescribesSubset(false, true, {
        baseURI: ['https://example.com', 'https://example.com/a'],
      }),
    ).toBe(
      // different ids can still be a subset
      true,
    )
  })

  it('works with definitions', () => {
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

    const options: Options = { definitions }

    const schema = {
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
    }

    expect(schemaDescribesSubset({ const: 6 }, schema, options)).toBe(true)
    expect(schemaDescribesSubset({ const: 6 }, { not: schema }, options)).toBe(
      false,
    )
    expect(
      schemaDescribesSubset({ const: 6 }, { allOf: [schema] }, options),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { const: 6 },
        { $ref: 'https://example.com/maximum9' },
        { definitions: [...definitions, schema] },
      ),
    ).toBe(true)

    expect(schemaDescribesSubset({ const: 2 }, schema, options)).toBe(false)
    expect(
      schemaDescribesSubset({ const: 2 }, { allOf: [schema] }, options),
    ).toBe(false)
    expect(schemaDescribesSubset({ const: 2 }, { not: schema }, options)).toBe(
      true,
    )

    expect(schemaDescribesSubset({ const: 7 }, schema, options)).toBe(false)
    expect(
      schemaDescribesSubset({ const: 7 }, { allOf: [schema] }, options),
    ).toBe(false)
    expect(schemaDescribesSubset({ const: 7 }, { not: schema }, options)).toBe(
      true,
    )

    expect(schemaDescribesSubset({ const: 12 }, schema, options)).toBe(false)
    expect(
      schemaDescribesSubset({ const: 12 }, { allOf: [schema] }, options),
    ).toBe(false)
    expect(schemaDescribesSubset({ const: 12 }, { not: schema }, options)).toBe(
      true,
    )
  })
})
