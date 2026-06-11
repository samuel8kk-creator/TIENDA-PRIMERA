/* ================================================
   Away — Lazy Gallery Engine  v2.0
   Security-hardened, 3G-resilient, error-tolerant
   ================================================ */

const LazyGallery = (() => {

    /* ── Configuration ── */
    const CONFIG = {
        rootMargin: '0px 0px 150px 0px',  // Pre-load 150px before viewport
        threshold: 0.05,
        fadeInClass: 'img-visible',
        lazyAttr: 'data-lazy-src',
        loadedAttr: 'data-loaded',
        skeletonClass: 'img-skeleton',
        cardAnimClass: 'card-reveal',
        loadTimeout: 8000,                  // 8s timeout (handles slow 3G/4G)
        // Elegant SHEIN-style placeholder – local SVG, zero bandwidth
        PLACEHOLDER: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23f4f3ff'/%3E%3Crect x='150' y='150' width='100' height='120' rx='10' fill='%23e2dff5'/%3E%3Ccircle cx='200' cy='130' r='30' fill='%23e2dff5'/%3E%3Ctext x='200' y='320' font-family='Arial' font-size='14' fill='%239d95c0' text-anchor='middle'%3ED%26amp%3BE Shop%3C/text%3E%3Ctext x='200' y='342' font-family='Arial' font-size='11' fill='%23c4bfe8' text-anchor='middle'%3EImagen no disponible%3C/text%3E%3C/svg%3E`,
    };

    let imageObserver = null;
    let cardObserver = null;

    /* ──────────────────────────────────────────────
       SECURITY: Validate URL before loading
       Prevents javascript: and data: URI phishing
    ────────────────────────────────────────────── */
    function isSafeUrl(url) {
        if (!url || typeof url !== 'string') return false;
        const trimmed = url.trim().toLowerCase();
        // Allow https, http, and data:image (for legitimate base64 images)
        if (trimmed.startsWith('javascript:')) return false;
        if (trimmed.startsWith('vbscript:')) return false;
        // data: is OK only for image/* MIME types
        if (trimmed.startsWith('data:') && !trimmed.startsWith('data:image/')) return false;
        return true;
    }

    /* ──────────────────────────────────────────────
       PERFORMANCE: Load image with timeout
       Fixes: hanging requests on 3G / slow connections
    ────────────────────────────────────────────── */
    function loadImageWithTimeout(src, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('timeout'));
            }, timeout);

            const img = new Image();
            img.onload = () => { clearTimeout(timer); resolve(img); };
            img.onerror = () => { clearTimeout(timer); reject(new Error('error')); };
            img.src = src;
        });
    }

    /* ──────────────────────────────────────────────
       CORE: Apply the loaded image to the DOM element
    ────────────────────────────────────────────── */
    function applyLoadedImage(imgEl, src) {
        imgEl.src = src;
        imgEl.setAttribute(CONFIG.loadedAttr, 'true');
        imgEl.classList.remove(CONFIG.skeletonClass);
        // Double rAF ensures the browser has painted before animating
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                imgEl.classList.add(CONFIG.fadeInClass);
            });
        });
    }

    /* ──────────────────────────────────────────────
       CORE: Apply placeholder (404 / timeout / unsafe URL)
    ────────────────────────────────────────────── */
    function applyPlaceholder(imgEl, reason) {
        console.warn(`[LazyGallery] Image load failed (${reason}):`, imgEl.getAttribute(CONFIG.lazyAttr));
        imgEl.src = CONFIG.PLACEHOLDER;
        imgEl.setAttribute(CONFIG.loadedAttr, 'true');
        imgEl.setAttribute('alt', 'Imagen no disponible');
        imgEl.classList.remove(CONFIG.skeletonClass);
        imgEl.classList.add(CONFIG.fadeInClass);
    }

    /* ──────────────────────────────────────────────
       BUILD: IntersectionObserver for IMAGES
    ────────────────────────────────────────────── */
    function buildImageObserver() {
        if (!('IntersectionObserver' in window)) return null;

        return new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const imgEl = entry.target;

                // Skip already-loaded
                if (imgEl.getAttribute(CONFIG.loadedAttr) === 'true') {
                    observer.unobserve(imgEl);
                    return;
                }

                const realSrc = imgEl.getAttribute(CONFIG.lazyAttr);

                // SECURITY: Reject unsafe URLs
                if (!isSafeUrl(realSrc)) {
                    applyPlaceholder(imgEl, 'unsafe-url');
                    observer.unobserve(imgEl);
                    return;
                }

                observer.unobserve(imgEl); // Unobserve immediately to prevent double-load

                // PERFORMANCE: Load with timeout guard for slow connections
                loadImageWithTimeout(realSrc, CONFIG.loadTimeout)
                    .then(() => {
                        applyLoadedImage(imgEl, realSrc);
                    })
                    .catch(err => {
                        applyPlaceholder(imgEl, err.message);
                    });
            });
        }, {
            rootMargin: CONFIG.rootMargin,
            threshold: CONFIG.threshold,
        });
    }

    /* ──────────────────────────────────────────────
       BUILD: IntersectionObserver for CARDS (stagger reveal)
    ────────────────────────────────────────────── */
    function buildCardObserver() {
        if (!('IntersectionObserver' in window)) return null;

        return new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const card = entry.target;
                card.classList.add(CONFIG.cardAnimClass);
                observer.unobserve(card);
            });
        }, {
            rootMargin: '0px 0px 60px 0px',
            threshold: 0.08,
        });
    }

    /* ──────────────────────────────────────────────
       PUBLIC: init() — call after every grid re-render
    ────────────────────────────────────────────── */
    function init() {
        try {
            // Tear down stale observers (prevents memory leaks on re-render)
            if (imageObserver) { imageObserver.disconnect(); imageObserver = null; }
            if (cardObserver) { cardObserver.disconnect(); cardObserver = null; }

            imageObserver = buildImageObserver();
            cardObserver = buildCardObserver();

            observeAll();
        } catch (err) {
            // Never crash the store if lazy loading has an internal error
            console.error('[LazyGallery] init failed:', err);
            _fallbackLoadAll(); // Load all images immediately as fallback
        }
    }

    /* ──────────────────────────────────────────────
       PUBLIC: observeAll() — observe pending elements
    ────────────────────────────────────────────── */
    function observeAll() {
        // 1. Lazy images
        const lazyImgs = document.querySelectorAll(
            `[${CONFIG.lazyAttr}]:not([${CONFIG.loadedAttr}="true"])`
        );

        lazyImgs.forEach(img => {
            if (imageObserver) {
                imageObserver.observe(img);
            } else {
                // IO not supported → load everything immediately
                const src = img.getAttribute(CONFIG.lazyAttr);
                if (isSafeUrl(src)) {
                    applyLoadedImage(img, src);
                } else {
                    applyPlaceholder(img, 'unsafe-url');
                }
            }
        });

        // 2. Product cards — stagger delay based on column position (0–3)
        const cards = document.querySelectorAll(
            `.product-card:not(.${CONFIG.cardAnimClass})`
        );

        cards.forEach((card, i) => {
            card.style.setProperty('--reveal-delay', `${(i % 4) * 0.08}s`);
            if (cardObserver) {
                cardObserver.observe(card);
            } else {
                card.classList.add(CONFIG.cardAnimClass);
            }
        });
    }

    /* ──────────────────────────────────────────────
       PRIVATE: Fallback — load all images without IO
       Used when IO is unsupported or init() errors
    ────────────────────────────────────────────── */
    function _fallbackLoadAll() {
        document.querySelectorAll(`[${CONFIG.lazyAttr}]`).forEach(img => {
            try {
                const src = img.getAttribute(CONFIG.lazyAttr);
                if (isSafeUrl(src)) {
                    img.src = src;
                } else {
                    img.src = CONFIG.PLACEHOLDER;
                }
                img.classList.remove(CONFIG.skeletonClass);
                img.classList.add(CONFIG.fadeInClass, CONFIG.cardAnimClass);
                img.setAttribute(CONFIG.loadedAttr, 'true');
            } catch (e) { /* silent */ }
        });
        document.querySelectorAll('.product-card').forEach(card => {
            card.classList.add(CONFIG.cardAnimClass);
        });
    }

    /* ── Public API ── */
    return { init, observeAll };

})();
