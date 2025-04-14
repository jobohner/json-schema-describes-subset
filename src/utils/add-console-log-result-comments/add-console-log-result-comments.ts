import fs from 'fs/promises'

import { ExpressionStatement, Node, Project, SyntaxKind } from 'ts-morph'

import { formatFileContent } from '../format/format.js'

export async function addConsoleLogResultComments(
  filePath: string,
  /**
   * the arguments passed to the `console.log`s. Can be retrieved with mocks
   */
  logCalls: unknown[][],
  tsConfigFilePath: string,
): Promise<string> {
  const project = new Project({ tsConfigFilePath })
  const tsSourceFile = project.getSourceFile(filePath)

  const consoleLogStatements: ExpressionStatement[] = []

  tsSourceFile?.forEachDescendant((node) => {
    if (
      Node.isExpressionStatement(node) &&
      node
        .getExpressionIfKind(SyntaxKind.CallExpression)
        ?.getExpression()
        .getText()
        .replace(/\s/g, '') === 'console.log'
    ) {
      consoleLogStatements.unshift(node)
    }
  })

  let fileContent = await fs.readFile(filePath, 'utf-8')

  for (const logCall of [...logCalls].reverse()) {
    const statement = consoleLogStatements.shift()
    if (statement === undefined) {
      throw new Error('Unexpected undefined statement')
    }
    const endPosition = statement.getEnd()

    fileContent =
      fileContent.slice(0, endPosition) +
      ` // logs: \`${logCall.map((value) => JSON.stringify(value)).join(`, `)}\`\n` +
      fileContent.slice(endPosition)
  }

  return await formatFileContent(filePath, fileContent)
}
