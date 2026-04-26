/** @type {import('jest').Config} */
const config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json', diagnostics: false }],
  },
  moduleNameMapper: {
    // pdfjs-dist usa ESM (.mjs) — substituído por stub em testes unitários
    'pdfjs-dist(.*)': '<rootDir>/../test/mocks/pdfjs.mock.js',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};

module.exports = config;
