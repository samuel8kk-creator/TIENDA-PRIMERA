/* ================================================
   D&E Shop — Core Application
   Data management, shared utilities, init
   ================================================ */

const App = {
    // ── Data Keys ──
    KEYS: {
        PRODUCTS: 'ld_products',
        CATEGORIES: 'ld_categories',
        CART: 'ld_cart',
        CUSTOMERS: 'ld_customers',
        CURRENT_USER: 'ld_current_user',
        BANNERS: 'ld_banners',
        ADMIN_LOGGED: 'ld_admin_logged',
        INITIALIZED: 'ld_initialized',
        ORDERS: 'ld_orders',
        SUPPLIERS: 'ld_suppliers',
        SUPPLIER_PRODUCTS: 'ld_supplier_products'
    },

    // ── SUPABASE ──
    supabase: null,
    isSyncing: false,
    isReady: false,
    isOnline: true,

    // Cache Config
    CACHE: {
        TIMESTAMP: 'ld_sync_timestamp',
        TTL: 5 * 60 * 1000 // 5 minutos
    },

    // Mapper between JS (camelCase) and DB (snake_case)
    _mapToDB(col, data) {
        if (!data) return data;
        if (col === 'products') {
            return {
                id: data.id,
                name: data.name,
                description: data.description,
                price: data.price,
                old_price: data.oldPrice,
                category: data.category,
                stock: data.stock,
                badge: data.badge,
                badge_type: data.badgeType,
                image: data.image,
                images: data.images,
                variants: data.sizeVariants,
                reviews: data.reviews,
                similar_ids: data.similarIds
            };
        }
        if (col === 'categories') {
            return {
                id: data.id,
                name: data.name,
                emoji: data.emoji,
                image: data.image,
                is_active: data.isActive,
                is_permanent: data.isPermanent
            };
        }
        if (col === 'orders') {
            return {
                id: data.id,
                date: data.date,
                status: data.status,
                customer_name: data.customer ? data.customer.name : null,
                customer_email: data.customer ? data.customer.email : null,
                items: data.items,
                subtotal: data.subtotal,
                shipping_cost: data.shipping,
                total: data.total,
                shipping_type: data.shippingType
            };
        }
        if (col === 'customers' || col === 'profiles') {
            return {
                id: data.id,
                full_name: data.name || data.fullName,
                email: data.email,
                password: data.password,
                phone_number: data.phone || data.phoneNumber,
                province: data.province,
                city: data.city,
                street_name: data.streetName,
                house_number: data.houseNumber,
                postal_code: data.postalCode,
                address_references: data.addressReferences,
                cart: data.cart || [],
                registered_at: data.registered
            };
        }
        return data;
    },

    _mapFromDB(col, data) {
        if (!data) return data;
        if (col === 'products') {
            return {
                id: data.id,
                name: data.name,
                description: data.description,
                price: data.price,
                oldPrice: data.old_price,
                category: data.category,
                stock: data.stock,
                badge: data.badge,
                badgeType: data.badge_type,
                image: data.image,
                images: data.images,
                sizeVariants: data.variants,
                reviews: data.reviews,
                similarIds: data.similar_ids
            };
        }
        if (col === 'categories') {
            return {
                id: data.id,
                name: data.name,
                emoji: data.emoji,
                image: data.image,
                isActive: data.is_active,
                isPermanent: data.is_permanent
            };
        }
        if (col === 'orders') {
            return {
                id: data.id,
                date: data.date,
                status: data.status,
                customer: (data.customer_name || data.customer_email) ? {
                    name: data.customer_name,
                    email: data.customer_email,
                    phone: data.phone
                } : null,
                items: data.items,
                subtotal: data.subtotal,
                shipping: data.shipping_cost,
                total: data.total,
                shippingType: data.shipping_type
            };
        }
        if (col === 'customers' || col === 'profiles') {
            return {
                id: data.id,
                name: data.full_name || data.name,
                fullName: data.full_name,
                email: data.email,
                password: data.password,
                phone: data.phone_number || data.phone,
                phoneNumber: data.phone_number,
                province: data.province,
                city: data.city,
                streetName: data.street_name,
                houseNumber: data.house_number,
                postalCode: data.postal_code,
                addressReferences: data.address_references,
                cart: data.cart || [],
                registered: data.registered_at
            };
        }
        return data;
    },

    initSupabase() {
        if (!window.supabase || !window.SUPABASE_CONFIG) {
            console.warn('[App] Supabase no configurado o cargado');
            return;
        }
        try {
            this.supabase = supabase.createClient(window.SUPABASE_CONFIG.URL, window.SUPABASE_CONFIG.KEY);
            console.log('[App] Supabase Inicializado');
            this.setupRealtimeSubscriptions();
        } catch (e) {
            console.error('[App] Error al inicializar Supabase:', e);
        }
    },

    setupRealtimeSubscriptions() {
        if (!this.supabase) return;
        
        const channel = this.supabase.channel('public-changes');
        
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
            console.log('[Realtime] Cambio en products:', payload);
            this.handleRealtimeUpdate('products', payload);
        });

        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, payload => {
            console.log('[Realtime] Cambio en categories:', payload);
            this.handleRealtimeUpdate('categories', payload);
        });

        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, payload => {
            console.log('[Realtime] Cambio en banners:', payload);
            this.handleRealtimeUpdate('banners', payload);
        });

        channel.subscribe(status => {
            if (status === 'SUBSCRIBED') {
                console.log('[App] Realtime subscrito correctamente');
            }
        });
    },

    handleRealtimeUpdate(table, payload) {
        // Skip updates we just did ourselves if syncing
        const { eventType, new: dbRecord, old: oldDbRecord } = payload;
        const newRecord = this._mapFromDB(table, dbRecord);
        const oldRecord = this._mapFromDB(table, oldDbRecord);
        
        if (table === 'products') {
            let items = this.getProducts();
            if (eventType === 'INSERT') {
                if (!items.find(i => i.id === newRecord.id)) items.push(newRecord);
            } else if (eventType === 'UPDATE') {
                const idx = items.findIndex(i => i.id === newRecord.id);
                if (idx !== -1) items[idx] = newRecord;
                else items.push(newRecord);
            } else if (eventType === 'DELETE') {
                items = items.filter(i => i.id !== oldRecord.id);
            }
            localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(items));
            window.dispatchEvent(new CustomEvent('products-updated'));
        } 
        else if (table === 'categories') {
            let items = this.getCategories();
            if (eventType === 'INSERT') {
                if (!items.find(i => i.id === newRecord.id)) items.push(newRecord);
            } else if (eventType === 'UPDATE') {
                const idx = items.findIndex(i => i.id === newRecord.id);
                if (idx !== -1) items[idx] = newRecord;
                else items.push(newRecord);
            } else if (eventType === 'DELETE') {
                items = items.filter(i => i.id !== oldRecord.id);
            }
            localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(items));
            window.dispatchEvent(new CustomEvent('categories-updated'));
        }
        else if (table === 'banners') {
            if ((eventType === 'UPDATE' || eventType === 'INSERT') && newRecord.id === 'main') {
                localStorage.setItem(this.KEYS.BANNERS, JSON.stringify(newRecord.data));
                window.dispatchEvent(new CustomEvent('banners-updated'));
            }
        }
    },

    async syncWithSupabase() {
        if (!this.supabase) return;

        // Implementation of Cache TTL
        const lastSync = localStorage.getItem(this.CACHE.TIMESTAMP);
        const isAdmin = await this.isAdminLogged();
        if (lastSync && (Date.now() - lastSync < this.CACHE.TTL) && !isAdmin) {
            console.log('[App] Usando catálogo desde caché local');
            return;
        }

        this.isSyncing = true;
        try {
            const collections = ['products', 'categories', 'banners', 'orders', 'customers'];
            const syncPromises = collections.map(async (col) => {
                const { data, error } = await this.supabase.from(col).select('*');
                if (!error && data && data.length > 0) {
                    const storageKey = this.KEYS[col.toUpperCase()];
                    // Banners special handling (usually one row 'main')
                    if (col === 'banners') {
                        localStorage.setItem(storageKey, JSON.stringify(data[0].data));
                    } else {
                        const mappedData = data.map(item => this._mapFromDB(col, item));
                        localStorage.setItem(storageKey, JSON.stringify(mappedData));
                    }
                } else if (error) {
                    console.warn(`[App] Error syncing ${col}:`, error.message);
                } else {
                    // Si está vacío en la nube, pero tenemos datos locales (seed), los subimos
                    await this.uploadInitialData(col);
                }
            });
            await Promise.all(syncPromises);
            localStorage.setItem(this.CACHE.TIMESTAMP, Date.now());
            console.log('[App] Sincronización completa');
        } catch (e) {
            console.error('[App] Error de sincronización:', e);
            this.showToast('Error de conexión. Trabajando en modo local 📴', 'info');
        } finally {
            this.isSyncing = false;
        }
    },

    async uploadInitialData(col) {
        if (!this.supabase) return;
        const key = this.KEYS[col.toUpperCase()];
        const localData = JSON.parse(localStorage.getItem(key) || 'null');
        if (!localData) return;

        console.log(`[App] Subiendo datos iniciales a la nube: ${col}`);
        try {
            if (col === 'banners') {
                await this.supabase.from(col).upsert({ id: 'main', data: localData });
            } else {
                const mappedData = Array.isArray(localData)
                    ? localData.map(item => this._mapToDB(col, item))
                    : this._mapToDB(col, localData);
                await this.supabase.from(col).upsert(mappedData);
            }
        } catch (e) { console.error(`[App] Error uploading initial ${col}:`, e); }
    },

    async saveToCloud(col, data) {
        if (!this.supabase) return;
        try {
            if (col === 'banners') {
                await this.supabase.from(col).upsert({ id: 'main', data: data });
            } else {
                const mappedData = Array.isArray(data)
                    ? data.map(item => this._mapToDB(col, item))
                    : this._mapToDB(col, data);
                await this.supabase.from(col).upsert(mappedData);
            }
        } catch (e) { console.error('[App] Error al guardar en nube:', e); }
    },

    async deleteFromCloud(col, id) {
        if (!this.supabase || !id) return;
        try {
            const { error } = await this.supabase.from(col).delete().match({ id: id });
            if (error) throw error;
        } catch (e) { console.error('[App] Error al borrar en nube:', e); }
    },

    DEFAULT_BANNERS: {
        main: {
            subtitle: 'LOS RECIÉN LLEGADOS',
            title: 'VENTA DE VERANO',
            discount: 'MIN. 40% DE DESCUENTO',
            btnText: 'COMPRA AHORA',
            images: [
                'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1539109132332-680970a0344d?q=80&w=1000&auto=format&fit=crop'
            ]
        },
        side1: {
            label: 'ZAPATILLAS',
            title: 'MIN. 30% DE DESCUENTO',
            desc: 'Zapatos de moda para hombres',
            linkText: 'Mostrar ahora',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop'
        },
        side2: {
            label: 'MODA FEMENINA',
            title: 'HASTA 65% DE DESCUENTO',
            desc: 'Zapatos y cartera',
            linkText: 'Mostrar ahora',
            image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=400&auto=format&fit=crop'
        }
    },

    // ── Default Placeholder Image (Local SVG, safe Base64)
    PLACEHOLDER: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0MDAnIGhlaWdodD0nNTAwJyB2aWV3Qm94PScwIDAgNDAwIDUwMCc+PHJlY3Qgd2lkdGg9JzQwMCcgaGVpZ2h0PSc1MDAnIGZpbGw9JyNmNGYzZmYnLz48cmVjdCB4PScxNTAnIHk9JzE1MCcgd2lkdGg9JzEwMCcgaGVpZ2h0PScxMjAnIHJ4PScxMCcgZmlsbD0nI2UyZGZmNScvPjxjaXJjbGUgY3g9JzIwMCcgY3k9JzEzMCcgcj0nMzAnIGZpbGw9JyNlMmRmZjUnLz48dGV4dCB4PScyMDAnIHk9JzMyMCcgZm9udC1mYW1pbHk9J0FyaWFsJyBmb250LXNpemU9JzE0JyBmb250LXdlaWdodD0nYm9sZCcgZmlsbD0nIzlkOTVjMCcgdGV4dC1hbmNob3I9J21pZGRsZSc+RCZhbXA7RSBTaG9wPC90ZXh0Pjx0ZXh0IHg9JzIwMCcgeT0nMzQyJyBmb250LWZhbWlseT0nQXJpYWwnIGZvbnQtc2l6ZT0nMTEnIGZpbGw9JyNjNGJmZTgnIHRleHQtYW5jaG9yPSdtaWRkbGUnPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==',

    // ── Security Salt (For Customer hashing) ──
    _S: 'dye_secure_salt_2026_!',

    // ── Shipping costs ──
    SHIPPING: {
        SANTO_DOMINGO: 150,
        EXTERIOR: 300
    },

    // ── WhatsApp ──
    WHATSAPP_NUMBER: '18496398500',
    NOTIFICATION_EMAIL: 'dye.servicioss@gmail.com',

    // ── Theme Management ──
    initTheme() {
        const saved = localStorage.getItem('ld_theme') || 'light';
        if (saved === 'dark') document.body.classList.add('dark-theme');

        // Add floating toggle if not exists
        if (!document.querySelector('.theme-toggle-btn')) {
            const btn = document.createElement('div');
            btn.className = 'theme-toggle-btn';
            btn.innerHTML = saved === 'dark' ? '☀️' : '🌙';
            btn.onclick = () => this.toggleTheme();
            document.body.appendChild(btn);
        }
    },

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        const theme = isDark ? 'dark' : 'light';
        localStorage.setItem('ld_theme', theme);
        const btn = document.querySelector('.theme-toggle-btn');
        if (btn) btn.innerHTML = isDark ? '☀️' : '🌙';
    },

    // ── Connectivity Management ──
    initConnectivityListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('¡De vuelta en línea! 🌐', 'success');
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('Sin conexión. Modo offline activado 📴', 'info');
        });
    },

    // ── Init ──
    async init() {
        this.initTheme();
        this.initConnectivityListeners();
        this.initSupabase();
        if (!localStorage.getItem(this.KEYS.INITIALIZED)) {
            this.seedData();
        }
        // Intentar sincronizar antes de renderizar si es posible
        await this.syncWithSupabase();

        // ── Soft Wall Route Protection ──
        const protectedPaths = ['cart.html', 'profile.html'];
        const currentPath = window.location.pathname.split('/').pop();

        if (protectedPaths.includes(currentPath)) {
            const session = await this.getUserSession();
            if (!session) {
                // Save redirect intent
                sessionStorage.setItem('ld_redirect_after_login', currentPath);
                window.location.href = 'login.html';
                return;
            }
        }
        
        this.updateCartBadge();
        this.initGlobalEvents();
        this.isReady = true;

        // Emitir evento para avisar a otras partes de que la app está lista
        window.dispatchEvent(new CustomEvent('app-ready'));
    },

    async getUserSession() {
        if (!this.supabase) return null;
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error || !session) return null;
            return session;
        } catch (e) { return null; }
    },

    initGlobalEvents() {
        // Shared global events for all pages
        document.addEventListener('click', (e) => {
            // Header Search
            if (e.target.closest('.header-search-btn')) {
                const term = document.getElementById('search-input-header')?.value;
                if (term) {
                    window.location.href = `index.html?search=${encodeURIComponent(term)}`;
                }
            }

            // Newsletter
            if (e.target.closest('.newsletter-form button')) {
                e.preventDefault();
                const emailInput = e.target.closest('.newsletter-form').querySelector('input');
                const email = emailInput?.value;
                if (email && email.includes('@')) {
                    this.showToast('¡Gracias por suscribirte! 📩', 'success');
                    e.target.closest('.newsletter-form').reset();
                } else {
                    this.showToast('Ingresa un correo válido', 'error');
                }
            }

            // Global click to close search dropdown
            if (!e.target.closest('.header-search')) {
                document.getElementById('search-results-header')?.classList.add('hidden');
            }
        });

        // ── Global Live Search Logic ──
        document.addEventListener('input', (e) => {
            if (e.target.id === 'search-input-header') {
                this.handleLiveSearch(e.target.value.trim());
            }
        });
    },

    handleLiveSearch(term) {
        const resultsBox = document.getElementById('search-results-header');
        if (!resultsBox) return;

        if (!term || term.length < 2) {
            resultsBox.classList.add('hidden');
            return;
        }

        const products = this.getProducts();
        const t = term.toLowerCase();
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(t) || 
            (p.category && p.category.toLowerCase().includes(t))
        ).slice(0, 6); // Limit results

        if (filtered.length === 0) {
            resultsBox.innerHTML = `<div class="search-no-results">No se encontraron productos para "${this.esc(term)}"</div>`;
        } else {
            resultsBox.innerHTML = filtered.map(p => `
                <a href="product.html?id=${p.id}" class="search-result-item">
                    <img src="${encodeURI(p.image)}" alt="${this.esc(p.name)}">
                    <div class="search-result-info">
                        <div class="name">${this.esc(p.name)}</div>
                        <div class="price">${this.formatPrice(p.price)}</div>
                    </div>
                </a>
            `).join('');
            
            // Add "view all" option if many results
            if (products.filter(p => p.name.toLowerCase().includes(t)).length > 6) {
                resultsBox.innerHTML += `
                    <a href="index.html?search=${encodeURIComponent(term)}" class="search-view-all">Ver todos los resultados ➔</a>
                `;
            }
        }
        resultsBox.classList.remove('hidden');
    },

    // ── Security & Sanitization ──
    sanitize(str) {
        if (!str) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            "/": '&#x2F;',
        };
        const reg = /[&<>"'/]/ig;
        return String(str).replace(reg, (match) => map[match]);
    },

    // Shortcut for templates
    esc(str) {
        return this.sanitize(str);
    },

    getColorCode(colorName) {
        if (!colorName) return 'transparent';
        const name = colorName.toLowerCase().trim();
        if (name.startsWith('#')) return name;

        const map = {
            'rojo': '#FF0000',
            'azul': '#0000FF',
            'verde': '#008000',
            'amarillo': '#FFFF00',
            'negro': '#000000',
            'blanco': '#FFFFFF',
            'rosa': '#FFC0CB',
            'rosado': '#FFC0CB',
            'gris': '#808080',
            'naranja': '#FFA500',
            'morado': '#800080',
            'púrpura': '#800080',
            'purpura': '#800080',
            'violeta': '#EE82EE',
            'cafe': '#A52A2A',
            'café': '#A52A2A',
            'marron': '#8B4513',
            'marrón': '#8B4513',
            'beige': '#F5F5DC',
            'crema': '#FFFDD0',
            'celeste': '#87CEEB',
            'turquesa': '#40E0D0',
            'oro': '#FFD700',
            'dorado': '#FFD700',
            'plata': '#C0C0C0',
            'plateado': '#C0C0C0',
            'platiado': '#C0C0C0', // Common misspelling
            'lila': '#C8A2C8',
            'fucsia': '#FF00FF',
            'menta': '#98FB98',
            'ambar': '#FFBF00',
            'ámbar': '#FFBF00',
            'esmeralda': '#50C878',
            'cian': '#00FFFF',
            'magenta': '#FF00FF',
            'lima': '#32CD32',
            'oliva': '#808000',
            'salmon': '#FA8072',
            'salmón': '#FA8072',
            'coral': '#FF7F50',
            'bronce': '#CD7F32',
            'cobre': '#B87333',
            'vino': '#800000',
            'borgoña': '#800020',
            'mostaza': '#FFDB58',
            'turquesa': '#40E0D0',
            'indigo': '#4B0082',
            'índigo': '#4B0082',
            'lavanda': '#E6E6FA'
        };

        return map[name] || name; // Returns translation or original (for CSS support like 'red', 'blue')
    },

    async hashPassword(password, email = '') {
        // Use salted hashing: password + email (unique) + internal salt
        const combined = password + (email.toLowerCase()) + this._S;
        const msgUint8 = new TextEncoder().encode(combined);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    seedData() {
        if (typeof SEED_DATA !== 'undefined') {
            localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(SEED_DATA.products));
            localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(SEED_DATA.categories));
        }
        if (!localStorage.getItem(this.KEYS.CART)) {
            localStorage.setItem(this.KEYS.CART, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.CUSTOMERS)) {
            localStorage.setItem(this.KEYS.CUSTOMERS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.BANNERS)) {
            localStorage.setItem(this.KEYS.BANNERS, JSON.stringify(this.DEFAULT_BANNERS));
        }
        localStorage.setItem(this.KEYS.INITIALIZED, 'true');
    },

    // ── Getters ──
    getProducts() {
        return JSON.parse(localStorage.getItem(this.KEYS.PRODUCTS) || '[]');
    },

    getBanners() {
        return JSON.parse(localStorage.getItem(this.KEYS.BANNERS) || JSON.stringify(this.DEFAULT_BANNERS));
    },

    saveBanners(banners) {
        localStorage.setItem(this.KEYS.BANNERS, JSON.stringify(banners));
        this.saveToCloud('banners', banners);
    },

    getCategories() {
        return JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES) || '[]');
    },

    getActiveCategories() {
        return this.getCategories().filter(c => c.isActive);
    },

    getCart() {
        return JSON.parse(localStorage.getItem(this.KEYS.CART) || '[]');
    },

    getCustomers() {
        return JSON.parse(localStorage.getItem(this.KEYS.CUSTOMERS) || '[]');
    },

    getCurrentUser() {
        const u = localStorage.getItem(this.KEYS.CURRENT_USER);
        return u ? JSON.parse(u) : null;
    },

    getProduct(id) {
        return this.getProducts().find(p => p.id === id);
    },

    // ── Setters ──
    saveProducts(products) {
        localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
    },

    saveCategories(categories) {
        localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
    },

    async saveCart(cart) {
        localStorage.setItem(this.KEYS.CART, JSON.stringify(cart));
        this.updateCartBadge();

        // Cross-device Sync
        const user = this.getCurrentUser();
        if (user && this.supabase) {
            try {
                await this.supabase.from('profiles').update({ cart }).eq('id', user.id);
            } catch (e) { console.warn('[App] Error syncing cart to cloud:', e); }
        }
    },

    saveCustomers(customers) {
        localStorage.setItem(this.KEYS.CUSTOMERS, JSON.stringify(customers));
    },

    // ── Orders (WhatsApp Checkout Records) ──
    getOrders() {
        return JSON.parse(localStorage.getItem(this.KEYS.ORDERS) || '[]');
    },

    saveOrder(orderData) {
        const orders = this.getOrders();
        const order = {
            id: 'ORD-' + Date.now(),
            date: new Date().toISOString(),
            status: 'pendiente',
            ...orderData
        };
        orders.unshift(order); // Newest first
        localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
        this.saveToCloud('orders', order);
        return order;
    },

    updateOrderStatus(orderId, status) {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
            this.saveToCloud('orders', order);
        }
    },

    deleteOrder(orderId) {
        let orders = this.getOrders();
        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
        this.deleteFromCloud('orders', orderId);
    },

    setCurrentUser(user) {
        if (user) {
            localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
            if (user.cart && Array.isArray(user.cart)) {
                this.mergeCloudCart(user.cart);
            }
        } else {
            localStorage.removeItem(this.KEYS.CURRENT_USER);
        }
    },

    mergeCloudCart(cloudCart) {
        const localCart = this.getCart();
        cloudCart.forEach(cloudItem => {
            const exists = localCart.find(li =>
                li.productId === cloudItem.productId &&
                li.size === cloudItem.size &&
                li.color === cloudItem.color
            );
            if (!exists) {
                localCart.push(cloudItem);
            } else {
                // Keep the one with more qty or just cloud? Usually cloud is fresher for cross-device
                exists.qty = Math.max(exists.qty, cloudItem.qty);
            }
        });
        localStorage.setItem(this.KEYS.CART, JSON.stringify(localCart));
        this.updateCartBadge();
    },

    // ── Cart Operations ──
    addToCart(productId, qty = 1, size = null, color = null) {
        const cart = this.getCart();
        // Cart items are now unique by productId, size AND color
        const existing = cart.find(item =>
            item.productId === productId &&
            (item.size == size) &&
            (item.color == color)
        );
        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({ productId, qty, size, color });
        }
        this.saveCart(cart);
        this.showToast('Producto agregado al carrito', 'success');
    },

    removeFromCart(productId, size = null, color = null) {
        let cart = this.getCart();
        cart = cart.filter(item => !(
            item.productId === productId &&
            item.size == size &&
            item.color == color
        ));
        this.saveCart(cart);
    },

    updateCartQty(productId, qty, size = null, color = null) {
        const cart = this.getCart();
        const item = cart.find(i =>
            i.productId === productId &&
            i.size == size &&
            i.color == color
        );
        if (item) {
            item.qty = Math.max(1, qty);
            this.saveCart(cart);
        }
    },

    getCartCount() {
        return this.getCart().reduce((sum, item) => sum + item.qty, 0);
    },

    getCartTotal() {
        const cart = this.getCart();
        const products = this.getProducts();
        let total = 0;
        cart.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                total += product.price * item.qty;
            }
        });
        return total;
    },

    // ── Cart Badge ──
    updateCartBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const count = this.getCartCount();
        badges.forEach(badge => {
            if (count > 0) {
                badge.textContent = count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        });
    },

    // ── Product CRUD (Admin) ──
    addProduct(product) {
        const products = this.getProducts();
        product.id = 'p' + Date.now();
        product.reviews = [];
        products.push(product);
        this.saveProducts(products);
        this.saveToCloud('products', product);
        return product;
    },

    updateProduct(id, updates) {
        const products = this.getProducts();
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) {
            products[idx] = { ...products[idx], ...updates };
            this.saveProducts(products);
            this.saveToCloud('products', products[idx]);
        }
    },

    deleteProduct(id) {
        let products = this.getProducts();
        products = products.filter(p => p.id !== id);
        this.saveProducts(products);
        this.deleteFromCloud('products', id);
    },

    // ── Reviews ──
    addReview(productId, review) {
        const products = this.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            if (!product.reviews) product.reviews = [];
            review.date = new Date().toISOString().split('T')[0];
            product.reviews.push(review);
            this.saveProducts(products);
            this.saveToCloud('products', product);
        }
    },

    getAverageRating(product) {
        if (!product.reviews || product.reviews.length === 0) return 0;
        const sum = product.reviews.reduce((s, r) => s + r.rating, 0);
        return (sum / product.reviews.length).toFixed(1);
    },

    getFitStats(product) {
        if (!product.reviews || product.reviews.length === 0) return null;
        const reviewsWithFit = product.reviews.filter(r => r.fit);
        if (reviewsWithFit.length === 0) return null;
        const options = ['Excelente', 'A la medida', 'Un poco grande', 'Un poco pequeño'];
        const counts = {};
        options.forEach(o => counts[o] = 0);
        reviewsWithFit.forEach(r => { if (counts[r.fit] !== undefined) counts[r.fit]++; });
        const total = reviewsWithFit.length;
        return options.map(o => ({
            label: o,
            count: counts[o],
            pct: Math.round((counts[o] / total) * 100)
        }));
    },

    // ── Category Toggle ──
    toggleCategory(categoryId, isActive) {
        const categories = this.getCategories();
        const cat = categories.find(c => c.id === categoryId);
        if (cat) {
            cat.isActive = isActive;
            this.saveCategories(categories);
            this.saveToCloud('categories', cat);
        }
    },

    updateCategory(categoryId, updates) {
        const categories = this.getCategories();
        const idx = categories.findIndex(c => c.id === categoryId);
        if (idx !== -1) {
            categories[idx] = { ...categories[idx], ...updates };
            this.saveCategories(categories);
            this.saveToCloud('categories', categories[idx]);
        }
    },

    addCategory(cat) {
        const categories = this.getCategories();
        // Generate a clean ID
        let baseId = cat.name.toLowerCase().trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9]/g, '-'); // replace non-alnum with dash

        let id = baseId;
        let counter = 1;
        while (categories.find(c => c.id === id)) {
            id = `${baseId}-${counter++}`;
        }

        cat.id = id;
        cat.isPermanent = false;
        cat.isActive = true;
        categories.push(cat);
        this.saveCategories(categories);
        this.saveToCloud('categories', cat);
        return cat;
    },

    deleteCategory(id) {
        let categories = this.getCategories();
        const cat = categories.find(c => c.id === id);
        if (cat && cat.isPermanent) return false;

        categories = categories.filter(c => c.id !== id);
        this.saveCategories(categories);
        this.deleteFromCloud('categories', id);
        return true;
    },

    // ── Customer Auth ──
    async registerCustomer(data) {
        const customers = this.getCustomers();
        if (customers.find(c => c.email === data.email)) {
            return { success: false, message: 'Este correo ya está registrado.' };
        }
        data.id = 'c' + Date.now();
        data.registered = new Date().toISOString();

        // Hash password before saving (Security Salted)
        data.password = await this.hashPassword(data.password, data.email);

        customers.push(data);
        this.saveCustomers(customers);
        this.saveToCloud('customers', data);
        this.setCurrentUser(data);

        // Trigger mailto
        this.sendCustomerNotification(data);

        return { success: true, user: data };
    },

    async loginCustomer(email, password) {
        const customers = this.getCustomers();
        const hashedPassword = await this.hashPassword(password, email);
        const user = customers.find(c => c.email === email && (c.password === hashedPassword));
        if (user) {
            this.setCurrentUser(user);
            return { success: true, user };
        }
        return { success: false, message: 'Correo o contraseña incorrectos.' };
    },

    logoutCustomer() {
        this.setCurrentUser(null);
    },

    sendCustomerNotification(data) {
        const subject = encodeURIComponent('Nuevo Cliente Registrado - D&E Shop');
        const body = encodeURIComponent(
            `Nuevo cliente registrado:\n\n` +
            `Nombre: ${data.name}\n` +
            `Email: ${data.email}\n` +
            `Teléfono: ${data.phone || 'N/A'}\n` +
            `Dirección: ${data.address || 'N/A'}\n` +
            `Fecha: ${new Date().toLocaleString()}`
        );
        // Open mailto in background
        const mailLink = document.createElement('a');
        mailLink.href = `mailto:${this.NOTIFICATION_EMAIL}?subject=${subject}&body=${body}`;
        mailLink.target = '_blank';
        mailLink.style.display = 'none';
        document.body.appendChild(mailLink);
        mailLink.click();
        setTimeout(() => mailLink.remove(), 100);
    },

    // ── Admin Auth (PROFESSIONAL - Supabase Auth) ──
    async adminLogin(email, password) {
        if (!this.supabase) return false;
        
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('[Auth] Error de login:', error.message);
                this.showToast('Error: ' + error.message, 'error');
                return false;
            }

            // Verify admin email explicitly (Simple role check)
            if (data.user.email !== 'l272727d@gmail.com') {
                this.showToast('Acceso denegado: No eres administrador.', 'error');
                await this.supabase.auth.signOut();
                return false;
            }

            return true;
        } catch (err) {
            console.error('[Auth] Error inesperado:', err);
            return false;
        }
    },

    async isAdminLogged() {
        if (!this.supabase) return false;
        
        // Debug Bypass for Local Development (Limited)
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
        if (isLocal && localStorage.getItem('ld_admin_debug') === 'true') {
            return true;
        }

        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error || !session) return false;
            return session.user && session.user.email === 'l272727d@gmail.com';
        } catch(e) { 
            console.error('[App] Error checking admin session:', e);
            return false; 
        }
    },

    async adminLogout() {
        if (this.supabase) {
            await this.supabase.auth.signOut();
        }
        localStorage.removeItem(this.KEYS.ADMIN_LOGGED); // Cleanup legacy if exists
    },

    // ── Toast ──
    // ── Toast ── (XSS-SAFE: uses textContent instead of innerHTML for message)
    showToast(message, type = 'info') {
        try {
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }

            const icons = { success: '✅', error: '❌', info: '💡' };

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            // SECURITY FIX: Build DOM nodes — never inject message as HTML
            const iconSpan = document.createElement('span');
            iconSpan.textContent = icons[type] || '💡';

            const msgSpan = document.createElement('span');
            msgSpan.textContent = message; // textContent prevents XSS

            toast.appendChild(iconSpan);
            toast.appendChild(document.createTextNode(' '));
            toast.appendChild(msgSpan);
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100px)';
                setTimeout(() => { try { toast.remove(); } catch (e) { } }, 300);
            }, 3000);
        } catch (err) {
            console.warn('[App] showToast error:', err);
        }
    },

    // ── Stars HTML Helper ──
    starsHTML(rating, showEmpty = true) {
        const r = parseFloat(rating) || 0;
        let html = '';
        const full = Math.floor(r);
        const half = r % 1 >= 0.5 ? 1 : 0;
        for (let i = 0; i < full; i++) html += '★';
        if (half) html += '★';
        if (showEmpty) {
            for (let i = full + half; i < 5; i++) html += '<span class="empty">★</span>';
        }
        return html;
    },

    // ── Format Price ──
    formatPrice(price) {
        return 'RD$ ' + price.toLocaleString('es-DO');
    },

    // ── WhatsApp Checkout ──
    buildWhatsAppMessage(shippingType) {
        const cart = this.getCart();
        const products = this.getProducts();
        let message = '🛍️ *PEDIDO - D&E Shop*\n\n';
        let subtotal = 0;

        cart.forEach((item, i) => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const itemTotal = product.price * item.qty;
                subtotal += itemTotal;

                const variants = [];
                if (item.size) variants.push(`Talla: ${item.size}`);
                if (item.color) variants.push(`Color: ${item.color}`);
                const variantStr = variants.length > 0 ? ` [${variants.join(', ')}]` : '';

                message += `${i + 1}. *${product.name}*${variantStr}\n`;
                message += `   Cantidad: ${item.qty}\n`;
                message += `   Precio unit.: ${this.formatPrice(product.price)}\n`;
                message += `   Subtotal: ${this.formatPrice(itemTotal)}\n\n`;
            }
        });

        const shipping = shippingType === 'santo-domingo' ? this.SHIPPING.SANTO_DOMINGO : this.SHIPPING.EXTERIOR;
        const shippingLabel = shippingType === 'santo-domingo' ? 'Santo Domingo' : 'Exterior/Provincias';
        const total = subtotal + shipping;

        message += `────────────\n`;
        message += `📦 *Subtotal:* ${this.formatPrice(subtotal)}\n`;
        message += `🚚 *Envío (${shippingLabel}):* ${this.formatPrice(shipping)}\n`;
        message += `💰 *TOTAL A PAGAR:* ${this.formatPrice(total)}\n\n`;

        const user = this.getCurrentUser();
        if (user) {
            message += `👤 *Cliente:* ${user.name}\n`;
            message += `📧 ${user.email}\n`;
            if (user.phone) message += `📱 ${user.phone}\n`;
        }

        message += `\n¡Gracias por su compra! 🌸`;

        return message;
    },

    sendToWhatsApp(shippingType) {
        const message = this.buildWhatsAppMessage(shippingType);
        const url = `https://wa.me/${this.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },

    // ── Common Header HTML ──
    renderHeader(activePage = '') {
        const user = this.getCurrentUser();
        const cartCount = this.getCartCount();

        return `
    <header class="header">
      <!-- Top Bar -->
      <div class="top-bar">
        <div class="container d-flex justify-between align-center">
          <p class="top-bar-text">¡BIENVENIDO A NUESTRA TIENDA!</p>
          <div class="top-bar-links">
            <a href="blog.html">BLOG</a>
            <a href="policies.html?p=privacy">FAQ</a>
            <a href="#footer-root">CONTÁCTENOS</a>
          </div>
        </div>
      </div>

      <!-- Main Header -->
      <div class="header-main">
        <div class="container header-inner">
          <a href="index.html" class="logo">
            <img src="images/logo.png" alt="D&E Shop" class="logo-img">
          </a>
          
          <div class="header-search">
            <div class="search-bar">
              <input type="text" id="search-input-header" placeholder="Búsqueda de productos, categorías, marcas, y más ..." autocomplete="off">
              <div class="search-category-select">
                <select id="header-cat-select">
                  <option value="all">Todas las Categorías</option>
                </select>
              </div>
              <button class="header-search-btn">🔍</button>
            </div>
            <!-- Live Search Results Dropdown -->
            <div id="search-results-header" class="search-results-dropdown hidden"></div>
          </div>

          <div class="header-actions">
            ${user
                ? `<a href="#" class="action-btn" title="${this.esc(user.name)}" onclick="App.logoutCustomer(); location.reload();">
                    <span class="icon">👤</span>
                  </a>`
                : `<a href="login.html" class="action-btn" title="Iniciar Sesión">
                    <span class="icon">👤</span>
                  </a>`
            }
            <a href="javascript:void(0)" class="action-btn" onclick="App.showToast('Lista de deseos próximamente ✨', 'info')">
              <span class="icon">🤍</span>
              <span class="badge">0</span>
            </a>
            <a href="cart.html" class="action-btn cart-btn">
              <span class="icon">🛒</span>
              <span class="badge cart-badge ${cartCount === 0 ? 'hidden' : ''}">${cartCount}</span>
              <span class="price-label">${this.formatPrice(this.getCartTotal())}</span>
            </a>
          </div>
        </div>
      </div>

      <script>
        // Auto-populate category dropdown — XSS-safe via DOM API
        setTimeout(() => {
          const select = document.getElementById('header-cat-select');
          if (!select) return;
          try {
            const categories = JSON.parse(localStorage.getItem('ld_categories') || '[]');
            // Clear existing options safely
            select.innerHTML = '';
            const allOpt = document.createElement('option');
            allOpt.value = 'all';
            allOpt.textContent = 'Todas las Categorías';
            select.appendChild(allOpt);
            categories.filter(c => c.isActive).forEach(c => {
              const opt = document.createElement('option');
              opt.value = c.id;  // safe: set as property, not HTML
              // BUG FIX: safeEmoji and safeName were undefined — fixed below
              opt.textContent = (c.emoji || '') + ' ' + (c.name || c.id);
              select.appendChild(opt);
            });
          } catch(e) { console.warn('Header categories error:', e); }
        }, 0);
      </script>

      <!-- Navigation Bar -->
      <nav class="header-nav">
        <div class="container d-flex align-center">
          <div class="dept-dropdown">
            <button class="dept-btn">
              <span class="hamburger">☰</span>
              DEPARTAMENTO DE COMPRAS
            </button>
          </div>
          <ul class="nav-links">
            <li><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">INICIO</a></li>
            <li><a href="index.html">TIENDA</a></li>
            <li><a href="index.html?cat=hombre">HOMBRES</a></li>
            <li><a href="index.html?cat=mujer">MUJER</a></li>
            <li><a href="blog.html" class="${activePage === 'blog' ? 'active' : ''}">BLOG</a></li>
            <li><a href="#footer-root">CONTÁCTANOS</a></li>
          </ul>
        </div>
      </nav>
    </header>`;
    },

    // ── Common Footer HTML ──
    renderFooter() {
        return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <h4 class="footer-title">D&E Shop</h4>
            <div class="footer-content">
              <p>Tu tienda de moda favorita con las últimas tendencias a los mejores precios.</p>
              <div class="social-links">
                <!-- Social links here -->
              </div>
            </div>
          </div>
          <div class="footer-col">
            <h4 class="footer-title">Enlaces Rápidos</h4>
            <ul class="footer-links">
              <li><a href="index.html">Inicio</a></li>
              <li><a href="cart.html">Mi Carrito</a></li>
              <li><a href="login.html">Mi Cuenta</a></li>
              <li><a href="policies.html?p=privacy">Políticas de Privacidad</a></li>
              <li><a href="policies.html?p=returns">Cambios y Devoluciones</a></li>
              <li><a href="policies.html?p=shipping">Preguntas (Envío)</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4 class="footer-title">Atención al Cliente</h4>
            <ul class="footer-links">
              <li><p>📱 <a href="https://wa.me/18496398500" target="_blank" style="color:inherit;">+1 849-639-8500</a></p></li>
              <li><p>📧 <a href="mailto:dye.servicioss@gmail.com" style="color:inherit;">dye.servicioss@gmail.com</a></p></li>
              <li><p>📍 República Dominicana</p></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4 class="footer-title">Newsletter</h4>
            <div class="footer-content">
              <p>Suscríbete para recibir ofertas exclusivas.</p>
              <form class="newsletter-form">
                <input type="email" placeholder="Tu correo..." required>
                <button type="submit">OK</button>
              </form>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© ${new Date().getFullYear()} D&E Shop. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>`;
    },

    // ══════════════════════════════════════════════════════════
    //  SUPPLIER MANAGEMENT (Módulo Privado del Administrador)
    // ══════════════════════════════════════════════════════════

    getSuppliers() {
        return JSON.parse(localStorage.getItem(this.KEYS.SUPPLIERS) || '[]');
    },

    getSupplier(id) {
        return this.getSuppliers().find(s => s.id === id) || null;
    },

    addSupplier(data) {
        const suppliers = this.getSuppliers();
        const supplier = {
            id: 'PROV-' + Date.now(),
            name: data.name || '',
            contact_name: data.contact_name || '',
            email: data.email || '',
            phone: data.phone || '',
            country: data.country || 'DO',
            payment_terms: data.payment_terms || '',
            commission_pct: parseFloat(data.commission_pct) || 0,
            notes: data.notes || '',
            is_active: true,
            created_at: new Date().toISOString()
        };
        suppliers.push(supplier);
        localStorage.setItem(this.KEYS.SUPPLIERS, JSON.stringify(suppliers));
        return supplier;
    },

    updateSupplier(id, updates) {
        const suppliers = this.getSuppliers();
        const idx = suppliers.findIndex(s => s.id === id);
        if (idx !== -1) {
            suppliers[idx] = { ...suppliers[idx], ...updates };
            localStorage.setItem(this.KEYS.SUPPLIERS, JSON.stringify(suppliers));
            this.saveToCloud('suppliers', suppliers[idx]);
        }
    },

    deleteSupplier(id) {
        let suppliers = this.getSuppliers();
        suppliers = suppliers.filter(s => s.id !== id);
        localStorage.setItem(this.KEYS.SUPPLIERS, JSON.stringify(suppliers));
        this.deleteFromCloud('suppliers', id);

        let links = this.getSupplierProducts();
        links = links.filter(lp => lp.supplier_id !== id);
        localStorage.setItem(this.KEYS.SUPPLIER_PRODUCTS, JSON.stringify(links));
        // We delete from cloud if table exists
        this.deleteFromCloud('supplier_products', id); 
    },

    getSupplierProducts() {
        return JSON.parse(localStorage.getItem(this.KEYS.SUPPLIER_PRODUCTS) || '[]');
    },

    getProductsForSupplier(supplierId) {
        const links = this.getSupplierProducts().filter(lp => lp.supplier_id === supplierId);
        const products = this.getProducts();
        return links.map(lp => {
            const product = products.find(p => p.id === lp.product_id);
            return product ? { ...lp, product } : null;
        }).filter(Boolean);
    },

    linkProductToSupplier(supplierId, productId, costPrice) {
        const links = this.getSupplierProducts();
        const existingIdx = links.findIndex(lp => lp.product_id === productId);
        if (existingIdx !== -1) {
            links[existingIdx].supplier_id = supplierId;
            links[existingIdx].cost_price = parseFloat(costPrice) || 0;
        } else {
            links.push({
                id: 'LP-' + Date.now(),
                supplier_id: supplierId,
                product_id: productId,
                cost_price: parseFloat(costPrice) || 0,
                linked_at: new Date().toISOString()
            });
        }
        localStorage.setItem(this.KEYS.SUPPLIER_PRODUCTS, JSON.stringify(links));
    },

    unlinkProductFromSupplier(productId) {
        let links = this.getSupplierProducts();
        links = links.filter(lp => lp.product_id !== productId);
        localStorage.setItem(this.KEYS.SUPPLIER_PRODUCTS, JSON.stringify(links));
    },

    // ── Smart Similar Products (Automático por Familia/Parentesco) ──
    // Criterios de puntuación:
    //   +10 pts → misma categoría (familia principal)
    //   +6  pts → mismo proveedor (mismo origen)
    //   +4  pts → precio similar (rango ±30%)
    //   +2  pts → mismo tipo de badge (descuento, nuevo, etc.)
    getSimilarProducts(product, limit = 8) {
        if (!product) return [];
        const allProducts = this.getProducts();
        const supplierLinks = this.getSupplierProducts();

        // Get current product's supplier
        const currentLink = supplierLinks.find(lp => lp.product_id === product.id);
        const currentSupplierId = currentLink ? currentLink.supplier_id : null;

        return allProducts
            .filter(p => p.id !== product.id) // Exclude self
            .map(p => {
                let score = 0;

                // 1. Misma categoría (familia principal) +10
                if (p.category && p.category === product.category) score += 10;

                // 2. Mismo proveedor +6
                if (currentSupplierId) {
                    const pLink = supplierLinks.find(lp => lp.product_id === p.id);
                    if (pLink && pLink.supplier_id === currentSupplierId) score += 6;
                }

                // 3. Precio similar (rango ±30%) +4
                if (product.price && p.price) {
                    const ratio = p.price / product.price;
                    if (ratio >= 0.7 && ratio <= 1.3) score += 4;
                }

                // 4. Mismo tipo de badge (descuento, nuevo, popular) +2
                if (product.badgeType && p.badgeType && product.badgeType === p.badgeType) score += 2;

                return { product: p, score };
            })
            .filter(item => item.score > 0) // Must have at least one match
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return Math.random() - 0.5; // Shuffle ties for variety
            })
            .slice(0, limit)
            .map(item => item.product);
    },

    // ── Supplier Performance Calculator ──
    // Solo cuenta pedidos con estado 'entregado' o 'completado'
    getSupplierPerformance() {
        const suppliers = this.getSuppliers();
        const links = this.getSupplierProducts();
        const products = this.getProducts();
        const completedOrders = this.getOrders().filter(
            o => o.status === 'entregado' || o.status === 'completado'
        );

        return suppliers.map(supplier => {
            const supplierLinks = links.filter(lp => lp.supplier_id === supplier.id);
            const supplierProductIds = new Set(supplierLinks.map(lp => lp.product_id));

            let totalOrders = 0;
            let totalUnits = 0;
            let grossRevenue = 0;
            let totalCost = 0;
            const productSales = {};

            completedOrders.forEach(order => {
                let orderHasProduct = false;
                (order.items || []).forEach(item => {
                    if (!supplierProductIds.has(item.productId)) return;
                    const link = supplierLinks.find(lp => lp.product_id === item.productId);
                    const product = products.find(p => p.id === item.productId);
                    if (!link || !product) return;
                    orderHasProduct = true;
                    const qty = item.qty || 1;
                    const unitPrice = item.subtotal ? item.subtotal / qty : product.price;
                    const revenue = unitPrice * qty;
                    const cost = link.cost_price * qty;
                    grossRevenue += revenue;
                    totalCost += cost;
                    totalUnits += qty;
                    if (!productSales[item.productId]) {
                        productSales[item.productId] = {
                            productId: item.productId,
                            name: product.name,
                            image: product.image,
                            qty: 0, revenue: 0, cost: 0,
                            costPrice: link.cost_price,
                            salePrice: product.price
                        };
                    }
                    productSales[item.productId].qty += qty;
                    productSales[item.productId].revenue += revenue;
                    productSales[item.productId].cost += cost;
                });
                if (orderHasProduct) totalOrders++;
            });

            const netProfit = grossRevenue - totalCost;
            const marginPct = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0.0';

            return {
                ...supplier,
                totalOrders,
                totalUnits,
                grossRevenue,
                totalCost,
                netProfit,
                marginPct,
                linkedProducts: supplierLinks.length,
                productSales: Object.values(productSales).sort((a, b) => b.revenue - a.revenue)
            };
        });
    }
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
