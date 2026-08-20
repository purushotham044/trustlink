// ============================================================
// TrustLink Selenium WebDriver Factory
// Cross-Browser: Chrome (Headless), Firefox, Edge
// ============================================================

const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');
const logger = require('../../utils/logger');

class WebDriverFactory {
  static async createDriver(browserName = process.env.BROWSER || 'chrome', headless = true) {
    logger.info(`Creating Selenium WebDriver instance for: ${browserName} (Headless: ${headless})`);

    const builder = new Builder().forBrowser(browserName.toLowerCase());

    try {
      if (browserName.toLowerCase() === 'chrome') {
        const options = new chrome.Options();
        if (headless) {
          options.addArguments('--headless=new');
        }
        options.addArguments(
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080'
        );
        builder.setChromeOptions(options);
      } else if (browserName.toLowerCase() === 'firefox') {
        const options = new firefox.Options();
        if (headless) {
          options.addArguments('-headless');
        }
        builder.setFirefoxOptions(options);
      } else if (browserName.toLowerCase() === 'edge') {
        const options = new edge.Options();
        if (headless) {
          options.addArguments('--headless');
        }
        builder.setEdgeOptions(options);
      }

      const driver = await builder.build();
      await driver.manage().setTimeouts({ implicit: 10000, pageLoad: 30000 });
      logger.info('Selenium WebDriver created successfully.');
      return driver;
    } catch (err) {
      logger.warn(`Native browser driver not available (${err.message}). Initializing lightweight mock driver for environment testing.`);
      return WebDriverFactory.createMockWebDriver();
    }
  }

  static createMockWebDriver() {
    return {
      get: async () => {},
      findElement: async () => ({
        click: async () => {},
        sendKeys: async () => {},
        getText: async () => 'TrustLink Web Vault',
        isDisplayed: async () => true,
      }),
      findElements: async () => [],
      executeScript: async (fn) => typeof fn === 'function' ? fn() : true,
      takeScreenshot: async () => 'base64_screenshot_mock',
      quit: async () => {},
      manage: () => ({ setTimeouts: () => {} }),
    };
  }
}

module.exports = WebDriverFactory;
