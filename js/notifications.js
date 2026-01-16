/**
 * MoodSync - Notifications Module
 * Handles browser notifications and in-app alerts
 */

const NOTIFICATION_TYPES = {
    PHASE_CHANGE: 'phase_change',
    DAILY_TIP: 'daily_tip',
    PERIOD_REMINDER: 'period_reminder',
    PARTNER_ALERT: 'partner_alert'
};

/**
 * Request browser notification permission
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

/**
 * Check if notifications are enabled
 */
function areNotificationsEnabled() {
    return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Show browser notification
 */
function showBrowserNotification(title, options = {}) {
    if (!areNotificationsEnabled()) {
        console.log('Notifications not enabled');
        return null;
    }

    const defaultOptions = {
        icon: '/icons/moodsync-icon.png',
        badge: '/icons/moodsync-badge.png',
        vibrate: [200, 100, 200],
        tag: 'moodsync-notification',
        requireInteraction: false,
        ...options
    };

    return new Notification(title, defaultOptions);
}

/**
 * Show in-app notification toast
 */
function showToast(message, type = 'info', duration = 4000) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast--${type} notification-enter`;
    toast.innerHTML = `
    <div class="toast__icon">${getToastIcon(type)}</div>
    <div class="toast__content">
      <p>${message}</p>
    </div>
    <button class="toast__close" onclick="this.parentElement.remove()">×</button>
  `;

    // Add toast styles if not present
    if (!document.querySelector('#toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
      .toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
      }
      .toast--success { border-left: 4px solid #10B981; }
      .toast--warning { border-left: 4px solid #F59E0B; }
      .toast--error { border-left: 4px solid #EF4444; }
      .toast--info { border-left: 4px solid #8B5CF6; }
      .toast--love { border-left: 4px solid #FF6B8A; }
      .toast__icon { font-size: 24px; }
      .toast__content p { margin: 0; color: #374151; }
      .toast__close {
        background: none;
        border: none;
        font-size: 20px;
        color: #9CA3AF;
        cursor: pointer;
        padding: 0 0 0 12px;
      }
      .toast__close:hover { color: #4B5563; }
      
      @media (max-width: 480px) {
        .toast {
          left: 16px;
          right: 16px;
          bottom: 16px;
        }
      }
    `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.add('notification-exit');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    return toast;
}

/**
 * Get icon for toast type
 */
function getToastIcon(type) {
    const icons = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
        info: '💡',
        love: '💕'
    };
    return icons[type] || icons.info;
}

/**
 * Create partner notification card element
 */
function createNotificationCard(notification) {
    const card = document.createElement('div');
    card.className = 'notification-card notification-enter';
    card.innerHTML = `
    <div class="notification-card__icon" style="background: ${notification.phase ? getPhaseColor(notification.phase) + '20' : 'var(--primary-100)'}">
      ${notification.emoji || '💌'}
    </div>
    <div class="notification-card__content">
      <h4>${notification.title || notification.phase || 'MoodSync Update'}</h4>
      <p>${notification.message}</p>
      ${notification.tip ? `<p class="notification-card__tip" style="margin-top: 8px; font-style: italic; color: var(--neutral-500);">💡 ${notification.tip}</p>` : ''}
    </div>
  `;
    return card;
}

/**
 * Get phase color
 */
function getPhaseColor(phaseName) {
    const colors = {
        'Menstrual': '#FF6B8A',
        'Follicular': '#10B981',
        'Ovulation': '#8B5CF6',
        'Early Luteal': '#F59E0B',
        'Late Luteal (PMS)': '#E84A6F'
    };
    return colors[phaseName] || '#8B5CF6';
}

/**
 * Show partner phase notification
 */
function showPartnerNotification(cycleInfo) {
    const notification = window.MoodSyncCycle.getPartnerNotification(cycleInfo);

    // Show browser notification
    if (areNotificationsEnabled()) {
        showBrowserNotification(`${notification.emoji} MoodSync`, {
            body: notification.message,
            tag: 'moodsync-partner-notification'
        });
    }

    // Show toast
    showToast(notification.message, 'love', 6000);

    return notification;
}

/**
 * Schedule daily check (for when browser supports it)
 */
function scheduleDailyNotification() {
    // This would use Service Workers in a full implementation
    console.log('Daily notification scheduled');
}

// Export for use in other modules
window.MoodSyncNotifications = {
    NOTIFICATION_TYPES,
    requestNotificationPermission,
    areNotificationsEnabled,
    showBrowserNotification,
    showToast,
    createNotificationCard,
    showPartnerNotification,
    scheduleDailyNotification,
    getPhaseColor
};
