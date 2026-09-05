import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{spec,test}.{js,jsx,ts,tsx}'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/tests/', // specs do Playwright
  ],
  transformIgnorePatterns: [
    // pnpm aninha em .pnpm/<pkg>@<versao>/node_modules/<pkg>, entao o pacote
    // precisa ser reconhecido em qualquer ponto do caminho
    '/node_modules/(?!.*(next-intl|use-intl|jose|@formatjs|intl-messageformat))',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
}

// next/jest sobrescreve transformIgnorePatterns, entao o valor precisa ser
// reaplicado depois que a config assincrona do Next e resolvida
const jestConfig = createJestConfig(customJestConfig)

export default async () => {
  const config = await jestConfig()
  config.transformIgnorePatterns = customJestConfig.transformIgnorePatterns
  return config
}
