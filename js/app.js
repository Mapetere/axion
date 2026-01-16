/**
 * MoodSync - Main App Module
 * Handles app initialization, navigation, and global state
 */

// App State
const AppState = {
    currentPage: 'home',
    isInitialized: false,
    user: null,
    partner: null
};

/**
 * Initialize the app
 */
function initApp() {
    console.log('🌸 MoodSync initializing...');

    // Load user data
    AppState.user = window.MoodSyncStorage.getUserProfile();
    AppState.partner = window.MoodSyncStorage.getPartnerProfile();

    // Set up event listeners
    setupEventListeners();

    // Request notification permission
    window.MoodSyncNotifications.requestNotificationPermission();

    AppState.isInitialized = true;
    console.log('✨ MoodSync ready!');
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
        const navLink = e.target.closest('[data-nav]');
        if (navLink) {
            e.preventDefault();
            navigateTo(navLink.dataset.nav);
        }
    });

    // Handle form submissions
    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (form.id === 'onboarding-form') {
            e.preventDefault();
            handleOnboardingSubmit(form);
        } else if (form.id === 'partner-link-form') {
            e.preventDefault();
            handlePartnerLinkSubmit(form);
        } else if (form.id === 'log-period-form') {
            e.preventDefault();
            handleLogPeriodSubmit(form);
        }
    });
}

/**
 * Navigate to a page
 */
function navigateTo(page) {
    // Check if we're in the pages folder
    const inPagesFolder = window.location.pathname.includes('/pages/');

    const pages = {
        'home': inPagesFolder ? '../index.html' : 'index.html',
        'onboarding': inPagesFolder ? 'onboarding.html' : 'pages/onboarding.html',
        'dashboard': inPagesFolder ? 'dashboard.html' : 'pages/dashboard.html',
        'partner': inPagesFolder ? 'partner.html' : 'pages/partner.html',
        'settings': inPagesFolder ? 'settings.html' : 'pages/settings.html'
    };

    if (pages[page]) {
        window.location.href = pages[page];
    }
}

/**
 * Handle onboarding form submission
 */
function handleOnboardingSubmit(form) {
    const formData = new FormData(form);
    const name = formData.get('name');
    const cycleLength = formData.get('cycleLength');
    const lastPeriodDate = formData.get('lastPeriodDate');

    if (!name || !lastPeriodDate) {
        window.MoodSyncNotifications.showToast('Please fill in all required fields', 'warning');
        return;
    }

    // Create user profile
    const profile = window.MoodSyncStorage.createUserProfile(name, cycleLength, lastPeriodDate);
    AppState.user = profile;

    // Generate link code
    const linkCode = window.MoodSyncStorage.generateLinkCode();

    window.MoodSyncNotifications.showToast('Profile created successfully! 🎉', 'success');

    // Navigate to dashboard after short delay
    setTimeout(() => {
        navigateTo('dashboard');
    }, 1500);
}

/**
 * Handle partner link form submission
 */
function handlePartnerLinkSubmit(form) {
    const formData = new FormData(form);
    const name = formData.get('name');
    const linkCode = formData.get('linkCode');

    if (!name || !linkCode) {
        window.MoodSyncNotifications.showToast('Please fill in all fields', 'warning');
        return;
    }

    // Validate link code
    if (!window.MoodSyncStorage.validateLinkCode(linkCode)) {
        window.MoodSyncNotifications.showToast('Invalid link code. Please check and try again.', 'error');
        return;
    }

    // Create partner profile
    const partner = window.MoodSyncStorage.createPartnerProfile(name, linkCode);
    AppState.partner = partner;

    window.MoodSyncNotifications.showToast('Successfully linked! 💕', 'love');

    // Navigate to partner dashboard
    setTimeout(() => {
        navigateTo('partner');
    }, 1500);
}

/**
 * Handle log period form submission
 */
function handleLogPeriodSubmit(form) {
    const formData = new FormData(form);
    const startDate = formData.get('startDate');
    const notes = formData.get('notes') || '';

    if (!startDate) {
        window.MoodSyncNotifications.showToast('Please select a date', 'warning');
        return;
    }

    // Log period
    window.MoodSyncStorage.logPeriod(startDate, notes);
    AppState.user = window.MoodSyncStorage.getUserProfile();

    window.MoodSyncNotifications.showToast('Period logged! 🌸', 'love');

    // Refresh dashboard if on dashboard page
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }

    // Close modal if exists
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Render cycle wheel
 */
function renderCycleWheel(containerId, cycleInfo) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { currentDay, cycleLength, currentPhase } = cycleInfo;
    const progress = (currentDay / cycleLength) * 360;

    container.innerHTML = `
    <div class="cycle-wheel cycle-wheel-animated" style="--progress: ${progress}deg">
      <div class="cycle-wheel__marker cycle-wheel-marker" style="transform: rotate(${progress - 90}deg) translateY(-130px)"></div>
      <div class="cycle-wheel__inner">
        <span class="cycle-wheel__day">${currentDay}</span>
        <span class="cycle-wheel__label">Day of ${cycleLength}</span>
        <span class="badge badge--primary" style="margin-top: 8px;">
          ${currentPhase.emoji} ${currentPhase.name}
        </span>
      </div>
    </div>
  `;
}

/**
 * Check if device is mobile
 */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Format relative time
 */
function formatRelativeTime(date) {
    const now = new Date();
    const target = new Date(date);
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
}

/**
 * Show modal
 */
function showModal(content, options = {}) {
    // Remove existing modal
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) existingModal.remove();

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
    <div class="modal glass-card animate-fade-in-scale" style="max-width: ${options.width || '500px'}">
      ${options.title ? `<h3 style="margin-bottom: var(--space-4)">${options.title}</h3>` : ''}
      <div class="modal__content">${content}</div>
      ${options.showClose !== false ? `<button class="modal__close" onclick="closeModal()">×</button>` : ''}
    </div>
  `;

    // Add modal styles
    if (!document.querySelector('#modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        backdrop-filter: blur(4px);
      }
      .modal {
        position: relative;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
      }
      .modal__close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        color: var(--neutral-400);
        cursor: pointer;
      }
      .modal__close:hover { color: var(--neutral-600); }
    `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(modalOverlay);

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.querySelector('.modal').classList.add('notification-exit');
        setTimeout(() => modal.remove(), 300);
    }
}

// Export for use in other modules
window.MoodSyncApp = {
    AppState,
    initApp,
    navigateTo,
    renderCycleWheel,
    isMobile,
    formatRelativeTime,
    showModal,
    closeModal
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initApp);
