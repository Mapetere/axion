/**
 * Axion Authentication Manager
 * Handles local profile and simulated email OTP authentication
 */

const AxionAuth = {
    STORAGE_KEYS: {
        AUTH_STATE: 'axion-auth-state',
        PROFILES: 'axion-profiles',
        CURRENT_USER: 'axion-current-user',
        PENDING_OTP: 'axion-pending-otp'
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        const state = localStorage.getItem(this.STORAGE_KEYS.AUTH_STATE);
        return state === 'authenticated';
    },

    /**
     * Get current user profile
     * @returns {Object|null}
     */
    getCurrentUser() {
        const userJson = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
        return userJson ? JSON.parse(userJson) : null;
    },

    /**
     * Create a local profile with name and password
     * @param {string} name 
     * @param {string} password 
     * @returns {Object} The created profile
     */
    createLocalProfile(name, password) {
        const profiles = this.getProfiles();
        const id = this.generateId();

        const profile = {
            id,
            name,
            passwordHash: this.hashPassword(password),
            type: 'local',
            createdAt: new Date().toISOString()
        };

        profiles.push(profile);
        localStorage.setItem(this.STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

        this.setCurrentUser(profile);
        return profile;
    },

    /**
     * Login with local profile
     * @param {string} name 
     * @param {string} password 
     * @returns {Object|null} Profile if successful, null otherwise
     */
    loginLocal(name, password) {
        const profiles = this.getProfiles();
        const profile = profiles.find(p =>
            p.name.toLowerCase() === name.toLowerCase() &&
            p.passwordHash === this.hashPassword(password) &&
            p.type === 'local'
        );

        if (profile) {
            this.setCurrentUser(profile);
            return profile;
        }
        return null;
    },

    /**
     * Initiate email OTP flow (simulated)
     * @param {string} email 
     * @returns {string} The OTP code (for demo purposes, would be sent via email)
     */
    initiateEmailOTP(email) {
        const otp = this.generateOTP();
        const pendingAuth = {
            email,
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        };

        localStorage.setItem(this.STORAGE_KEYS.PENDING_OTP, JSON.stringify(pendingAuth));

        // In production, this would send an email
        // For demo, we return the OTP to display to user
        console.log(`[Axion Auth] OTP for ${email}: ${otp}`);
        return otp;
    },

    /**
     * Verify email OTP
     * @param {string} email 
     * @param {string} code 
     * @returns {Object|null} Profile if successful
     */
    verifyEmailOTP(email, code) {
        const pendingJson = localStorage.getItem(this.STORAGE_KEYS.PENDING_OTP);
        if (!pendingJson) return null;

        const pending = JSON.parse(pendingJson);

        if (pending.email !== email || pending.otp !== code) {
            return null;
        }

        if (Date.now() > pending.expiresAt) {
            localStorage.removeItem(this.STORAGE_KEYS.PENDING_OTP);
            return null;
        }

        // Clear pending OTP
        localStorage.removeItem(this.STORAGE_KEYS.PENDING_OTP);

        // Find or create profile for this email
        let profiles = this.getProfiles();
        let profile = profiles.find(p => p.email === email && p.type === 'email');

        if (!profile) {
            profile = {
                id: this.generateId(),
                email,
                name: email.split('@')[0],
                type: 'email',
                createdAt: new Date().toISOString()
            };
            profiles.push(profile);
            localStorage.setItem(this.STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
        }

        this.setCurrentUser(profile);
        return profile;
    },

    /**
     * Logout current user
     */
    logout() {
        localStorage.removeItem(this.STORAGE_KEYS.AUTH_STATE);
        localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    },

    /**
     * Update current user profile
     * @param {Object} updates 
     */
    updateProfile(updates) {
        const current = this.getCurrentUser();
        if (!current) return null;

        const profiles = this.getProfiles();
        const index = profiles.findIndex(p => p.id === current.id);

        if (index !== -1) {
            const updated = { ...profiles[index], ...updates };
            profiles[index] = updated;
            localStorage.setItem(this.STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
            this.setCurrentUser(updated);
            return updated;
        }
        return null;
    },

    // Private helpers
    getProfiles() {
        const profilesJson = localStorage.getItem(this.STORAGE_KEYS.PROFILES);
        return profilesJson ? JSON.parse(profilesJson) : [];
    },

    setCurrentUser(profile) {
        const safeProfile = { ...profile };
        delete safeProfile.passwordHash;
        localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeProfile));
        localStorage.setItem(this.STORAGE_KEYS.AUTH_STATE, 'authenticated');
    },

    generateId() {
        return 'ax_' + Math.random().toString(36).substr(2, 9);
    },

    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    hashPassword(password) {
        // Simple hash for demo - in production use proper hashing
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'h_' + Math.abs(hash).toString(36);
    }
};

// Export for use in other modules
window.AxionAuth = AxionAuth;
