/* ================================================
   D&E Shop — Analytics Engine
   User behavior tracking via localStorage
   ================================================ */

const Analytics = {
    KEY: 'ld_analytics',
    SESSION_KEY: 'ld_analytics_session',
    MAX_EVENTS: 500,

    // ── Get / Save Events ──
    getEvents() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY) || '[]');
        } catch (e) {
            // Corrupted data — reset silently to prevent crash loop
            console.warn('[Analytics] Corrupted event store, resetting.', e);
            localStorage.removeItem(this.KEY);
            return [];
        }
    },

    saveEvents(events) {
        try {
            // Keep only last MAX_EVENTS to prevent localStorage overflow
            if (events.length > this.MAX_EVENTS) {
                events = events.slice(events.length - this.MAX_EVENTS);
            }
            localStorage.setItem(this.KEY, JSON.stringify(events));
        } catch (e) {
            // QuotaExceededError — trim and retry once
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                console.warn('[Analytics] localStorage quota exceeded, trimming events.');
                try {
                    const trimmed = events.slice(Math.floor(events.length / 2));
                    localStorage.setItem(this.KEY, JSON.stringify(trimmed));
                } catch (e2) { /* If still fails, skip silently */ }
            }
        }
    },

    // ── Core Track Method ──
    track(type, data = {}) {
        const events = this.getEvents();
        const user = this._getCurrentUser();
        const session = this.getSession();

        events.push({
            type,
            data,
            timestamp: new Date().toISOString(),
            page: window.location.pathname.split('/').pop() || 'index.html',
            user: user ? { email: user.email, name: user.name } : null,
            sessionId: session ? session.id : null
        });

        this.saveEvents(events);
    },

    // ── Session Management ──
    startSession() {
        let session = this.getSession();
        if (!session) {
            session = {
                id: 's' + Date.now(),
                start: new Date().toISOString(),
                pages: []
            };
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            this.track('session_start');
        }
        // Track page visit for current page
        const page = window.location.pathname.split('/').pop() || 'index.html';
        if (!session.pages.includes(page)) {
            session.pages.push(page);
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        }
    },

    getSession() {
        const s = sessionStorage.getItem(this.SESSION_KEY);
        return s ? JSON.parse(s) : null;
    },

    endSession() {
        const session = this.getSession();
        if (session) {
            const start = new Date(session.start);
            const duration = Math.round((Date.now() - start.getTime()) / 1000);
            this.track('session_end', {
                durationSeconds: duration,
                durationFormatted: this._formatDuration(duration),
                pagesVisited: session.pages
            });
        }
    },

    // ── Tracking Helpers ──
    trackPageView(page) {
        this.track('page_view', { page });
    },

    trackProductClick(productId, productName) {
        this.track('product_click', { productId, productName });
    },

    trackProductView(productId, productName) {
        this._productViewStart = Date.now();
        this.track('product_view', { productId, productName });
    },

    trackProductViewEnd(productId, productName) {
        const duration = this._productViewStart
            ? Math.round((Date.now() - this._productViewStart) / 1000)
            : 0;
        this.track('product_view_end', {
            productId,
            productName,
            viewDurationSeconds: duration,
            viewDurationFormatted: this._formatDuration(duration)
        });
    },

    trackAddToCart(productId, productName, qty) {
        this.track('add_to_cart', { productId, productName, qty });
    },

    trackCheckout(cartItems, total, shippingType) {
        this.track('checkout_whatsapp', {
            items: cartItems,
            total,
            shippingType,
            itemCount: cartItems.length
        });
    },

    trackRegistration(email, name) {
        this.track('registration', {
            email,
            name,
            isGmail: email.toLowerCase().includes('@gmail.com'),
            provider: this._getEmailProvider(email)
        });
    },

    trackLogin(email) {
        this.track('login', {
            email,
            isGmail: email.toLowerCase().includes('@gmail.com'),
            provider: this._getEmailProvider(email)
        });
    },

    trackSearch(term) {
        if (term && term.trim().length > 0) {
            // SECURITY: Cap search term length to prevent storage abuse
            const safeTerm = term.trim().toLowerCase().substring(0, 100);
            this.track('search', { term: safeTerm });
        }
    },

    // ── Stats / Aggregation for Dashboard ──
    getStats() {
        const events = this.getEvents();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Filter events by time period
        const todayEvents = events.filter(e => new Date(e.timestamp) >= today);
        const weekEvents = events.filter(e => new Date(e.timestamp) >= weekAgo);

        return {
            total: {
                pageViews: events.filter(e => e.type === 'page_view').length,
                sessions: events.filter(e => e.type === 'session_start').length,
                productClicks: events.filter(e => e.type === 'product_click').length,
                productViews: events.filter(e => e.type === 'product_view').length,
                addToCarts: events.filter(e => e.type === 'add_to_cart').length,
                checkouts: events.filter(e => e.type === 'checkout_whatsapp').length,
                registrations: events.filter(e => e.type === 'registration').length,
                logins: events.filter(e => e.type === 'login').length,
                searches: events.filter(e => e.type === 'search').length
            },
            today: {
                pageViews: todayEvents.filter(e => e.type === 'page_view').length,
                sessions: todayEvents.filter(e => e.type === 'session_start').length,
                checkouts: todayEvents.filter(e => e.type === 'checkout_whatsapp').length
            },
            week: {
                pageViews: weekEvents.filter(e => e.type === 'page_view').length,
                sessions: weekEvents.filter(e => e.type === 'session_start').length,
                checkouts: weekEvents.filter(e => e.type === 'checkout_whatsapp').length
            },
            avgSessionDuration: this._calcAvgSessionDuration(events),
            topProducts: this._getTopItems(events, 'product_view', 'productName', 10),
            topCartProducts: this._getTopItems(events, 'add_to_cart', 'productName', 10),
            topSearches: this._getTopItems(events, 'search', 'term', 10),
            topPages: this._getTopItems(events, 'page_view', 'page', 10),
            gmailUsers: this._getGmailUsers(events),
            recentEvents: events.slice(-50).reverse(),
            registeredUsers: this._getRegisteredUsers(events),
            loginHistory: this._getLoginHistory(events)
        };
    },

    // ── Private Helpers ──
    _getCurrentUser() {
        try {
            const u = localStorage.getItem('ld_current_user');
            return u ? JSON.parse(u) : null;
        } catch { return null; }
    },

    _getEmailProvider(email) {
        const domain = email.split('@')[1] || '';
        if (domain.includes('gmail')) return 'Gmail';
        if (domain.includes('hotmail') || domain.includes('outlook') || domain.includes('live')) return 'Outlook/Hotmail';
        if (domain.includes('yahoo')) return 'Yahoo';
        if (domain.includes('icloud')) return 'iCloud';
        return domain;
    },

    _formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins < 60) return `${mins}m ${secs}s`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ${mins % 60}m`;
    },

    _calcAvgSessionDuration(events) {
        const endEvents = events.filter(e => e.type === 'session_end' && e.data.durationSeconds);
        if (endEvents.length === 0) return '—';
        const avg = endEvents.reduce((sum, e) => sum + e.data.durationSeconds, 0) / endEvents.length;
        return this._formatDuration(Math.round(avg));
    },

    _getTopItems(events, eventType, dataField, limit) {
        const counts = {};
        events.filter(e => e.type === eventType).forEach(e => {
            const key = e.data[dataField];
            if (key) {
                if (!counts[key]) counts[key] = { name: key, count: 0 };
                counts[key].count++;
            }
        });
        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    },

    _getGmailUsers(events) {
        const gmailRegs = events.filter(e => e.type === 'registration' && e.data.isGmail);
        return gmailRegs.map(e => ({
            email: e.data.email,
            name: e.data.name,
            date: e.timestamp
        }));
    },

    _getRegisteredUsers(events) {
        const regs = events.filter(e => e.type === 'registration');
        return regs.map(e => ({
            email: e.data.email,
            name: e.data.name,
            provider: e.data.provider,
            isGmail: e.data.isGmail,
            date: e.timestamp
        }));
    },

    _getLoginHistory(events) {
        const logins = events.filter(e => e.type === 'login');
        // Group by email
        const grouped = {};
        logins.forEach(e => {
            if (!grouped[e.data.email]) {
                grouped[e.data.email] = { email: e.data.email, count: 0, lastLogin: null, provider: e.data.provider };
            }
            grouped[e.data.email].count++;
            grouped[e.data.email].lastLogin = e.timestamp;
        });
        return Object.values(grouped).sort((a, b) => b.count - a.count);
    },

    // ── Clear all analytics ──
    clearAll() {
        localStorage.removeItem(this.KEY);
        sessionStorage.removeItem(this.SESSION_KEY);
    }
};

// Auto-start session and track page unload
document.addEventListener('DOMContentLoaded', () => {
    Analytics.startSession();
    Analytics.trackPageView(window.location.pathname.split('/').pop() || 'index.html');
});

window.addEventListener('beforeunload', () => {
    Analytics.endSession();
});
