// ============================================================
// TrustLink Appium 2.x — Mobile Page Objects
// ============================================================

const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  get emailInput() { return '~input_email'; }
  get passwordInput() { return '~input_password'; }
  get signInButton() { return '~btn_sign_in'; }
  get googleButton() { return '~btn_google_oauth'; }
  get errorBanner() { return '~banner_error'; }
  get registerLink() { return '~link_create_account'; }

  async login(email, password) {
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.signInButton);
  }
}

class VaultPage extends BasePage {
  get searchInput() { return '~input_search_vault'; }
  get newFolderButton() { return '~btn_new_folder'; }
  get uploadButton() { return '~btn_upload_file'; }
  get folderModalInput() { return '~input_modal_folder_name'; }
  get folderModalSubmit() { return '~btn_modal_create_folder'; }

  async createFolder(name) {
    await this.click(this.newFolderButton);
    await this.type(this.folderModalInput, name);
    await this.click(this.folderModalSubmit);
  }
}

class DocumentDetailPage extends BasePage {
  get sha256FingerprintText() { return '~text_sha256_hash'; }
  get integrityBadge() { return '~badge_integrity_status'; }
  get blockchainProofCard() { return '~card_blockchain_proof'; }
  get createBlockchainProofBtn() { return '~btn_create_blockchain_proof'; }
  get verifyIntegrityBtn() { return '~btn_verify_integrity'; }
  get shareViaAppsBtn() { return '~btn_share_via_apps'; }
  get grantInAppAccessBtn() { return '~btn_grant_in_app_access'; }
  get downloadFileBtn() { return '~btn_download_file'; }
  get deleteDocBtn() { return '~btn_delete_document'; }

  async verifyDocument() {
    await this.click(this.verifyIntegrityBtn);
  }

  async anchorDocument() {
    await this.click(this.createBlockchainProofBtn);
  }
}

class SharePage extends BasePage {
  get tabSharedWithMe() { return '~tab_shared_with_me'; }
  get tabSharedByMe() { return '~tab_shared_by_me'; }
  get revokeShareBtn() { return '~btn_revoke_share'; }

  async switchTab(tab = 'by_me') {
    if (tab === 'by_me') {
      await this.click(this.tabSharedByMe);
    } else {
      await this.click(this.tabSharedWithMe);
    }
  }
}

class ActivityPage extends BasePage {
  get filterAll() { return '~filter_all'; }
  get filterBlockchain() { return '~filter_blockchain'; }
  get filterIntegrity() { return '~filter_integrity'; }
  get filterSharing() { return '~filter_sharing'; }

  async selectCategory(category) {
    await this.click(`~filter_${category.toLowerCase()}`);
  }
}

module.exports = {
  LoginPage,
  VaultPage,
  DocumentDetailPage,
  SharePage,
  ActivityPage,
};
