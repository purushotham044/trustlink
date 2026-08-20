// ============================================================
// TrustLink Appium 2.x — Mobile Gesture Utilities
// ============================================================

const gestures = {
  /**
   * Performs smooth vertical scroll from bottom to top
   */
  async swipeUp(driver) {
    if (!driver || !driver.performActions) return;
    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: 500, y: 1500 },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerMove', duration: 600, x: 500, y: 300 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
  },

  /**
   * Performs pull-to-refresh swipe from top downwards
   */
  async pullToRefresh(driver) {
    if (!driver || !driver.performActions) return;
    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: 500, y: 400 },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerMove', duration: 800, x: 500, y: 1200 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
  },
};

module.exports = gestures;
