module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(mp3|m4a|wav|ogg)$': '<rootDir>/src/__mocks__/fileMock.js',
    '^react-native$': require.resolve('react-native-web'),
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-native-web|@react-native|expo)/)',
  ],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)'],
};
