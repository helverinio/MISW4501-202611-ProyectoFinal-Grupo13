import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'https://d3hkc7ho8q0zd0.cloudfront.net',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    video: false,
    chromeWebSecurity: false,
  },
});
