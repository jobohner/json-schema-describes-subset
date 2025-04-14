import type { JSONSchema } from '../src/json-schema/index.js'

import { describe, it, expect } from 'vitest'

import { schemasAreEquivalent } from '../src/derived/index.js'

describe(schemasAreEquivalent, () => {
  const schema: JSONSchema = {
    properties: {
      a: { type: 'number' },
      b: false,
      c: { minimum: 7 },
      x: {
        properties: {
          a: { multipleOf: 2 },
          b: { type: ['string', 'number'] },
          x: {
            minProperties: 8,
            properties: {
              a: { type: 'boolean' },
              b: true,
              x: {
                properties: {
                  a: { multipleOf: 2 },
                  b: { type: ['string', 'number'] },
                  x: {
                    minProperties: 8,
                    properties: {
                      a: { type: 'boolean' },
                      b: true,
                      x: {
                        properties: {
                          a: { multipleOf: 2 },
                          b: { type: ['string', 'number'] },
                          x: {
                            minProperties: 8,
                            properties: {
                              a: { type: 'boolean' },
                              b: true,
                              x: {
                                properties: {
                                  a: { multipleOf: 2 },
                                  b: { type: ['string', 'number'] },
                                  x: {
                                    minProperties: 8,
                                    properties: {
                                      a: { type: 'boolean' },
                                      b: true,
                                      x: {
                                        properties: {
                                          a: { multipleOf: 2 },
                                          b: { type: ['string', 'number'] },
                                          x: {
                                            minProperties: 8,
                                            properties: {
                                              a: { type: 'boolean' },
                                              b: true,
                                              x: {
                                                properties: {
                                                  a: { multipleOf: 2 },
                                                  b: {
                                                    type: ['string', 'number'],
                                                  },
                                                  x: {
                                                    minProperties: 8,
                                                    properties: {
                                                      a: { type: 'boolean' },
                                                      b: true,
                                                      x: {
                                                        properties: {
                                                          a: { multipleOf: 2 },
                                                          b: {
                                                            type: [
                                                              'string',
                                                              'number',
                                                            ],
                                                          },
                                                          x: {
                                                            minProperties: 8,
                                                            properties: {
                                                              a: {
                                                                type: 'boolean',
                                                              },
                                                              b: true,
                                                              x: {
                                                                properties: {
                                                                  a: {
                                                                    multipleOf: 2,
                                                                  },
                                                                  b: {
                                                                    type: [
                                                                      'string',
                                                                      'number',
                                                                    ],
                                                                  },
                                                                  x: {
                                                                    minProperties: 8,
                                                                    properties:
                                                                      {
                                                                        a: {
                                                                          type: 'boolean',
                                                                        },
                                                                        b: true,
                                                                        x: {
                                                                          properties:
                                                                            {
                                                                              a: {
                                                                                multipleOf: 2,
                                                                              },
                                                                              b: {
                                                                                type: [
                                                                                  'string',
                                                                                  'number',
                                                                                ],
                                                                              },
                                                                              x: {
                                                                                minProperties: 8,
                                                                                properties:
                                                                                  {
                                                                                    a: {
                                                                                      type: 'boolean',
                                                                                    },
                                                                                    b: true,
                                                                                    x: {
                                                                                      properties:
                                                                                        {
                                                                                          a: {
                                                                                            multipleOf: 2,
                                                                                          },
                                                                                          b: {
                                                                                            type: [
                                                                                              'string',
                                                                                              'number',
                                                                                            ],
                                                                                          },
                                                                                          x: {
                                                                                            minProperties: 8,
                                                                                            properties:
                                                                                              {
                                                                                                a: {
                                                                                                  type: 'boolean',
                                                                                                },
                                                                                                b: true,
                                                                                                x: {},
                                                                                              },
                                                                                          },
                                                                                        },
                                                                                      minProperties: 8,
                                                                                    },
                                                                                  },
                                                                              },
                                                                            },
                                                                          minProperties: 8,
                                                                        },
                                                                      },
                                                                  },
                                                                },
                                                                minProperties: 8,
                                                              },
                                                            },
                                                          },
                                                        },
                                                        minProperties: 8,
                                                      },
                                                    },
                                                  },
                                                },
                                                minProperties: 8,
                                              },
                                            },
                                          },
                                        },
                                        minProperties: 8,
                                      },
                                    },
                                  },
                                },
                                minProperties: 8,
                              },
                            },
                          },
                        },
                        minProperties: 8,
                      },
                    },
                  },
                },
                minProperties: 8,
              },
            },
          },
        },
        minProperties: 8,
      },
      y: {
        properties: {
          a: { multipleOf: 2 },
          b: { type: ['string', 'number'] },
          x: {
            minProperties: 8,
            properties: {
              a: { type: 'boolean' },
              b: true,
              x: {
                properties: {
                  a: { multipleOf: 2 },
                  b: { type: ['string', 'number'] },
                  x: {
                    minProperties: 8,
                    properties: {
                      a: { type: 'boolean' },
                      b: true,
                      x: {
                        properties: {
                          a: { multipleOf: 2 },
                          b: { type: ['string', 'number'] },
                          x: {
                            minProperties: 8,
                            properties: {
                              a: { type: 'boolean' },
                              b: true,
                              x: {
                                properties: {
                                  a: { multipleOf: 2 },
                                  b: { type: ['string', 'number'] },
                                  x: {
                                    minProperties: 8,
                                    properties: {
                                      a: { type: 'boolean' },
                                      b: true,
                                      x: {
                                        properties: {
                                          a: { multipleOf: 2 },
                                          b: { type: ['string', 'number'] },
                                          x: {
                                            minProperties: 8,
                                            properties: {
                                              a: { type: 'boolean' },
                                              b: true,
                                              x: {
                                                properties: {
                                                  a: { multipleOf: 2 },
                                                  b: {
                                                    type: ['string', 'number'],
                                                  },
                                                  x: {
                                                    minProperties: 8,
                                                    properties: {
                                                      a: { type: 'boolean' },
                                                      b: true,
                                                      x: {
                                                        properties: {
                                                          a: { multipleOf: 2 },
                                                          b: {
                                                            type: [
                                                              'string',
                                                              'number',
                                                            ],
                                                          },
                                                          x: {
                                                            minProperties: 8,
                                                            properties: {
                                                              a: {
                                                                type: 'boolean',
                                                              },
                                                              b: true,
                                                              x: {
                                                                properties: {
                                                                  a: {
                                                                    multipleOf: 2,
                                                                  },
                                                                  b: {
                                                                    type: [
                                                                      'string',
                                                                      'number',
                                                                    ],
                                                                  },
                                                                  x: {
                                                                    minProperties: 8,
                                                                    properties:
                                                                      {
                                                                        a: {
                                                                          type: 'boolean',
                                                                        },
                                                                        b: true,
                                                                        x: {
                                                                          properties:
                                                                            {
                                                                              a: {
                                                                                multipleOf: 2,
                                                                              },
                                                                              b: {
                                                                                type: [
                                                                                  'string',
                                                                                  'number',
                                                                                ],
                                                                              },
                                                                              x: {
                                                                                minProperties: 8,
                                                                                properties:
                                                                                  {
                                                                                    a: {
                                                                                      type: 'boolean',
                                                                                    },
                                                                                    b: true,
                                                                                    x: {
                                                                                      properties:
                                                                                        {
                                                                                          a: {
                                                                                            multipleOf: 2,
                                                                                          },
                                                                                          b: {
                                                                                            type: [
                                                                                              'string',
                                                                                              'number',
                                                                                            ],
                                                                                          },
                                                                                          x: {
                                                                                            minProperties: 8,
                                                                                            properties:
                                                                                              {
                                                                                                a: {
                                                                                                  type: 'boolean',
                                                                                                },
                                                                                                b: true,
                                                                                                x: {},
                                                                                              },
                                                                                          },
                                                                                        },
                                                                                      minProperties: 8,
                                                                                    },
                                                                                  },
                                                                              },
                                                                            },
                                                                          minProperties: 8,
                                                                        },
                                                                      },
                                                                  },
                                                                },
                                                                minProperties: 8,
                                                              },
                                                            },
                                                          },
                                                        },
                                                        minProperties: 8,
                                                      },
                                                    },
                                                  },
                                                },
                                                minProperties: 8,
                                              },
                                            },
                                          },
                                        },
                                        minProperties: 8,
                                      },
                                    },
                                  },
                                },
                                minProperties: 8,
                              },
                            },
                          },
                        },
                        minProperties: 8,
                      },
                    },
                  },
                },
                minProperties: 8,
              },
            },
          },
          y: {
            properties: {
              a: { multipleOf: 2 },
              b: { type: ['string', 'number'] },
              x: {
                minProperties: 8,
                properties: {
                  a: { type: 'boolean' },
                  b: true,
                  x: {
                    properties: {
                      a: { multipleOf: 2 },
                      b: { type: ['string', 'number'] },
                      x: {
                        minProperties: 8,
                        properties: {
                          a: { type: 'boolean' },
                          b: true,
                          x: {
                            properties: {
                              a: { multipleOf: 2 },
                              b: { type: ['string', 'number'] },
                              x: {
                                minProperties: 8,
                                properties: {
                                  a: { type: 'boolean' },
                                  b: true,
                                  x: {
                                    properties: {
                                      a: { multipleOf: 2 },
                                      b: { type: ['string', 'number'] },
                                      x: {
                                        minProperties: 8,
                                        properties: {
                                          a: { type: 'boolean' },
                                          b: true,
                                          x: {
                                            properties: {
                                              a: { multipleOf: 2 },
                                              b: { type: ['string', 'number'] },
                                              x: {
                                                minProperties: 8,
                                                properties: {
                                                  a: { type: 'boolean' },
                                                  b: true,
                                                  x: {
                                                    properties: {
                                                      a: { multipleOf: 2 },
                                                      b: {
                                                        type: [
                                                          'string',
                                                          'number',
                                                        ],
                                                      },
                                                      x: {
                                                        minProperties: 8,
                                                        properties: {
                                                          a: {
                                                            type: 'boolean',
                                                          },
                                                          b: true,
                                                          x: {
                                                            properties: {
                                                              a: {
                                                                multipleOf: 2,
                                                              },
                                                              b: {
                                                                type: [
                                                                  'string',
                                                                  'number',
                                                                ],
                                                              },
                                                              x: {
                                                                minProperties: 8,
                                                                properties: {
                                                                  a: {
                                                                    type: 'boolean',
                                                                  },
                                                                  b: true,
                                                                  x: {
                                                                    properties:
                                                                      {
                                                                        a: {
                                                                          multipleOf: 2,
                                                                        },
                                                                        b: {
                                                                          type: [
                                                                            'string',
                                                                            'number',
                                                                          ],
                                                                        },
                                                                        x: {
                                                                          minProperties: 8,
                                                                          properties:
                                                                            {
                                                                              a: {
                                                                                type: 'boolean',
                                                                              },
                                                                              b: true,
                                                                              x: {
                                                                                properties:
                                                                                  {
                                                                                    a: {
                                                                                      multipleOf: 2,
                                                                                    },
                                                                                    b: {
                                                                                      type: [
                                                                                        'string',
                                                                                        'number',
                                                                                      ],
                                                                                    },
                                                                                    x: {
                                                                                      minProperties: 8,
                                                                                      properties:
                                                                                        {
                                                                                          a: {
                                                                                            type: 'boolean',
                                                                                          },
                                                                                          b: true,
                                                                                          x: {
                                                                                            properties:
                                                                                              {
                                                                                                a: {
                                                                                                  multipleOf: 2,
                                                                                                },
                                                                                                b: {
                                                                                                  type: [
                                                                                                    'string',
                                                                                                    'number',
                                                                                                  ],
                                                                                                },
                                                                                                x: {
                                                                                                  minProperties: 8,
                                                                                                  properties:
                                                                                                    {
                                                                                                      a: {
                                                                                                        type: 'boolean',
                                                                                                      },
                                                                                                      b: true,
                                                                                                      x: {},
                                                                                                    },
                                                                                                },
                                                                                              },
                                                                                            minProperties: 8,
                                                                                          },
                                                                                        },
                                                                                    },
                                                                                  },
                                                                                minProperties: 8,
                                                                              },
                                                                            },
                                                                        },
                                                                      },
                                                                    minProperties: 8,
                                                                  },
                                                                },
                                                              },
                                                            },
                                                            minProperties: 8,
                                                          },
                                                        },
                                                      },
                                                    },
                                                    minProperties: 8,
                                                  },
                                                },
                                              },
                                            },
                                            minProperties: 8,
                                          },
                                        },
                                      },
                                    },
                                    minProperties: 8,
                                  },
                                },
                              },
                            },
                            minProperties: 8,
                          },
                        },
                      },
                    },
                    minProperties: 8,
                  },
                },
              },
            },
            minProperties: 8,
          },
        },
        minProperties: 8,
      },
    },
  }

  const startTime = performance.now()

  const result = schemasAreEquivalent(schema, schema)

  const endTime = performance.now()

  const elapsedTime = endTime - startTime

  // eslint-disable-next-line no-console
  console.log(
    `⏲️  stress test for ${schemasAreEquivalent.name} took ${elapsedTime} ms.`,
  )

  it('works with extensively deep example', () => {
    expect(result).toBe(true)
  })
})
