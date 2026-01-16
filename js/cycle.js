/**
 * Axion - Cycle Prediction Engine
 * Calculates current cycle phase and generates appropriate messages
 */

const CYCLE_PHASES = {
    MENSTRUAL: {
        name: 'Menstrual',
        emoji: '',
        icon: 'rest',
        color: '#FF6B8A',
        days: [1, 5],
        partnerMessage: "She might appreciate extra comfort and rest today",
        partnerTip: "Consider bringing her favorite comfort food, offer a cozy movie night, or simply let her know you're there for her.",
        userMessage: "Take it easy and prioritize self-care today",
        mood: 'low-energy'
    },
    FOLLICULAR: {
        name: 'Follicular',
        emoji: '',
        icon: 'energy',
        color: '#10B981',
        days: [6, 13],
        partnerMessage: "Her energy is rising - great time for activities together",
        partnerTip: "Plan something active or creative. She'll likely be up for adventures, trying new things, or tackling projects together.",
        userMessage: "You're entering your power phase - energy is building",
        mood: 'rising'
    },
    OVULATION: {
        name: 'Ovulation',
        emoji: '',
        icon: 'peak',
        color: '#8B5CF6',
        days: [14, 16],
        partnerMessage: "Peak energy and mood - perfect time for a special date",
        partnerTip: "This is prime time for romance. Plan a surprise date, have meaningful conversations, or enjoy social activities together.",
        userMessage: "You're at your peak - high energy and confidence today",
        mood: 'peak'
    },
    LUTEAL_EARLY: {
        name: 'Early Luteal',
        emoji: '',
        icon: 'stable',
        color: '#F59E0B',
        days: [17, 22],
        partnerMessage: "Still feeling good - enjoy quality time together",
        partnerTip: "Great time for cozy home activities, deeper conversations, and showing affection through small gestures.",
        userMessage: "Steady energy - a good time for productivity",
        mood: 'stable'
    },
    LUTEAL_LATE: {
        name: 'Pre-menstrual',
        emoji: '',
        icon: 'gentle',
        color: '#E84A6F',
        days: [23, 35],
        partnerMessage: "Extra patience and sweetness goes a long way right now",
        partnerTip: "Be extra understanding, avoid starting difficult conversations, surprise her with something thoughtful, and give her space when needed.",
        userMessage: "PMS phase - be gentle with yourself, it's okay to feel emotional",
        mood: 'sensitive'
    }
};

/**
 * Calculate days since last period
 */
function daysSinceLastPeriod(lastPeriodDate) {
    const last = new Date(lastPeriodDate);
    const today = new Date();
    const diffTime = Math.abs(today - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Get current cycle day (1-indexed)
 */
function getCurrentCycleDay(lastPeriodDate, cycleLength = 28) {
    const daysSince = daysSinceLastPeriod(lastPeriodDate);
    return ((daysSince - 1) % cycleLength) + 1;
}

/**
 * Get current phase based on cycle day
 */
function getCurrentPhase(cycleDay, cycleLength = 28) {
    // Adjust phase days proportionally if cycle length differs from 28
    const ratio = cycleLength / 28;

    if (cycleDay <= 5) {
        return CYCLE_PHASES.MENSTRUAL;
    } else if (cycleDay <= Math.round(13 * ratio)) {
        return CYCLE_PHASES.FOLLICULAR;
    } else if (cycleDay <= Math.round(16 * ratio)) {
        return CYCLE_PHASES.OVULATION;
    } else if (cycleDay <= Math.round(22 * ratio)) {
        return CYCLE_PHASES.LUTEAL_EARLY;
    } else {
        return CYCLE_PHASES.LUTEAL_LATE;
    }
}

/**
 * Predict next period date
 */
function predictNextPeriod(lastPeriodDate, cycleLength = 28) {
    const last = new Date(lastPeriodDate);
    const next = new Date(last);
    next.setDate(next.getDate() + cycleLength);
    return next;
}

/**
 * Get days until next period
 */
function daysUntilNextPeriod(lastPeriodDate, cycleLength = 28) {
    const next = predictNextPeriod(lastPeriodDate, cycleLength);
    const today = new Date();
    const diffTime = next - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

/**
 * Get cycle info object
 */
function getCycleInfo(lastPeriodDate, cycleLength = 28) {
    const currentDay = getCurrentCycleDay(lastPeriodDate, cycleLength);
    const currentPhase = getCurrentPhase(currentDay, cycleLength);
    const daysUntilNext = daysUntilNextPeriod(lastPeriodDate, cycleLength);
    const nextPeriod = predictNextPeriod(lastPeriodDate, cycleLength);

    return {
        currentDay,
        cycleLength,
        currentPhase,
        daysUntilNext,
        nextPeriod,
        lastPeriod: new Date(lastPeriodDate)
    };
}

/**
 * Format date for display
 */
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Get phase progress percentage
 */
function getPhaseProgress(cycleDay, cycleLength = 28) {
    return Math.round((cycleDay / cycleLength) * 100);
}

/**
 * Generate partner notification based on current phase
 */
function getPartnerNotification(cycleInfo) {
    const { currentPhase, daysUntilNext, currentDay } = cycleInfo;

    let urgency = 'normal';
    if (currentPhase === CYCLE_PHASES.LUTEAL_LATE && daysUntilNext <= 3) {
        urgency = 'high';
    } else if (currentPhase === CYCLE_PHASES.OVULATION) {
        urgency = 'positive';
    }

    return {
        phase: currentPhase.name,
        emoji: currentPhase.emoji,
        message: currentPhase.partnerMessage,
        tip: currentPhase.partnerTip,
        urgency,
        cycleDay: currentDay
    };
}

// Export for use in other modules
window.AxionCycle = {
    CYCLE_PHASES,
    daysSinceLastPeriod,
    getCurrentCycleDay,
    getCurrentPhase,
    predictNextPeriod,
    daysUntilNextPeriod,
    getCycleInfo,
    formatDate,
    getPhaseProgress,
    getPartnerNotification,
    getPartnerNotificationAsync
};
// Legacy alias
window.MoodSyncCycle = window.AxionCycle;
