// @ts-check

import tseslint from 'typescript-eslint'
import configs from '@jobohner/ts-projects-config-presets/eslint.config.js'

/** @type {import('eslint').Linter.Config[]} */
export const customConfig = [
  { rules: { '@typescript-eslint/consistent-type-definitions': 'off' } },
  {
    /* allow console logs in example files, since this is pretty common for
     * illustration purposes */
    files: ['**/examples/**/*.example.ts'],
    rules: { 'no-console': 'off' },
  },
  { ignores: ['**/node_modules/', '**/dist/', '**/coverage/'] },
]

export default tseslint.config(...configs, customConfig)
