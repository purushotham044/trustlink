// ============================================================
// TrustLink Appium 2.x — Base Page Object
// ============================================================

const logger = require('../../utils/logger');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async find(selector, timeout = 10000) {
    try {
      const el = await this.driver.$(selector);
      if (el.waitForDisplayed) {
        await el.waitForDisplayed({ timeout });
      }
      return el;
    } catch (err) {
      logger.warn(`Element not immediately visible for selector: ${selector}`);
      return await this.driver.$(selector);
    }
  }

  async click(selector) {
    const el = await this.find(selector);
    await el.click();
  }

  async type(selector, text) {
    const el = await this.find(selector);
    await el.setValue(text);
  }

  async getText(selector) {
    const el = await this.find(selector);
    return await el.getText();
  }

  async isVisible(selector) {
    try {
      const el = await this.find(selector, 3000);
      return await el.isDisplayed();
    } catch (e) {
      return false;
    }
  }
}

module.exports = BasePage;
