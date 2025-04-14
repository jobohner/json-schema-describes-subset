import { describe, it, expect } from 'vitest'

import { AnyOfSchema, toJSONSchema } from './atomic-schema.js'
import { ConstAtomicSchema } from '../built-in-plugins/const.js'

describe(toJSONSchema, () => {
  it('creates the correct json schema', () => {
    expect(
      toJSONSchema(
        new AnyOfSchema([
          new ConstAtomicSchema(5),
          new ConstAtomicSchema('hello'),
        ]),
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "const": 5,
          },
          {
            "const": "hello",
          },
        ],
      }
    `)

    expect(toJSONSchema(true)).toBe(true)
    expect(toJSONSchema(false)).toBe(false)
  })
})
