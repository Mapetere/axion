/**
 * MoodSync - Desktop Notifications Manager
 * Handles scheduling and sending real desktop notifications
 */

class DesktopNotificationManager {
    constructor() {
        this.isSupported = 'Notification' in window;
        this.permission = this.isSupported ? Notification.permission : 'denied';
        this.checkInterval = null;
        this.lastNotificationTime = null;
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!this.isSupported) {
            console.log('Desktop notifications not supported');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const result = await Notification.requestPermission();
            this.permission = result;
            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Send a desktop notification
     */
    sendNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            console.log('Notification permission not granted');
            return null;
        }

        const defaultOptions = {
            vibrate: [200, 100, 200],
            requireInteraction: false,
            silent: false,
            ...options
        };

        try {
            const notification = new Notification(title, defaultOptions);

            notification.onclick = () => {
                window.focus();
                notification.close();
                if (options.onClick) options.onClick();
            };

            notification.onclose = () => {
                if (options.onClose) options.onClose();
            };

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }

    /**
     * Send partner notification based on cycle phase
     */
    sendPartnerNotification(cycleInfo) {
        const notification = window.MoodSyncCycle.getPartnerNotification(cycleInfo);

        return this.sendNotification('MoodSync', {
            body: notification.message,
            tag: 'moodsync-partner',
            requireInteraction: true,
            onClick: () => {
                window.location.href = window.location.pathname.includes('/pages/')
                    ? 'partner.html'
                    : 'pages/partner.html';
            }
        });
    }

    /**
     * Start daily notification check
     * Checks every hour and sends notification once per day
     */
    startDailyCheck() {
        // Check immediately
        this.checkAndNotify();

        // Then check every hour
        this.checkInterval = setInterval(() => {
            this.checkAndNotify();
        }, 60 * 60 * 1000); // 1 hour
    }

    /**
     * Stop daily checks
     */
    stopDailyCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Check if notification should be sent today
     */
    checkAndNotify() {
        const today = new Date().toDateString();
        const lastNotified = localStorage.getItem('moodsync_last_notification');

        // Only notify once per day
        if (lastNotified === today) {
            return;
        }

        // Check if we have user data
        const user = window.MoodSyncStorage?.getUserProfile();
        if (!user || !user.lastPeriodDate) {
            return;
        }

        // Get cycle info and send notification
        const cycleInfo = window.MoodSyncCycle.getCycleInfo(user.lastPeriodDate, user.cycleLength);
        this.sendPartnerNotification(cycleInfo);

        // Mark as notified today
        localStorage.setItem('moodsync_last_notification', today);
        this.lastNotificationTime = new Date();
    }

    /**
     * Schedule a notification for a specific time
     */
    scheduleNotification(title, options, delayMs) {
        return setTimeout(() => {
            this.sendNotification(title, options);
        }, delayMs);
    }

    /**
     * Send test notification
     */
    sendTestNotification() {
        return this.sendNotification('MoodSync Test', {
            body: 'Desktop notifications are working. Your partner will receive updates like this.',
            requireInteraction: false
        });
    }
}

// Create global instance
window.DesktopNotifications = new DesktopNotificationManager();

// Register Service Worker if available
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('MoodSync Service Worker registered:', registration.scope);

            // Request periodic sync for daily notifications
            if ('periodicSync' in registration) {
                try {
                    await registration.periodicSync.register('moodsync-daily-check', {
                        minInterval: 24 * 60 * 60 * 1000 // 24 hours
                    });
                    console.log('Periodic sync registered');
                } catch (error) {
                    console.log('Periodic sync not available:', error);
                }
            }
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    });
}
