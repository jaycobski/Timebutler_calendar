module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'jest',
    'node',
    'security',
    'accessibility'
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:node/recommended',
    'plugin:security/recommended-legacy',
    'plugin:jest/recommended',
    'plugin:accessibility/recommended',
    'prettier'
  ],
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  },
  rules: {
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',

    // Performance-focused rules
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-destructuring': ['error', { array: false, object: true }],
    'prefer-template': 'error',
    'prefer-spread': 'error',
    'no-loop-func': 'error',
    'no-implied-eval': 'error',

    // Security rules - Enhanced for German GDPR compliance
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-bidi-characters': 'error',

    // German market specific rules
    'no-restricted-globals': ['error', {
      name: 'Intl',
      message: 'Use date-fns-tz for German timezone handling instead of Intl directly'
    }],
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.name='setTimeout'][arguments.length>2]",
        message: 'Avoid setTimeout with additional arguments - use arrow functions for German locale context'
      },
      {
        selector: "NewExpression[callee.name='Date']",
        message: 'Use date-fns or dayjs for German locale support instead of native Date'
      }
    ],

    // GDPR compliance patterns
    'no-restricted-properties': [
      'error',
      {
        object: 'console',
        property: 'log',
        message: 'Use structured logging (pino) to avoid logging personal data'
      }
    ],

    // Import rules
    'import/no-unresolved': 'error',
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      }
    }],
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'error',

    // Node.js specific
    'node/no-unsupported-features/es-syntax': 'off', // TypeScript handles this
    'node/no-missing-import': 'off', // TypeScript handles this
    'node/no-unpublished-import': 'off', // Allow dev dependencies in tests
    'node/prefer-global/buffer': 'error',
    'node/prefer-global/process': 'error',

    // General code quality - Enhanced for >90% coverage
    'no-console': 'warn',
    'no-debugger': 'error',
    'complexity': ['error', 10],
    'max-depth': ['error', 4],
    'max-params': ['error', 4],
    'max-lines-per-function': ['error', 50],
    'prefer-promise-reject-errors': 'error',
    'no-magic-numbers': ['error', {
      ignore: [0, 1, -1, 2, 24, 60, 1000, 3600, 86400],
      ignoreArrayIndexes: true,
      enforceConst: true,
      detectObjects: false
    }],
    'consistent-return': 'error',
    'no-unreachable': 'error',
    'no-unreachable-loop': 'error',

    // Email and calendar specific patterns
    'no-restricted-modules': [
      'error',
      {
        name: 'nodemailer',
        message: 'Use Resend service instead of nodemailer for reliable German email delivery'
      }
    ],

    // Performance optimizations for German traffic spikes
    'no-sync': 'warn',
    'no-blocking-callback': 'warn',

    // Jest specific
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'security/detect-object-injection': 'off',
        'max-lines-per-function': 'off',
        'no-magic-numbers': 'off',
        'no-restricted-modules': 'off',
        'no-restricted-syntax': 'off'
      }
    },
    {
      files: ['src/scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
        'no-sync': 'off',
        'security/detect-child-process': 'off'
      }
    },
    {
      files: ['src/services/email/**/*.ts'],
      rules: {
        'no-restricted-modules': [
          'error',
          {
            name: 'nodemailer',
            message: 'Use Resend service for GDPR-compliant German email delivery'
          }
        ]
      }
    },
    {
      files: ['src/lib/holidays/**/*.ts', 'src/models/Holiday.ts'],
      rules: {
        'no-magic-numbers': 'off', // Allow holiday date constants
        'complexity': ['error', 15] // Holiday calculations can be more complex
      }
    },
    {
      files: ['src/**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};