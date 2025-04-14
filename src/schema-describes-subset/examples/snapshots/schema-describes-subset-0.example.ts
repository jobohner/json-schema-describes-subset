import { schemaDescribesSubset } from 'json-schema-describes-subset'

console.log(
  schemaDescribesSubset(
    {
      type: 'number',
    },
    true,
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(false, {
    type: 'number',
  }),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      type: ['number', 'boolean', 'string', 'null'],
    },
    { type: ['number', 'null'] },
  ),
) // logs: `false`

console.log(
  schemaDescribesSubset(
    { type: 'integer' },
    { type: ['number', 'string', 'boolean'] },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      minimum: 5.5,
    },
    {
      exclusiveMinimum: 5.5,
    },
  ),
) // logs: `false`

console.log(
  schemaDescribesSubset(
    {
      minimum: 5.6,
    },
    {
      exclusiveMinimum: 5.5,
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { minimum: 10, maximum: 30, multipleOf: 5 },
    { anyOf: [{ multipleOf: 3 }, { multipleOf: 20 }, { enum: [10, 25] }] },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { type: 'string', maxLength: 5, minLength: 10 },
    { type: 'null' },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      prefixItems: [{ type: 'string' }, { type: 'boolean' }],
      items: { type: 'object' },
    },
    {
      prefixItems: [
        { type: ['string', 'number'] },
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { contains: { type: 'number' }, minContains: 5 },
    { minItems: 5 },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      prefixItems: [{ type: 'number' }, { type: 'boolean' }],
      items: { type: 'string' },
      maxItems: 3,
    },
    { uniqueItems: true },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { required: ['a'], maxProperties: 2 },
    {
      anyOf: [
        { properties: { b: { type: 'string' } } },
        { properties: { c: { type: 'string' } } },
      ],
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { maxProperties: 2, required: ['abc', 'def'] },
    { propertyNames: { minLength: 2 } },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { maxProperties: 1 },
    {
      anyOf: [
        { properties: { x: { type: 'string' } } },
        { patternProperties: { '^a$': { type: 'string' } } },
      ],
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      additionalProperties: { type: 'number' },
      properties: { a: { type: 'string' } },
    },
    {
      additionalProperties: { type: 'number' },
      properties: {
        a: { type: 'string' },
        b: { type: ['boolean', 'number'] },
      },
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      allOf: [
        {
          properties: {
            aa: { type: 'string' },
            aaa: { type: 'string' },
            aaaa: { type: 'string' },
          },
          patternProperties: {
            '^b+$': { type: 'string' },
          },
        },
        {
          additionalProperties: { type: 'number' },
          patternProperties: {
            '^a+$': { type: 'string' },
            '^b+$': true,
          },
        },
        {
          propertyNames: { not: { pattern: '^b+$' } },
        },
      ],
    },
    {
      additionalProperties: { type: 'number' },
      patternProperties: {
        '^a+$': { type: 'string' },
      },
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      patternProperties: {
        '^a+$': { type: 'string' },
        '^b+$': { type: 'boolean' },
      },
      propertyNames: { pattern: '^a+$' },
    },
    {
      additionalProperties: false,
      patternProperties: { '^a+$': { type: 'string' } },
    },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    { required: ['a', 'b', 'c'] },
    { dependentRequired: { a: ['b', 'c'] } },
  ),
) // logs: `true`

console.log(
  schemaDescribesSubset(
    {
      properties: {
        b: { type: 'number' },
      },
      additionalProperties: false,
    },
    {
      properties: {
        b: { type: ['string', 'number'] },
      },
      dependentSchemas: {
        a: {
          properties: {
            b: {
              type: 'string',
            },
          },
        },
      },
    },
  ),
) // logs: `true`
