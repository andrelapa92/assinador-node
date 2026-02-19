module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.spec.json'],
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.cjs'], 
  },
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
      }
    ],
  },
  ignorePatterns: ['.eslintrc.cjs'], // Ignorar o próprio arquivo de config
  overrides: [
    {
      files: ['*.spec.ts'], // Aplicado em todos os testes
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },
  ],
};
