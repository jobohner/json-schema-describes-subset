import { describe, it, expect } from 'vitest'

import { splitToRawDNF } from './split.js'
import { toInternalOptions } from '../../options/options.js'

const options = toInternalOptions({})

describe(splitToRawDNF, () => {
  it('works with empty schemas', () => {
    expect(splitToRawDNF({}, options)).toMatchInlineSnapshot(`
      AnyOfSchema {
        "anyOf": [
          AllOfSchema {
            "allOf": [
              true,
            ],
          },
        ],
      }
    `)
  })
})
