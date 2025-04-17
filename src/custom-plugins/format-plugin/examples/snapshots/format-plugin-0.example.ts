import { schemaDescribesSubset } from 'json-schema-describes-subset'
import { formatPlugin } from 'json-schema-describes-subset/custom-plugins/format-plugin'

console.log(
  schemaDescribesSubset(
    { format: 'email' },
    { format: 'date-time' },
    { plugins: [formatPlugin] },
  ),
) // logs: `null`

console.log(
  schemaDescribesSubset(
    { type: 'integer', minimum: 0, maximum: 10 },
    { format: 'int32' },
    { plugins: [formatPlugin] },
  ),
) // logs: `true`
