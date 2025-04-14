import { defineConfig, mergeConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
// TODO: proper import
import viteConfig from './node_modules/@jobohner/ts-projects-config-presets/vitest.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        /* TODO: include `'scripts'` or at least `'scripts/utils'` */
        include: ['src', 'test'],
        exclude: ['**/snapshots'],
      },
    },
    plugins: [tsconfigPaths()],
  }),
)
