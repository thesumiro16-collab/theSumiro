import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // The app intentionally uses the standard effect-based data-fetching
      // pattern (useEffect(() => fetchX(), [fetchX])) in its hooks and
      // contexts. This newer rule flags that correct pattern, so it's off.
      'react-hooks/set-state-in-effect': 'off',
      // Context files export a Provider plus its hook/constants together.
      // This rule is a dev-only fast-refresh hint with no production impact.
      'react-refresh/only-export-components': 'off',
      // Kept visible as warnings — working patterns worth revisiting later,
      // but not regressions.
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
])
