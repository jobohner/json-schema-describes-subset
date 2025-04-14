import { describe, it, expect } from 'vitest'

import { AllOfSchema, AnyOfSchema, NotSchema } from '../atomic-schema.js'

import { toRawDNF } from './to-raw-dnf.js'
import { ConstAtomicSchema } from '../../built-in-plugins/const.js'

describe(toRawDNF, () => {
  it('works with example 1', () => {
    /*
     * !(A & !B) & (!C | D) =
     * (!A | B) & (!C | D) =
     * (!A & (!C | D)) | (B & (!C | D)) =
     * (!A & !C) | (!A & D) | (B & !C) | (B & D)
     */
    expect(
      toRawDNF(
        new AllOfSchema([
          new NotSchema(
            new AllOfSchema([
              new ConstAtomicSchema('A'),
              new NotSchema(new ConstAtomicSchema('B')),
            ]),
          ),
          new AnyOfSchema([
            new NotSchema(new ConstAtomicSchema('C')),
            new ConstAtomicSchema('D'),
          ]),
        ]),
      ),
    ).toMatchInlineSnapshot(`
      AnyOfSchema {
        "anyOf": [
          AllOfSchema {
            "allOf": [
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "C",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "A",
                },
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "C",
                },
              },
              ConstAtomicSchema {
                "const": "B",
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "D",
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "A",
                },
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "D",
              },
              ConstAtomicSchema {
                "const": "B",
              },
            ],
          },
        ],
      }
    `)
  })

  it('works with example 2', () => {
    /*
     * !(A!BC)(!D | E | F)!(G | H | !I) =
     * (!A | B | !C)(!D | E | F)!G!HI =
     * (!A | B | !C)(!D!G!HI | E!G!HI | F!G!HI) =
     * !A(!D!G!HI | E!G!HI | F!G!HI) | B(!D!G!HI | E!G!HI | F!G!HI) | !C(!D!G!HI | E!G!HI | F!G!HI) =
     * !A!D!G!HI | !AE!G!HI | !AF!G!HI | B!D!G!HI | BE!G!HI | BF!G!HI | !C!D!G!HI | !CE!G!HI | !CF!G!HI
     */
    expect(
      toRawDNF(
        new AllOfSchema(
          /* !(A!BC) */
          [
            new NotSchema(
              /* (A!BC) */
              new AllOfSchema([
                new ConstAtomicSchema('A'),
                new NotSchema(new ConstAtomicSchema('B')),
                new ConstAtomicSchema('C'),
              ]),
            ),
            /* (!D | E | F) */
            new AnyOfSchema([
              new NotSchema(new ConstAtomicSchema('D')),
              new ConstAtomicSchema('E'),
              new ConstAtomicSchema('F'),
            ]),
            /* !(G | H | !I) */
            new NotSchema(
              new AnyOfSchema([
                new ConstAtomicSchema('G'),
                new ConstAtomicSchema('H'),
                new NotSchema(new ConstAtomicSchema('I')),
              ]),
            ),
          ],
        ),
      ),
    ).toMatchInlineSnapshot(`
      AnyOfSchema {
        "anyOf": [
          AllOfSchema {
            "allOf": [
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "D",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "A",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "G",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "H",
                },
              },
              ConstAtomicSchema {
                "const": "I",
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "D",
                },
              },
              ConstAtomicSchema {
                "const": "B",
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "G",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "H",
                },
              },
              ConstAtomicSchema {
                "const": "I",
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "D",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "C",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "G",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "H",
                },
              },
              ConstAtomicSchema {
                "const": "I",
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "E",
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "A",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "G",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "H",
                },
              },
              ConstAtomicSchema {
                "const": "I",
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "E",
              },
              ConstAtomicSchema {
                "const": "B",
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "G",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "H",
                },
              },
              ConstAtomicSchema {
                "const": "I",
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "E",
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "C",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "G",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "H",
                },
              },
              ConstAtomicSchema {
                "const": "I",
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "F",
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "A",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "G",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "H",
                },
              },
              ConstAtomicSchema {
                "const": "I",
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "F",
              },
              ConstAtomicSchema {
                "const": "B",
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "G",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "H",
                },
              },
              ConstAtomicSchema {
                "const": "I",
              },
            ],
          },
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "F",
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "C",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "G",
                },
              },
              NotSchema {
                "not": ConstAtomicSchema {
                  "const": "H",
                },
              },
              ConstAtomicSchema {
                "const": "I",
              },
            ],
          },
        ],
      }
    `)
  })

  it('works with nested anyOf', () => {
    expect(
      toRawDNF(
        new AnyOfSchema([new AnyOfSchema([new ConstAtomicSchema('A')])]),
      ),
    ).toMatchInlineSnapshot(`
      AnyOfSchema {
        "anyOf": [
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "A",
              },
            ],
          },
        ],
      }
    `)
  })

  it('works with allOf within anyOf', () => {
    expect(
      toRawDNF(
        new AnyOfSchema([
          new AllOfSchema([new AllOfSchema([new ConstAtomicSchema('A')])]),
        ]),
      ),
    ).toMatchInlineSnapshot(`
      AnyOfSchema {
        "anyOf": [
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "A",
              },
            ],
          },
        ],
      }
    `)
  })

  it('works with anyOf within allOf', () => {
    expect(
      toRawDNF(
        new AllOfSchema([new AnyOfSchema([new ConstAtomicSchema('A')])]),
      ),
    ).toMatchInlineSnapshot(`
      AnyOfSchema {
        "anyOf": [
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "A",
              },
            ],
          },
        ],
      }
    `)
  })

  it('works with nested allOf', () => {
    expect(
      toRawDNF(
        new AllOfSchema([
          new AllOfSchema([new AllOfSchema([new ConstAtomicSchema('A')])]),
        ]),
      ),
    ).toMatchInlineSnapshot(`
      AnyOfSchema {
        "anyOf": [
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": "A",
              },
            ],
          },
        ],
      }
    `)
  })
})
