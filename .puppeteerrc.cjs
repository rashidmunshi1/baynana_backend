const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to local project directory for Render / Docker compatibility
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
