// @ts-check

import tseslint from 'typescript-eslint'
import configs from '@jobohner/ts-projects-config-presets/eslint.config.js'

import { customConfig } from './eslint.config.js'

export default tseslint.config(...configs, customConfig)
