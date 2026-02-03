import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'timing/index': 'src/timing/index.ts',
    'sequencing/index': 'src/sequencing/index.ts',
    'ui/index': 'src/ui/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@elemaudio/core', 'react', 'react-dom', 'react/jsx-runtime'],
});
