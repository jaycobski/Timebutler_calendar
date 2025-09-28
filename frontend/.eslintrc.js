module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
    'jest',
    'testing-library',
    'jest-dom'
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/strict', // WCAG 2.1 Level AA compliance
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'plugin:testing-library/react',
    'plugin:jest-dom/recommended',
    'next/core-web-vitals',
    'prettier'
  ],
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // TypeScript specific - Enhanced for accessibility
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off', // React components don't need explicit return types
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

    // React specific - Accessibility focused
    'react/jsx-props-no-spreading': ['warn', {
      html: 'enforce',
      custom: 'ignore',
      explicitSpread: 'ignore'
    }],
    'react/prop-types': 'off', // TypeScript handles this
    'react/react-in-jsx-scope': 'off', // Next.js handles this
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/jsx-boolean-value': ['error', 'never'],
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
    'react/jsx-max-depth': ['error', { max: 6 }],
    'react/jsx-no-leaked-render': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/no-array-index-key': 'warn', // Important for German keyboard navigation
    'react/no-unstable-nested-components': 'error',
    'react/self-closing-comp': 'error',

    // WCAG 2.1 Level AA Accessibility Rules (Enhanced)
    'jsx-a11y/accessible-emoji': 'error',
    'jsx-a11y/alt-text': ['error', {
      elements: ['img', 'object', 'area', 'input[type="image"]'],
      img: ['Image'],
      object: ['Object'],
      area: ['Area'],
      'input[type="image"]': ['InputImage']
    }],
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': ['error', {
      components: ['Link'],
      specialLink: ['hrefLeft', 'hrefRight'],
      aspects: ['invalidHref', 'preferButton']
    }],
    'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': ['error', { ignoreNonDOM: false }],
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/autocomplete-valid': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/control-has-associated-label': ['error', {
      labelAttributes: ['label'],
      controlComponents: ['CustomComponent'],
      ignoreElements: ['audio', 'canvas', 'embed', 'input', 'textarea', 'tr', 'video'],
      ignoreRoles: ['grid', 'listbox', 'menu', 'menubar', 'radiogroup', 'row', 'tablist', 'toolbar', 'tree', 'treegrid'],
      depth: 3
    }],
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': ['error', {
      labelComponents: ['CustomInputLabel'],
      labelAttributes: ['label'],
      controlComponents: ['CustomInput'],
      depth: 3
    }],
    'jsx-a11y/lang': 'error',
    'jsx-a11y/media-has-caption': 'error',
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
    'jsx-a11y/no-noninteractive-tabindex': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/scope': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',

    // German market specific accessibility rules
    'jsx-a11y/lang': ['error', {
      validValues: ['de', 'de-DE', 'en', 'en-US']
    }],

    // Performance rules for German traffic spikes
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'react/jsx-no-bind': ['error', {
      ignoreDOMComponents: false,
      ignoreRefs: true,
      allowArrowFunctions: false,
      allowFunctions: false,
      allowBind: false
    }],

    // Import organization
    'import/no-unresolved': 'error',
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
        'type'
      ],
      'newlines-between': 'always',
      pathGroups: [
        {
          pattern: 'react',
          group: 'builtin',
          position: 'before'
        },
        {
          pattern: 'next',
          group: 'builtin',
          position: 'before'
        },
        {
          pattern: '@/**',
          group: 'internal'
        }
      ],
      pathGroupsExcludedImportTypes: ['react', 'next'],
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }],
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'error',
    'import/prefer-default-export': 'off',

    // German i18n compliance
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.name='String'][arguments.0.type='Literal']",
        message: 'Use next-translate for German/English text instead of hardcoded strings'
      },
      {
        selector: "JSXText[value=/^[A-Za-z]/]",
        message: 'Use next-translate for user-facing text in German/English'
      },
      {
        selector: "NewExpression[callee.name='Date']",
        message: 'Use date-fns with German locale instead of native Date'
      }
    ],

    // Bundle size awareness for <200KB requirement
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', 'playwright.config.ts']
    }],

    // General code quality - Performance focused
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'complexity': ['error', 12],
    'max-depth': ['error', 4],
    'max-params': ['error', 5],
    'max-lines-per-function': ['error', 80],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-destructuring': ['error', { array: false, object: true }],
    'prefer-template': 'error',
    'no-magic-numbers': ['error', {
      ignore: [0, 1, -1, 2, 24, 60, 100, 200, 1000],
      ignoreArrayIndexes: true,
      enforceConst: true,
      detectObjects: false
    }],

    // Jest and Testing Library rules
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    'testing-library/await-async-query': 'error',
    'testing-library/no-await-sync-query': 'error',
    'testing-library/no-debugging-utils': 'warn',
    'testing-library/no-dom-import': 'error',
    'testing-library/prefer-screen-queries': 'error',
    'testing-library/prefer-user-event': 'error',
    'jest-dom/prefer-checked': 'error',
    'jest-dom/prefer-enabled-disabled': 'error',
    'jest-dom/prefer-required': 'error',
    'jest-dom/prefer-to-have-attribute': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.tsx', '**/*.test.ts', '**/*.spec.tsx', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'max-lines-per-function': 'off',
        'no-magic-numbers': 'off',
        'jsx-a11y/tabindex-no-positive': 'off', // Testing scenarios may need positive tabindex
        'no-restricted-syntax': 'off'
      }
    },
    {
      files: ['pages/**/*.tsx', 'src/pages/**/*.tsx'],
      rules: {
        'react/function-component-definition': 'off', // Next.js pages can use function declarations
        'import/prefer-default-export': 'error' // Next.js pages must use default export
      }
    },
    {
      files: ['src/components/**/*.tsx'],
      rules: {
        'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
        'react/jsx-max-depth': ['error', { max: 8 }] // Complex calendar components may need more depth
      }
    },
    {
      files: ['src/i18n/**/*.ts', 'src/locales/**/*.ts'],
      rules: {
        'no-restricted-syntax': 'off', // i18n files contain string literals by design
        '@typescript-eslint/no-explicit-any': 'off' // Translation objects may use any
      }
    },
    {
      files: ['playwright.config.ts', 'tests/e2e/**/*.ts'],
      rules: {
        'no-console': 'off',
        'import/no-extraneous-dependencies': 'off'
      }
    },
    {
      files: ['next.config.js', 'tailwind.config.js', 'postcss.config.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-extraneous-dependencies': 'off'
      }
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'import/no-unused-modules': 'off'
      }
    }
  ]
};