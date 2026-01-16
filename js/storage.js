/**
 * MoodSync - Storage Module
 * Handles localStorage operations for user data
 */

const STORAGE_KEYS = {
    USER_PROFILE: 'moodsync_user_profile',
    PARTNER_PROFILE: 'moodsync_partner_profile',
    PERIOD_HISTORY: 'moodsync_period_history',
    MOOD_ENTRIES: 'moodsync_mood_entries',
    SETTINGS: 'moodsync_settings',
    LINK_CODE: 'moodsync_link_code'
};

/**
 * Save data to localStorage
 */
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

/**
 * Load data from localStorage
 */
function loadData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}

/**
 * Remove data from localStorage
 */
function removeData(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing data:', error);
        return false;
    }
}

/**
 * User Profile Management
 */
function saveUserProfile(profile) {
    return saveData(STORAGE_KEYS.USER_PROFILE, {
        ...profile,
        updatedAt: new Date().toISOString()
    });
}

function getUserProfile() {
    return loadData(STORAGE_KEYS.USER_PROFILE);
}

function createUserProfile(name, cycleLength, lastPeriodDate) {
    const profile = {
        id: generateId(),
        name,
        cycleLength: parseInt(cycleLength) || 28,
        lastPeriodDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    saveUserProfile(profile);
    return profile;
}

/**
 * Partner Profile Management
 */
function savePartnerProfile(profile) {
    return saveData(STORAGE_KEYS.PARTNER_PROFILE, {
        ...profile,
        updatedAt: new Date().toISOString()
    });
}

function getPartnerProfile() {
    return loadData(STORAGE_KEYS.PARTNER_PROFILE);
}

function createPartnerProfile(name, linkCode) {
    const profile = {
        id: generateId(),
        name,
        linkCode,
        linkedAt: new Date().toISOString(),
        notificationsEnabled: true
    };
    savePartnerProfile(profile);
    return profile;
}

/**
 * Period History Management
 */
function getPeriodHistory() {
    return loadData(STORAGE_KEYS.PERIOD_HISTORY) || [];
}

function logPeriod(startDate, notes = '') {
    const history = getPeriodHistory();
    const entry = {
        id: generateId(),
        startDate,
        notes,
        loggedAt: new Date().toISOString()
    };
    history.push(entry);
    saveData(STORAGE_KEYS.PERIOD_HISTORY, history);

    // Update user profile with new last period date
    const profile = getUserProfile();
    if (profile) {
        profile.lastPeriodDate = startDate;
        saveUserProfile(profile);
    }

    return entry;
}

/**
 * Mood Entries Management
 */
function getMoodEntries() {
    return loadData(STORAGE_KEYS.MOOD_ENTRIES) || [];
}

function logMood(mood, notes = '') {
    const entries = getMoodEntries();
    const entry = {
        id: generateId(),
        mood,
        notes,
        date: new Date().toISOString()
    };
    entries.push(entry);
    saveData(STORAGE_KEYS.MOOD_ENTRIES, entries);
    return entry;
}

/**
 * Link Code Management
 */
function generateLinkCode() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    saveData(STORAGE_KEYS.LINK_CODE, code);
    return code;
}

function getLinkCode() {
    let code = loadData(STORAGE_KEYS.LINK_CODE);
    if (!code) {
        code = generateLinkCode();
    }
    return code;
}

function validateLinkCode(inputCode) {
    const storedCode = getLinkCode();
    return storedCode && storedCode.toUpperCase() === inputCode.toUpperCase();
}

/**
 * Settings Management
 */
function getSettings() {
    return loadData(STORAGE_KEYS.SETTINGS) || {
        notifications: true,
        partnerView: true,
        theme: 'light'
    };
}

function saveSettings(settings) {
    return saveData(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Clear all data
 */
function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => removeData(key));
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Check if user is onboarded
 */
function isOnboarded() {
    const profile = getUserProfile();
    return profile && profile.lastPeriodDate;
}

/**
 * Check if partner is linked
 */
function isPartnerLinked() {
    const partner = getPartnerProfile();
    return partner && partner.linkCode;
}

// Export for use in other modules
window.MoodSyncStorage = {
    STORAGE_KEYS,
    saveData,
    loadData,
    removeData,
    saveUserProfile,
    getUserProfile,
    createUserProfile,
    savePartnerProfile,
    getPartnerProfile,
    createPartnerProfile,
    getPeriodHistory,
    logPeriod,
    getMoodEntries,
    logMood,
    generateLinkCode,
    getLinkCode,
    validateLinkCode,
    getSettings,
    saveSettings,
    clearAllData,
    generateId,
    isOnboarded,
    isPartnerLinked
};
