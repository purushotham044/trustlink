// ============================================================
// TrustLink Selenium — Base Web Page & Page Objects
// ============================================================

const { By, until } = require('selenium-webdriver');
const logger = require('../../utils/logger');

class BaseWebPage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigateTo(url) {
    logger.info(`Navigating to URL: ${url}`);
    await this.driver.get(url);
  }

  async find(locator, timeout = 10000) {
    try {
      return await this.driver.findElement(locator);
    } catch (err) {
      logger.warn(`Web element not found: ${locator}`);
      return await this.driver.findElement(locator);
    }
  }

  async click(locator) {
    const el = await this.find(locator);
    await el.click();
  }

  async type(locator, text) {
    const el = await this.find(locator);
    await el.sendKeys(text);
  }

  async getText(locator) {
    const el = await this.find(locator);
    return await el.getText();
  }
}

class WebLoginPage extends BaseWebPage {
  get emailInput() { return By.css('input[type="email"]'); }
  get passwordInput() { return By.css('input[type="password"]'); }
  get submitButton() { return By.css('button[type="submit"]'); }
  get googleButton() { return By.xpath("//button[contains(text(),'Google')]"); }

  async login(email, password) {
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitButton);
  }
}

class WebVaultPage extends BaseWebPage {
  get searchInput() { return By.css('input[placeholder*="Search"]'); }
  get uploadButton() { return By.xpath("//button[contains(.,'Upload')]"); }
  get newFolderButton() { return By.xpath("//button[contains(.,'New Folder')]"); }
  get documentList() { return By.css('[data-testid="document-grid"]'); }
}

class WebDocumentDetailPage extends BaseWebPage {
  get sha256Fingerprint() { return By.css('[data-testid="sha256-hash"]'); }
  get anchorBlockchainButton() { return By.xpath("//button[contains(.,'Anchor to Sepolia')]"); }
  get verifyIntegrityButton() { return By.xpath("//button[contains(.,'Verify Cryptographic Integrity')]"); }
  get downloadButton() { return By.xpath("//button[contains(.,'Download')]"); }
}

class WebSharePage extends BaseWebPage {
  get recipientInput() { return By.css('input[placeholder*="email"]'); }
  get generateShareLinkBtn() { return By.xpath("//button[contains(.,'Share')]"); }
  get copyLinkBtn() { return By.xpath("//button[contains(.,'Copy Link')]"); }
}

class WebActivityPage extends BaseWebPage {
  get eventTimeline() { return By.css('[data-testid="audit-feed"]'); }
  get blockchainFilter() { return By.xpath("//button[contains(.,'Blockchain')]"); }
}

module.exports = {
  BaseWebPage,
  WebLoginPage,
  WebVaultPage,
  WebDocumentDetailPage,
  WebSharePage,
  WebActivityPage,
};
