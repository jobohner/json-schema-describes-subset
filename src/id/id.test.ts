import { describe, it, expect } from 'vitest'

import { type JSONSchema } from '../json-schema/index.js'
import {
  normalizeURI,
  resolveSchemaIdValue,
  resolveSchemaArgumentsIds,
  createSchemaCloneWithNonRelativeIdsAndRefs,
} from './id.js'
import { schemaDescribesSubset } from '../schema-describes-subset/index.js'

describe(normalizeURI, () => {
  it('works with undefined', () => {
    expect(normalizeURI(undefined)).toBe(undefined)
  })

  it('returns the normalized id', () => {
    expect(
      normalizeURI('https://example.com/main-schema'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema"`)

    expect(
      normalizeURI('https://example.com/main-schema/'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema/"`)

    expect(
      normalizeURI('https://example.com/main-schema#'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema"`)

    expect(
      normalizeURI('https://example.com/main-schema/#'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema/"`)

    expect(
      normalizeURI('https://example.com/main-schema#./path'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema#./path"`)

    expect(
      normalizeURI('https://example.com/main-schema/#./path'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema/#./path"`)

    expect(
      normalizeURI('https://example.com/main-schema#/'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema"`)

    expect(
      normalizeURI('https://example.com/main-schema/#/'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema/"`)

    expect(
      normalizeURI('https://example.com/main-schema#/./path'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema#/./path"`)

    expect(
      normalizeURI('https://example.com/main-schema/#/./path'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema/#/./path"`)
  })

  it('works with urns', () => {
    expect(normalizeURI('urn:example:vehicle')).toMatchInlineSnapshot(
      `"urn:example:vehicle"`,
    )

    expect(normalizeURI('urn:example:vehicle#')).toMatchInlineSnapshot(
      `"urn:example:vehicle"`,
    )

    expect(normalizeURI('urn:example:vehicle#/')).toMatchInlineSnapshot(
      `"urn:example:vehicle"`,
    )

    expect(normalizeURI('urn:example:vehicle#./path')).toMatchInlineSnapshot(
      `"urn:example:vehicle#./path"`,
    )
  })
})

describe(resolveSchemaIdValue, () => {
  it('works with undefined $id', () => {
    expect(resolveSchemaIdValue(undefined, undefined)).toBe(undefined)
    expect(
      resolveSchemaIdValue('https://example.com/main-schema', undefined),
    ).toBe('https://example.com/main-schema')
    expect(
      resolveSchemaIdValue(undefined, 'https://example.com/main-schema'),
    ).toBe('https://example.com/main-schema')
  })

  it('works with urns and tags', () => {
    expect(
      resolveSchemaIdValue(
        'https://example.com/main-schema',
        'urn:example:vehicle',
      ),
    ).toBe('urn:example:vehicle')
    expect(
      resolveSchemaIdValue(
        'https://example.com/main-schema',
        'tag:example.com,2024:schemas/person',
      ),
    ).toBe('tag:example.com,2024:schemas/person')
  })

  it('returns the expected uri', () => {
    expect(
      resolveSchemaIdValue(
        'https://example.com/main-schema',
        'https://example.com/other-schema/a',
      ),
    ).toBe('https://example.com/other-schema/a')

    expect(
      resolveSchemaIdValue('https://example.com/main-schema/x/y/z', 'a'),
    ).toBe('https://example.com/main-schema/x/y/a')

    expect(
      resolveSchemaIdValue('https://example.com/main-schema/x/y/z', './a'),
    ).toBe('https://example.com/main-schema/x/y/a')

    expect(
      resolveSchemaIdValue('https://example.com/main-schema/x/y/z', '../a'),
    ).toBe('https://example.com/main-schema/x/a')

    expect(
      resolveSchemaIdValue('https://example.com/main-schema/x/y/z', '/a'),
    ).toBe('https://example.com/a')

    expect(resolveSchemaIdValue('example.com/main-schema/x/y/z', '/a')).toBe(
      undefined,
    )

    expect(resolveSchemaIdValue('urn:example:vehicle', '/a')).toBe(undefined)

    expect(
      resolveSchemaIdValue(
        'urn:example:vehicle',
        'https://example.com/other-schema/a',
      ),
    ).toBe('https://example.com/other-schema/a')

    expect(resolveSchemaIdValue('', '/a')).toBe(undefined)

    expect(
      resolveSchemaIdValue('https://example.com/main-schema/x/y/z', '../a/b'),
    ).toBe('https://example.com/main-schema/x/a/b')

    expect(
      resolveSchemaIdValue(
        'https://example.com/main-schema/x/y/z',
        '../a/b#fragment',
      ),
    ).toBe('https://example.com/main-schema/x/a/b#fragment')

    expect(
      resolveSchemaIdValue(
        'https://example.com/main-schema/x/y/z',
        '#fragment',
      ),
    ).toBe('https://example.com/main-schema/x/y/z#fragment')

    expect(
      resolveSchemaIdValue(
        'https://example.com/main-schema/x/y/z',
        '#fragment/a/b',
      ),
    ).toBe('https://example.com/main-schema/x/y/z#fragment/a/b')

    expect(
      resolveSchemaIdValue(
        'https://example.com/main-schema/x/y/z#otherfragment',
        '#fragment/a/b',
      ),
    ).toBe('https://example.com/main-schema/x/y/z#fragment/a/b')

    expect(
      resolveSchemaIdValue(
        'https://example.com/main-schema/x/y/z#otherfragment/u/v',
        '#fragment/a/b',
      ),
    ).toBe('https://example.com/main-schema/x/y/z#fragment/a/b')
  })

  it('works with empty fragment', () => {
    expect(
      resolveSchemaIdValue('https://example.com/main-schema/x/y/z', '../a/b#'),
    ).toMatchInlineSnapshot(`"https://example.com/main-schema/x/a/b"`)
  })

  it('returns undefined on invalid baseURI', () => {
    expect(resolveSchemaIdValue('x/y/z', '../a/b#')).toMatchInlineSnapshot(
      `undefined`,
    )

    expect(resolveSchemaIdValue('x/y/z', undefined)).toMatchInlineSnapshot(
      `undefined`,
    )
  })
})

describe(resolveSchemaArgumentsIds, () => {
  it('works with empty schemas and options', () => {
    expect(resolveSchemaArgumentsIds([{}, {}], {})).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            {},
            {},
          ],
        },
        "schemas": [
          {},
          {},
        ],
      }
    `)

    expect(resolveSchemaArgumentsIds([], undefined)).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [],
        },
        "schemas": [],
      }
    `)

    expect(resolveSchemaArgumentsIds([{}], undefined)).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            {},
          ],
        },
        "schemas": [
          {},
        ],
      }
    `)

    expect(resolveSchemaArgumentsIds([{}, {}], undefined))
      .toMatchInlineSnapshot(`
        {
          "options": {
            "baseURI": undefined,
            "definitions": [
              {},
              {},
            ],
          },
          "schemas": [
            {},
            {},
          ],
        }
      `)

    expect(resolveSchemaArgumentsIds([{}, {}, {}], undefined))
      .toMatchInlineSnapshot(`
        {
          "options": {
            "baseURI": undefined,
            "definitions": [
              {},
              {},
              {},
            ],
          },
          "schemas": [
            {},
            {},
            {},
          ],
        }
      `)
  })

  it('works with boolean schemas without baseURI', () => {
    expect(resolveSchemaArgumentsIds([true, false], {})).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            true,
            false,
          ],
        },
        "schemas": [
          true,
          false,
        ],
      }
    `)
  })

  it('works with boolean schemas with single baseURI', () => {
    expect(
      resolveSchemaArgumentsIds([true, false], {
        baseURI: 'https://example.com/main-schema',
      }),
    ).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            {
              "$id": "https://example.com/main-schema",
              "allOf": [
                true,
              ],
            },
            false,
          ],
        },
        "schemas": [
          {
            "allOf": [
              true,
            ],
          },
          false,
        ],
      }
    `)

    expect(
      resolveSchemaArgumentsIds([true, false], {
        baseURI: ['https://example.com/main-schema'],
      }),
    ).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            {
              "$id": "https://example.com/main-schema",
              "allOf": [
                true,
              ],
            },
            false,
          ],
        },
        "schemas": [
          {
            "allOf": [
              true,
            ],
          },
          false,
        ],
      }
    `)

    expect(
      resolveSchemaArgumentsIds([true, false], {
        baseURI: [null, 'https://example.com/main-schema'],
      }),
    ).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            true,
            {
              "$id": "https://example.com/main-schema",
              "allOf": [
                false,
              ],
            },
          ],
        },
        "schemas": [
          true,
          {
            "allOf": [
              false,
            ],
          },
        ],
      }
    `)
  })

  it('works with boolean schemas with multiple baseURIs', () => {
    expect(
      resolveSchemaArgumentsIds([true, false], {
        baseURI: [
          'https://example.com/schema-a',
          'https://example.com/schema-b',
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            {
              "$id": "https://example.com/schema-a",
              "allOf": [
                true,
              ],
            },
            {
              "$id": "https://example.com/schema-b",
              "allOf": [
                false,
              ],
            },
          ],
        },
        "schemas": [
          {
            "allOf": [
              true,
            ],
          },
          {
            "allOf": [
              false,
            ],
          },
        ],
      }
    `)
  })

  it('works with object schemas without baseURI', () => {
    expect(resolveSchemaArgumentsIds([{ $id: 'a' }, { $id: 'b' }, {}], {}))
      .toMatchInlineSnapshot(`
        {
          "options": {
            "baseURI": undefined,
            "definitions": [
              {},
              {},
              {},
            ],
          },
          "schemas": [
            {},
            {},
            {},
          ],
        }
      `)
  })

  it('works with object schemas with single baseURI', () => {
    expect(
      resolveSchemaArgumentsIds([{ $id: 'a' }, { $id: 'b' }, {}], {
        baseURI: 'https://example.com/main-schema',
      }),
    ).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            {
              "$id": "https://example.com/a",
            },
            {},
            {},
          ],
        },
        "schemas": [
          {},
          {},
          {},
        ],
      }
    `)

    expect(
      resolveSchemaArgumentsIds([{ $id: 'a' }, { $id: 'b' }, {}], {
        baseURI: ['https://example.com/main-schema'],
      }),
    ).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            {
              "$id": "https://example.com/a",
            },
            {},
            {},
          ],
        },
        "schemas": [
          {},
          {},
          {},
        ],
      }
    `)

    expect(
      resolveSchemaArgumentsIds([{ $id: 'a' }, { $id: 'b' }, {}], {
        baseURI: [null, 'https://example.com/main-schema'],
      }),
    ).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            {},
            {
              "$id": "https://example.com/b",
            },
            {},
          ],
        },
        "schemas": [
          {},
          {},
          {},
        ],
      }
    `)

    expect(
      resolveSchemaArgumentsIds([{ $id: 'a' }, { $id: 'b' }, {}], {
        baseURI: [null, null, 'https://example.com/main-schema'],
      }),
    ).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            {},
            {},
            {
              "$id": "https://example.com/main-schema",
            },
          ],
        },
        "schemas": [
          {},
          {},
          {},
        ],
      }
    `)
  })

  it('works with object schemas with multiple baseURIs', () => {
    expect(
      resolveSchemaArgumentsIds([{ $id: 'a' }, { $id: 'b' }, {}], {
        baseURI: [
          'https://example.com/schema-a',
          'https://example.com/schema-b',
          'https://example.com/schema-c',
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "options": {
          "baseURI": undefined,
          "definitions": [
            {
              "$id": "https://example.com/a",
            },
            {
              "$id": "https://example.com/b",
            },
            {
              "$id": "https://example.com/schema-c",
            },
          ],
        },
        "schemas": [
          {},
          {},
          {},
        ],
      }
    `)
  })

  it(`ignores baseURI if there wouldn't be a valid resulting $id`, () => {
    expect(resolveSchemaArgumentsIds([{ $id: 'abcdef' }], { baseURI: ' ' }))
      .toMatchInlineSnapshot(`
        {
          "options": {
            "baseURI": undefined,
            "definitions": [
              {},
            ],
          },
          "schemas": [
            {},
          ],
        }
      `)
  })
})

describe(createSchemaCloneWithNonRelativeIdsAndRefs, () => {
  it('returns an equal schema if there are no relative `$id`s or refs', () => {
    const schema = {
      allOf: [
        { $id: 'https://example.com/', minimum: 5 },
        { $id: 'https://example.com/a', $ref: 'https://example.com/' },
      ],
    } as const

    const processedClone = createSchemaCloneWithNonRelativeIdsAndRefs(
      schema,
      undefined,
      new Set(),
    )

    expect(processedClone.schema).toEqual(schema)
    expect((processedClone.schema as JSONSchema & object).allOf).not.toBe(
      schema.allOf,
    )
  })

  it('returns the expected cloned schema without baseURI', () => {
    const schema = {
      $id: 'https://example.com',
      not: {
        $id: 'x',
        not: {
          $id: 'y/z',
          anyOf: [
            { $ref: 'https://example.com' },
            { $ref: 'https://example.com/a' },
            { $ref: 'b' },
            { $ref: '/c' },
            { $ref: './d' },
          ],
        },
      },
    }

    const processedClone = createSchemaCloneWithNonRelativeIdsAndRefs(
      schema,
      undefined,
      new Set(),
    )

    expect(processedClone).toMatchInlineSnapshot(`
      {
        "ids": Set {
          "https://example.com/",
          "https://example.com/x",
          "https://example.com/y/z",
        },
        "schema": {
          "$id": "https://example.com/",
          "not": {
            "$id": "https://example.com/x",
            "not": {
              "$id": "https://example.com/y/z",
              "anyOf": [
                {
                  "$ref": "https://example.com/",
                },
                {
                  "$ref": "https://example.com/a",
                },
                {
                  "$ref": "https://example.com/y/b",
                },
                {
                  "$ref": "https://example.com/c",
                },
                {
                  "$ref": "https://example.com/y/d",
                },
              ],
            },
          },
        },
      }
    `)
  })

  it('returns the expected cloned schema using a baseURI', () => {
    const schema = {
      not: {
        $id: 'x',
        not: {
          $id: 'y/z',
          anyOf: [
            { $ref: 'https://example.com' },
            { $ref: 'https://example.com/a' },
            { $ref: 'b' },
            { $ref: '/c' },
            { $ref: './d' },
          ],
        },
      },
    }

    const processedClone = createSchemaCloneWithNonRelativeIdsAndRefs(
      schema,
      'https://example.com',
      new Set(),
    )

    expect(processedClone).toMatchInlineSnapshot(`
      {
        "ids": Set {
          "https://example.com/",
          "https://example.com/x",
          "https://example.com/y/z",
        },
        "schema": {
          "$id": "https://example.com/",
          "not": {
            "$id": "https://example.com/x",
            "not": {
              "$id": "https://example.com/y/z",
              "anyOf": [
                {
                  "$ref": "https://example.com/",
                },
                {
                  "$ref": "https://example.com/a",
                },
                {
                  "$ref": "https://example.com/y/b",
                },
                {
                  "$ref": "https://example.com/c",
                },
                {
                  "$ref": "https://example.com/y/d",
                },
              ],
            },
          },
        },
      }
    `)
  })

  it('removes incomplete URIs and leaves incomplete refs is', () => {
    const schema = {
      not: {
        $id: 'x',
        not: {
          $id: 'y/z',
          anyOf: [
            { $ref: 'https://example.com' },
            { $ref: 'https://example.com/a' },
            { $ref: 'b' },
            { $ref: '/c' },
            { $id: 'https://example.com', $ref: './d' },
          ],
        },
      },
    }

    const processedClone = createSchemaCloneWithNonRelativeIdsAndRefs(
      schema,
      undefined,
      new Set(),
    )

    expect(processedClone).toMatchInlineSnapshot(`
      {
        "ids": Set {
          "https://example.com/",
        },
        "schema": {
          "not": {
            "not": {
              "anyOf": [
                {
                  "$ref": "https://example.com/",
                },
                {
                  "$ref": "https://example.com/a",
                },
                {
                  "$ref": "b",
                },
                {
                  "$ref": "/c",
                },
                {
                  "$id": "https://example.com/",
                  "$ref": "https://example.com/d",
                },
              ],
            },
          },
        },
      }
    `)
  })

  it('creates root $id from baseURI', () => {
    const schema = {
      not: {
        not: {
          $id: 'y/z',
          $ref: './d',
        },
      },
    }

    const processedClone = createSchemaCloneWithNonRelativeIdsAndRefs(
      schema,
      'https://example.com',
      new Set(),
    )

    expect(processedClone).toMatchInlineSnapshot(`
      {
        "ids": Set {
          "https://example.com/",
          "https://example.com/y/z",
        },
        "schema": {
          "$id": "https://example.com/",
          "not": {
            "not": {
              "$id": "https://example.com/y/z",
              "$ref": "https://example.com/y/d",
            },
          },
        },
      }
    `)
  })
})

describe(schemaDescribesSubset, () => {
  it('works with schemas that include the same $id', () => {
    expect(
      schemaDescribesSubset(
        {
          const: 3,
          $defs: {
            multipleOf3: {
              $id: 'https://example.com/multipleOf3',
              multipleOf: 3,
            },
          },
        },
        {
          $ref: 'https://example.com/multipleOf3',
          $defs: {
            multipleOf3: {
              $id: 'https://example.com/multipleOf3',
              /* this is assumed to be the same as the schema with the same
               * `$id` in the first schema and therefore is ignored */
              multipleOf: 7,
            },
          },
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          const: 7,
          $defs: {
            multipleOf3: {
              $id: 'https://example.com/multipleOf3',
              multipleOf: 3,
            },
          },
        },
        {
          $ref: 'https://example.com/multipleOf3',
          $defs: {
            multipleOf3: {
              $id: 'https://example.com/multipleOf3',
              /* this is assumed to be the same as the schema with the same
               * `$id` in the first schema and therefore is ignored */
              multipleOf: 7,
            },
          },
        },
      ),
    ).toBe(false)
  })
})
