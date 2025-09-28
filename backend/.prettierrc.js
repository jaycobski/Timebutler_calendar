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

  // TypeScript specific
  parser: 'typescript',

  // Performance optimizations
  rangeStart: 0,
  rangeEnd: Infinity,

  overrides: [
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
      files: ['src/templates/**/*.html'],
      options: {
        parser: 'html',
        printWidth: 120,
        htmlWhitespaceSensitivity: 'ignore'
      }
    },
    {
      files: ['src/locales/**/*.json'],
      options: {
        printWidth: 120,
        tabWidth: 2,
        // Preserve German text formatting
        proseWrap: 'never'
      }
    }
  ]
};