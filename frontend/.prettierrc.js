module.exports = {
  // Core formatting - German developer standards
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,

  // Code organization - Accessibility and readability
  quoteProps: 'as-needed',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // File consistency - Cross-platform German development
  endOfLine: 'lf',
  insertPragma: false,
  requirePragma: false,

  // Language-specific formatting
  embeddedLanguageFormatting: 'auto',
  proseWrap: 'preserve',

  // React/JSX specific
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Performance optimizations
  rangeStart: 0,
  rangeEnd: Infinity,

  // Plugins for Next.js and Tailwind
  plugins: ['prettier-plugin-tailwindcss'],

  overrides: [
    {
      files: ['*.tsx', '*.jsx'],
      options: {
        parser: 'typescript',
        jsxSingleQuote: true,
        jsxBracketSameLine: false
      }
    },
    {
      files: ['*.ts'],
      options: {
        parser: 'typescript'
      }
    },
    {
      files: ['*.json'],
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: ['*.md'],
      options: {
        proseWrap: 'always',
        printWidth: 80
      }
    },
    {
      files: ['*.css', '*.scss'],
      options: {
        parser: 'css',
        printWidth: 120,
        singleQuote: false
      }
    },
    {
      files: ['src/i18n/**/*.json', 'src/locales/**/*.json'],
      options: {
        printWidth: 120,
        tabWidth: 2,
        // Preserve German text formatting
        proseWrap: 'never'
      }
    },
    {
      files: ['pages/**/*.tsx', 'src/pages/**/*.tsx'],
      options: {
        // Next.js pages formatting
        printWidth: 100,
        tabWidth: 2,
        jsxBracketSameLine: false
      }
    },
    {
      files: ['src/components/**/*.tsx'],
      options: {
        // Component formatting for accessibility
        printWidth: 100,
        tabWidth: 2,
        jsxSingleQuote: true,
        // Ensure accessibility attributes are readable
        htmlWhitespaceSensitivity: 'strict'
      }
    },
    {
      files: ['tailwind.config.js', 'next.config.js', 'postcss.config.js'],
      options: {
        parser: 'babel',
        printWidth: 120,
        tabWidth: 2,
        singleQuote: true
      }
    },
    {
      files: ['playwright.config.ts', 'tests/**/*.ts'],
      options: {
        parser: 'typescript',
        printWidth: 120
      }
    }
  ]
};