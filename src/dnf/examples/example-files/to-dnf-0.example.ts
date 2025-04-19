import { toDNF } from 'json-schema-describes-subset'

console.log(
  toDNF({
    anyOf: [{ minimum: 2 }, { exclusiveMinimum: 1 }],
  }),
)
