import path from 'path'

import { test, expect } from 'vitest'

import { CallExpression, Node, Project } from 'ts-morph'
import endent_ from 'endent'

import { schemaDescribesSubset } from 'json-schema-describes-subset'
import { formatFileContent } from '../../utils/format/index.js'
import { makeWhitespacesPlain } from '../../utils/string/index.js'
import { tsConfigFilename } from '../../../filenames.js'

// workaround (https://github.com/microsoft/TypeScript/issues/50058#issuecomment-1297806160)
const endent = endent_ as unknown as typeof endent_.default

const project = new Project({ tsConfigFilePath: tsConfigFilename })
const tsSourceFile = project.getSourceFile(import.meta.filename)

const schemaDescribesSubsetCallExpressions: CallExpression[] = []

tsSourceFile?.forEachDescendant((node) => {
  if (
    Node.isCallExpression(node) &&
    node?.getExpression().getText() === schemaDescribesSubset.name
  ) {
    schemaDescribesSubsetCallExpressions.push(node)
  }
})

function shiftSchemaDescribesSubsetCallExpression(): [
  callExpression: string,
  arg0: string,
  arg1: string,
] {
  const callExpression = schemaDescribesSubsetCallExpressions.shift()

  if (callExpression === undefined) {
    throw new Error('missing call expression')
  }

  const [arg0, arg1] = callExpression
    .getArguments()
    .map((arg) => makeWhitespacesPlain(arg.getText()))

  if (arg0 === undefined || arg1 === undefined) {
    throw new Error('missing argument')
  }

  return [callExpression.getText(), arg0, arg1]
}

const snapshotFilename = 'string-pattern-examples.md'
test(snapshotFilename, async () => {
  const content: string[] = []

  {
    const result = schemaDescribesSubset(
      // potentialSubsetSchema:
      { pattern: '^[abc]{3}$' },
      // potentialSupersetSchema:
      { pattern: '^[abc]{2,3}$' },
    )

    const [callExpression, arg0, arg1] =
      shiftSchemaDescribesSubsetCallExpression()

    expect([callExpression, arg0, arg1, result]).toMatchInlineSnapshot(`
      [
        "schemaDescribesSubset(
            // potentialSubsetSchema:
            { pattern: '^[abc]{3}$' },
            // potentialSupersetSchema:
            { pattern: '^[abc]{2,3}$' },
          )",
        "{ pattern: '^[abc]{3}$' }",
        "{ pattern: '^[abc]{2,3}$' }",
        null,
      ]
    `)

    content.push(endent`
      \`\`\`typescript
      ${callExpression} // returns \`${result}\`
      \`\`\`

      This returns **\`${result}\`** even though the schema
      \`${arg0}\` does in fact describe a subset of the set of values
      that satisfy \`${arg1}\`, but this is not determined by
      \`${schemaDescribesSubset.name}\`, since unequal patterns aren't
      analyzed any further.
    `)
  }

  {
    const result = schemaDescribesSubset(
      // potentialSubsetSchema:
      { pattern: '^[abc]{3}$' },
      // potentialSupersetSchema:
      { anyOf: [{ pattern: '^[abc]{2}$' }, { pattern: '^[abc]{3}$' }] },
    )

    const [callExpression, arg0, arg1] =
      shiftSchemaDescribesSubsetCallExpression()

    expect([callExpression, arg0, arg1, result]).toMatchInlineSnapshot(`
      [
        "schemaDescribesSubset(
            // potentialSubsetSchema:
            { pattern: '^[abc]{3}$' },
            // potentialSupersetSchema:
            { anyOf: [{ pattern: '^[abc]{2}$' }, { pattern: '^[abc]{3}$' }] },
          )",
        "{ pattern: '^[abc]{3}$' }",
        "{ anyOf: [{ pattern: '^[abc]{2}$' }, { pattern: '^[abc]{3}$' }] }",
        true,
      ]
    `)

    content.push(endent`
      In some cases it is possible to receive an unambiguous result by creating
      the schemas in a way where equal patterns appear in both schemas:

      \`\`\`typescript
      ${callExpression} // returns \`${result}\`
      \`\`\`

      This \`potentialSupersetSchema\` is equivalent to the one in the previous
      example, but shares a pattern with the \`potentialSubsetSchema\` and
      therefore \`true\` can be determined as the result.
    `)
  }

  {
    const result = schemaDescribesSubset(
      // potentialSubsetSchema:
      { required: ['a', 'aa'], maxProperties: 2 },
      // potentialSupersetSchema:
      { propertyNames: { pattern: '^a+$' } },
    )

    const [callExpression, arg0, arg1] =
      shiftSchemaDescribesSubsetCallExpression()

    expect([callExpression, arg0, arg1, result]).toMatchInlineSnapshot(`
      [
        "schemaDescribesSubset(
            // potentialSubsetSchema:
            { required: ['a', 'aa'], maxProperties: 2 },
            // potentialSupersetSchema:
            { propertyNames: { pattern: '^a+$' } },
          )",
        "{ required: ['a', 'aa'], maxProperties: 2 }",
        "{ propertyNames: { pattern: '^a+$' } }",
        true,
      ]
    `)

    content.push(endent`
      Also, constant values might be tested against patterns, so that the
      following returns \`true\`:

      \`\`\`typescript
      ${callExpression} // returns \`${result}\`
      \`\`\`
    `)
  }

  const snapshotFilepath = path.join(
    import.meta.dirname,
    'snapshots',
    snapshotFilename,
  )
  await expect(
    await formatFileContent(snapshotFilepath, content.join(`\n\n`)),
  ).toMatchFileSnapshot(snapshotFilepath)
})
