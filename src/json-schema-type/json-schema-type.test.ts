import { describe, it, expect } from 'vitest'

import {
  filterJSONSchemaTypes,
  getOtherJSONSchemaTypes,
  isJSONSchemaType,
  type JSONSchemaType,
} from './json-schema-type.js'

describe(isJSONSchemaType, () => {
  it('returns the expected boolean result', () => {
    expect(isJSONSchemaType('null')).toBe(true)
    expect(isJSONSchemaType('number')).toBe(true)

    expect(isJSONSchemaType('invalid_test_value')).toBe(false)
    expect(isJSONSchemaType('integer')).toBe(false)
  })
})

describe(filterJSONSchemaTypes, () => {
  it('returns the expected unique elements', () => {
    expect(filterJSONSchemaTypes(['a', 'b', 'c'])).toMatchInlineSnapshot(`[]`)

    expect(filterJSONSchemaTypes(['a', 'b', 'c', 'null', 'number']))
      .toMatchInlineSnapshot(`
      [
        "null",
        "number",
      ]
    `)

    expect(
      filterJSONSchemaTypes([
        'a',
        'b',
        'c',
        'null',
        'd',
        'number',
        'boolean',
        'string',
        'e',
        'number',
        'null',
        'string',
        'f',
      ]),
    ).toMatchInlineSnapshot(`
      [
        "null",
        "number",
        "string",
        "boolean",
      ]
    `)
  })
})

describe(getOtherJSONSchemaTypes, () => {
  it('returns the expected unique elements', () => {
    expect(
      getOtherJSONSchemaTypes([
        'a' as JSONSchemaType,
        'b' as JSONSchemaType,
        'c' as JSONSchemaType,
      ]),
    ).toMatchInlineSnapshot(`
      [
        "null",
        "number",
        "string",
        "boolean",
        "array",
        "object",
      ]
    `)

    expect(
      getOtherJSONSchemaTypes([
        'a' as JSONSchemaType,
        'b' as JSONSchemaType,
        'c' as JSONSchemaType,
        'null',
        'number',
      ]),
    ).toMatchInlineSnapshot(`
      [
        "string",
        "boolean",
        "array",
        "object",
      ]
    `)

    expect(
      getOtherJSONSchemaTypes([
        'a' as JSONSchemaType,
        'b' as JSONSchemaType,
        'c' as JSONSchemaType,
        'null',
        'd' as JSONSchemaType,
        'number',
        'boolean',
        'string',
        'e' as JSONSchemaType,
        'number',
        'null',
        'string',
        'f' as JSONSchemaType,
      ]),
    ).toMatchInlineSnapshot(`
      [
        "array",
        "object",
      ]
    `)
  })
})
