/**
 * Axion Theme Manager
 * Handles dark/light theme switching with localStorage persistence
 */

const AxionTheme = {
    STORAGE_KEY: 'axion-theme',
    DEFAULT_THEME: 'dark',

    /**
     * Initialize theme on page load
     */
    init() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) || this.DEFAULT_THEME;
        this.apply(savedTheme);
    },

    /**
     * Apply a theme to the document
     * @param {string} theme - 'dark' or 'light'
     */
    apply(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem(this.STORAGE_KEY, theme);
    },

    /**
     * Get current theme
     * @returns {string} 'dark' or 'light'
     */
    get() {
        return localStorage.getItem(this.STORAGE_KEY) || this.DEFAULT_THEME;
    },

    /**
     * Toggle between dark and light themes
     * @returns {string} The new theme
     */
    toggle() {
        const current = this.get();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.apply(newTheme);
        return newTheme;
    }
};

// Initialize theme immediately to prevent flash
AxionTheme.init();

// Export for use in other modules
window.AxionTheme = AxionTheme;
