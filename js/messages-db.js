/**
 * Axion - Messages Database Module
 * Fetches and manages system notification messages from the database
 */

const MESSAGES_STORAGE_KEY = 'axion_used_messages';
const MESSAGES_DB_PATH = '/data/messages.json';

class MessagesDatabase {
    constructor() {
        this.messages = null;
        this.usedMessages = this.loadUsedMessages();
    }

    /**
     * Load the messages database from JSON file
     */
    async loadMessages() {
        if (this.messages) {
            return this.messages;
        }

        try {
            const response = await fetch(MESSAGES_DB_PATH);
            if (!response.ok) {
                throw new Error(`Failed to load messages: ${response.status}`);
            }
            this.messages = await response.json();
            return this.messages;
        } catch (error) {
            console.error('Error loading messages database:', error);
            return null;
        }
    }

    /**
     * Get used messages tracker from localStorage
     */
    loadUsedMessages() {
        try {
            const data = localStorage.getItem(MESSAGES_STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    }

    /**
     * Save used messages tracker to localStorage
     */
    saveUsedMessages() {
        try {
            localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(this.usedMessages));
        } catch (error) {
            console.error('Error saving used messages:', error);
        }
    }

    /**
     * Map cycle phase name to database phase key
     */
    mapPhaseToKey(phaseName) {
        const mapping = {
            'Menstrual': 'menstrual',
            'Follicular': 'follicular',
            'Ovulation': 'ovulation',
            'Early Luteal': 'early_luteal',
            'Pre-menstrual': 'peak_sensitivity',
            'Late Luteal (PMS)': 'peak_sensitivity'
        };
        return mapping[phaseName] || 'peak_sensitivity';
    }

    /**
     * Get a message for a specific phase, avoiding repetition
     */
    async getMessageForPhase(phaseName) {
        const messages = await this.loadMessages();
        if (!messages) {
            return null;
        }

        const phaseKey = this.mapPhaseToKey(phaseName);
        const phaseData = messages.phases[phaseKey];
        
        if (!phaseData || !phaseData.messages || phaseData.messages.length === 0) {
            return null;
        }

        // Initialize used messages array for this phase if needed
        if (!this.usedMessages[phaseKey]) {
            this.usedMessages[phaseKey] = [];
        }

        // Get available (unused) messages
        const availableMessages = phaseData.messages.filter(
            (msg, index) => !this.usedMessages[phaseKey].includes(index)
        );

        // Reset if all messages have been used
        if (availableMessages.length === 0) {
            this.usedMessages[phaseKey] = [];
            return this.getMessageForPhase(phaseName);
        }

        // Select a random message from available ones
        const randomIndex = Math.floor(Math.random() * availableMessages.length);
        const selectedMessage = availableMessages[randomIndex];
        
        // Mark this message as used
        const originalIndex = phaseData.messages.indexOf(selectedMessage);
        this.usedMessages[phaseKey].push(originalIndex);
        this.saveUsedMessages();

        return {
            message: selectedMessage,
            phase: phaseData.displayName,
            intent: phaseData.intent,
            temperature: phaseData.temperature,
            urgency: phaseData.urgency
        };
    }

    /**
     * Get system notification message based on cycle info
     */
    async getSystemNotificationMessage(cycleInfo) {
        const phaseName = cycleInfo?.currentPhase?.name;
        if (!phaseName) {
            return null;
        }

        return await this.getMessageForPhase(phaseName);
    }

    /**
     * Get phase metadata without a message
     */
    async getPhaseInfo(phaseName) {
        const messages = await this.loadMessages();
        if (!messages) {
            return null;
        }

        const phaseKey = this.mapPhaseToKey(phaseName);
        const phaseData = messages.phases[phaseKey];
        
        if (!phaseData) {
            return null;
        }

        return {
            phase: phaseData.displayName,
            intent: phaseData.intent,
            temperature: phaseData.temperature,
            urgency: phaseData.urgency,
            messageCount: phaseData.messages.length
        };
    }

    /**
     * Reset used messages for a specific phase or all phases
     */
    resetUsedMessages(phaseName = null) {
        if (phaseName) {
            const phaseKey = this.mapPhaseToKey(phaseName);
            delete this.usedMessages[phaseKey];
        } else {
            this.usedMessages = {};
        }
        this.saveUsedMessages();
    }
}

// Create global instance
window.AxionMessages = new MessagesDatabase();
