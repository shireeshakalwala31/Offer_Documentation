// .puppeteerrc.cjs
const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Tell Puppeteer to download & look for Chrome here:
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
