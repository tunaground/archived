/**
 * Theme Manager
 */
const Theme = {
  STORAGE_KEY: 'archive-theme',

  /**
   * Initialize theme from localStorage or system preference
   */
  init() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.set(stored);
    } else {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.set(prefersDark ? 'dark' : 'light');
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.set(e.matches ? 'dark' : 'light');
      }
    });
  },

  /**
   * Get current theme
   */
  get() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  },

  /**
   * Set theme
   */
  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  },

  /**
   * Toggle between light and dark
   */
  toggle() {
    const current = this.get();
    this.set(current === 'dark' ? 'light' : 'dark');
  },
};
