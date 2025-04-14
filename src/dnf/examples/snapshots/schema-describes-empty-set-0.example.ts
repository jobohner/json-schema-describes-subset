import { schemaDescribesEmptySet } from 'json-schema-describes-subset'

console.log(schemaDescribesEmptySet(false)) // logs: `true`

console.log(
  schemaDescribesEmptySet(
    // this schema will accept anything that is not a number
    { minimum: 2, maximum: 1 },
  ),
) // logs: `false`

console.log(
  schemaDescribesEmptySet({
    type: 'number',
    minimum: 2,
    maximum: 1,
  }),
) // logs: `true`
