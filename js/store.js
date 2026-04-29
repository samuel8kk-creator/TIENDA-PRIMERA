/* ================================================
   D&E Shop — Storefront Logic
   Category filtering, product rendering, search
   ================================================ */

function initStore() {
  if (window._storeInited) return; 
  window._storeInited = true;
  // Render shared header & footer
  document.getElementById('header-root').innerHTML = App.renderHeader('home');
  document.getElementById('footer-root').innerHTML = App.renderFooter();

  const params = new URLSearchParams(window.location.search);
  let currentCategory = params.get('cat') || 'all';
  let searchTerm = params.get('search') || '';

  // ── Render Home Banners ──
  function renderHomeBanners() {
    const root = document.getElementById('home-banners-root');
    if (!root) return;

    const banners = App.getBanners();
    const mainImages = banners.main.images || [banners.main.image];

    root.innerHTML = `
      <div class="home-hero-grid">
        <div class="hero-main-banner" id="hero-slider">
          <div class="hero-slides-container">
            ${mainImages.map((img, i) => `
              <div class="hero-slide ${i === 0 ? 'active' : ''}">
                <img src="${img}" alt="${banners.main.title}" class="hero-img">
              </div>
            `).join('')}
          </div>
          <div class="hero-content">
            <p class="hero-subtitle">${App.sanitize(banners.main.subtitle)}</p>
            <h1 class="hero-title">${App.sanitize(banners.main.title)}</h1>
            <p class="hero-discount">${App.sanitize(banners.main.discount)}</p>
            <a href="index.html" class="btn btn-outline">${App.sanitize(banners.main.btnText)}</a>
          </div>
          ${mainImages.length > 1 ? `
            <div class="hero-dots">
              ${mainImages.map((_, i) => `<span class="hero-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></span>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="hero-side-banners">
          <div class="side-banner">
            <div class="side-banner-content">
              <p class="side-label">${App.sanitize(banners.side1.label)}</p>
              <h3 class="side-title">${App.sanitize(banners.side1.title)}</h3>
              <p class="side-desc">${App.sanitize(banners.side1.desc)}</p>
              <a href="index.html" class="side-link">${App.sanitize(banners.side1.linkText)}</a>
            </div>
            <img src="${banners.side1.image}" alt="${banners.side1.title}" class="side-img">
          </div>

          <div class="side-banner">
            <div class="side-banner-content">
              <p class="side-label">${App.sanitize(banners.side2.label)}</p>
              <h3 class="side-title">${App.sanitize(banners.side2.title)}</h3>
              <p class="side-desc">${App.sanitize(banners.side2.desc)}</p>
              <a href="index.html" class="side-link">${App.sanitize(banners.side2.linkText)}</a>
            </div>
            <img src="${banners.side2.image}" alt="${banners.side2.title}" class="side-img">
          </div>
        </div>
      </div>
    `;

    if (mainImages.length > 1) {
        initHeroSlider(mainImages.length);
    }
  }

  function initHeroSlider(count) {
      let current = 0;
      const slides = document.querySelectorAll('.hero-slide');
      const dots = document.querySelectorAll('.hero-dot');
      
      setInterval(() => {
          slides[current].classList.remove('active');
          dots[current].classList.remove('active');
          current = (current + 1) % count;
          slides[current].classList.add('active');
          dots[current].classList.add('active');
      }, 5000); // 5 segundos
  }

  // ── Render Category Nav ──
  function renderCategories() {
    const categories = App.getActiveCategories();
    const nav = document.getElementById('category-nav');

    let html = `
      <div class="cat-circle-item ${currentCategory === 'all' ? 'active' : ''}" data-cat="all">
        <div class="cat-circle" style="display: flex; align-items: center; justify-content: center; font-size: 2rem;">✨</div>
        <span class="cat-name">Todo</span>
      </div>
    `;

    categories.forEach(cat => {
      const activeClass = currentCategory === cat.id ? 'active' : '';
      const bgStyle = cat.image ? `style="background-image: url('${cat.image}'); background-size: cover; background-position: center;"` : '';
      html += `
        <div class="cat-circle-item ${activeClass}" data-cat="${cat.id}">
          <div class="cat-circle" ${bgStyle}>
            ${!cat.image ? App.sanitize(cat.emoji) : ''}
          </div>
          <span class="cat-name">${App.sanitize(cat.name)}</span>
        </div>
      `;
    });

    nav.innerHTML = html;

    // Bind clicks
    nav.querySelectorAll('.cat-circle-item').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.cat;
        renderCategories();
        renderProducts();
      });
    });
  }

  // ── Render Products ──
  function renderProducts() {
    const products = App.getProducts();
    const grid = document.getElementById('products-grid');
    const emptyState = document.getElementById('empty-state');

    let filtered = products;

    // Filter by category
    if (currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category === currentCategory);

      // For 'descuentos', also include products with oldPrice
      if (currentCategory === 'descuentos') {
        const discounted = products.filter(p => p.oldPrice && p.category !== currentCategory);
        filtered = [...filtered, ...discounted];
      }
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    grid.innerHTML = filtered.map((product) => {
      const imgs = product.images && product.images.length > 0 ? product.images : [product.image];
      const nameEscaped = App.sanitize(product.name).replace(/'/g, "\\'");
      const clickTrack = `Analytics.trackProductClick('${product.id}', '${nameEscaped}')`;
      
      // Calculate a fake review stat for the "Temu feel"
      let soldCount = product.stock ? product.stock * 3 + 12 : 124;
      if (soldCount > 999) soldCount = Math.floor(soldCount/1000) + 'k';
      const fakeRating = (4 + Math.random() * 0.9).toFixed(1);

      return `
        <div class="product-card temu-card">
          ${product.badge ? `<span class="badge ${product.badgeType === 'discount' ? 'badge-discount' : 'badge-featured'}">${product.badge}</span>` : ''}
          
          <div class="card-img-slider">
            ${imgs.map(url => `
              <a href="product.html?id=${product.id}" class="card-img-slide" onclick="${clickTrack}">
                <img class="img-skeleton"
                     data-lazy-src="${url}"
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                     alt="${App.sanitize(product.name)}">
              </a>
            `).join('')}
            ${imgs.length > 1 ? `<div class="card-img-slider-hint">Desliza ➔</div>` : ''}
          </div>

          <div class="temu-card-body">
            <a href="product.html?id=${product.id}" class="product-title line-clamp-2" onclick="${clickTrack}">
              ${App.sanitize(product.name)}
            </a>
            
            <div class="temu-shipping-tag">🚚 Envío a tu puerta o provincia</div>
            
            <div class="temu-price-row">
              <span class="temu-price">${App.formatPrice(product.price)}</span>
              ${product.oldPrice ? `<span class="temu-old-price">${App.formatPrice(product.oldPrice)}</span>` : ''}
            </div>
            
            <div class="temu-stats">
               <span>⭐ ${fakeRating}</span>
               <span>|</span>
               <span>+${soldCount} vendidos</span>
            </div>

            <button class="quick-add-btn" onclick="window.location.href='product.html?id=${product.id}'" title="Ver Producto">
              🛒
            </button>
          </div>
        </div>
      `;
    }).join('');

    // ── Activate Lazy Loading after DOM is updated ──
    if (typeof LazyGallery !== 'undefined') {
      LazyGallery.init();
    }
  }

  function getCategoryName(categoryId) {
    const cat = App.getCategories().find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  }

  // ── Search ──
  // Check for both header search and potential main search
  const searchInputs = [document.getElementById('search-input'), document.getElementById('search-input-header')].filter(Boolean);

  searchInputs.forEach(input => {
    let searchTimeout;
    input.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchTerm = e.target.value.trim();
        if (searchTerm) Analytics.trackSearch(searchTerm);
        renderProducts();
      }, 300);
    });
  });

  // ── Realtime Event Listeners ──
  window.addEventListener('products-updated', renderProducts);
  window.addEventListener('categories-updated', renderCategories);
  window.addEventListener('banners-updated', renderHomeBanners);

  // ── Init ──
  renderHomeBanners();
  renderCategories();
  renderProducts();
}

if (App.isReady) {
    initStore();
} else {
    window.addEventListener('app-ready', initStore);
}
