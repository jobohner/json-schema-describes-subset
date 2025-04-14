import { toDNF } from 'json-schema-describes-subset'

console.log(
  toDNF({
    anyOf: [{ multipleOf: 2 }, { multipleOf: 3 }, { multipleOf: 4 }],
  }),
)
