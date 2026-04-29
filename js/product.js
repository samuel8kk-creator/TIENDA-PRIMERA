/* ================================================
   D&E Shop — Product Detail Page
   Product display, quantity selector, reviews
   ================================================ */

function initProduct() {
  if (window._productInited) return;
  window._productInited = true;
  document.getElementById('header-root').innerHTML = App.renderHeader('home');
  document.getElementById('footer-root').innerHTML = App.renderFooter();

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    window.location.href = 'index.html';
    return;
  }

  const product = App.getProduct(productId);

  if (!product) {
    document.getElementById('product-detail').innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="emoji">😕</div>
        <h2>Producto no encontrado</h2>
        <p>El producto que buscas ya no está disponible.</p>
        <a href="index.html" class="btn btn-primary">Volver a la tienda</a>
      </div>
    `;
    return;
  }

  // Update page title
  document.title = `${product.name} - D&E Shop ✨`;

  // Track product view
  Analytics.trackProductView(productId, product.name);
  window.addEventListener('beforeunload', () => {
    Analytics.trackProductViewEnd(productId, product.name);
  });

  let quantity = 1;
  const rating = App.getAverageRating(product);
  const reviewCount = product.reviews ? product.reviews.length : 0;
  const categories = App.getCategories();
  const cat = categories.find(c => c.id === product.category);

  // ── Render Product ──
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const hasSizes = (product.sizeVariants && product.sizeVariants.length > 0) || (product.sizes && product.sizes.length > 0);
  const sizeOptions = product.sizeVariants ? product.sizeVariants.map(v => v.size) : (product.sizes || []);
  // hasColors: true if any size variant has colors, or if legacy product.colors exists
  const hasColors = (product.sizeVariants && product.sizeVariants.some(v => v.colors && v.colors.length > 0))
    || (product.colors && product.colors.length > 0);
  const stock = product.stock || 0;
  const stockClass = stock > 10 ? 'stock-ok' : (stock > 0 ? 'stock-low' : 'stock-out');
  const stockText = stock > 0 ? `${stock} unidades disponibles` : 'Agotado';

  // ── Build carousel HTML ──
  const carouselDotsHTML = images.length > 1
    ? `<div class="pg-dots">${images.map((_, i) => `<span class="pg-dot${i === 0 ? ' active' : ''}" data-idx="${i}"></span>`).join('')}</div>`
    : '';
  const carouselArrowsHTML = images.length > 1
    ? `<button class="pg-arrow pg-arrow-left" id="pg-prev" aria-label="Anterior">&#8249;</button>
       <button class="pg-arrow pg-arrow-right" id="pg-next" aria-label="Siguiente">&#8250;</button>`
    : '';

  document.getElementById('product-detail').innerHTML = `
    <div class="product-gallery">
      ${images.length > 1 ? `
        <div class="pg-carousel" id="pg-carousel" style="width: 100%;">
          <div class="pg-track" id="pg-track">
            ${images.map((img, i) => `
              <div class="pg-slide">
                <img src="${img}" alt="${App.sanitize(product.name)} - foto ${i+1}"
                     onerror="this.onerror=null; this.src=App.PLACEHOLDER;">
              </div>
            `).join('')}
          </div>
          ${carouselArrowsHTML}
          ${carouselDotsHTML}
          <div class="pg-counter"><span id="pg-current">1</span> / ${images.length}</div>
        </div>
        <div class="thumbnail-strip">
          ${images.map((img, i) => `
            <div class="thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
              <img src="${img}" onerror="this.onerror=null; this.src=App.PLACEHOLDER;">
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="main-image-wrap">
          <img src="${images[0]}" alt="${App.sanitize(product.name)}" id="main-product-img"
               onerror="this.onerror=null; this.src=App.PLACEHOLDER;">
        </div>
      `}
    </div>
    <div class="product-info">
      <span class="category-tag">${cat ? cat.emoji + ' ' + App.sanitize(cat.name) : App.sanitize(product.category)}</span>
      <h1>${App.sanitize(product.name)}</h1>
      <div class="product-card-rating mb-2">
        <div class="stars">${App.starsHTML(rating)}</div>
        <span class="rating-count">${rating > 0 ? rating : 'Sin calificaciones'} (${reviewCount} reseña${reviewCount !== 1 ? 's' : ''})</span>
      </div>
      <div class="price-block">
        ${App.formatPrice(product.price)}
        ${product.oldPrice ? `<span style="font-size: 1.2rem; color: var(--texto-muted); text-decoration: line-through; margin-left: 10px;">${App.formatPrice(product.oldPrice)}</span>` : ''}
      </div>
      <p class="description">${App.sanitize(product.description)}</p>

      <div class="stock-badge ${stockClass}">
        <span class="dot"></span> ${stockText}
      </div>

      ${hasSizes ? `
        <div class="size-selector-wrap mt-3 mb-3">
          <label style="font-size: 0.88rem; font-weight: 500; margin-bottom: 8px; display: block;">Seleccionar Talla</label>
          <div class="size-options" style="display: flex; gap: 10px;">
            ${sizeOptions.map(s => `<button class="size-option-btn" data-size="${App.sanitize(s)}">${App.sanitize(s)}</button>`).join('')}
          </div>
        </div>
      ` : ''}

      <div class="color-selector-wrap mt-3 mb-3" id="color-selector-container" style="display: none;">
        <label style="font-size: 0.88rem; font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
          🎨 Color:
          <span id="selected-color-name" style="color: var(--primary); font-weight: 700;"></span>
          <span style="color: var(--danger); font-weight: bold; font-size: 0.8rem;" id="color-required-label">(Requerido)</span>
        </label>
        <div class="color-options" id="color-options-grid" style="display: flex; gap: 14px; flex-wrap: wrap;">
          <!-- Colors will be loaded here dynamically -->
        </div>
      </div>

      <label style="font-size: 0.88rem; font-weight: 500; margin-bottom: 8px; display: block;">Cantidad</label>
      <div class="quantity-selector">
        <button class="qty-btn" id="qty-minus">−</button>
        <input type="number" class="qty-input" id="qty-input" value="1" min="1" max="99">
        <button class="qty-btn" id="qty-plus">+</button>
      </div>

      <button class="btn btn-primary btn-lg btn-block" id="btn-add-to-cart">
        🛒 Agregar al Carrito
      </button>

      <!-- Animated Trust Bar -->
      <div class="product-trust-bar">
        <div class="ptb-road">
          <span class="ptb-vehicle">🚚</span>
          <span class="ptb-vehicle" style="animation-delay: -3s; font-size: 1.35rem;">🛵</span>
          <span class="ptb-vehicle" style="animation-delay: -6s; font-size: 1.25rem;">🚲</span>
          <span class="ptb-box" style="animation-delay: -1.5s;">📦</span>
        </div>
        <div class="ptb-marquee-wrap">
          <div class="ptb-marquee">
            <span>📦 Envío desde <strong>RD$ 150</strong></span>
            <span class="ptb-sep">✦</span>
            <span>✅ Pago seguro vía <strong>WhatsApp</strong></span>
            <span class="ptb-sep">✦</span>
            <span>🚀 Directo a tu puerta</span>
            <span class="ptb-sep">✦</span>
            <span>✨ Define tu estilo</span>
            <span class="ptb-sep">✦</span>
            <span>👗 Lo último en tendencia</span>
            <span class="ptb-sep">✦</span>
            <span>💎 Calidad que se siente</span>
            <span class="ptb-sep">✦</span>
            <span>🌟 Renueva tu clóset</span>
            <span class="ptb-sep">✦</span>
            <span>🎁 Entregas rápidas</span>
            <span class="ptb-sep">✦</span>
            <span>🌟 Calidad garantizada</span>
            <span class="ptb-sep">✦</span>
            <!-- Repeat -->
            <span>📦 Envío desde <strong>RD$ 150</strong></span>
            <span class="ptb-sep">✦</span>
            <span>✅ Pago seguro vía <strong>WhatsApp</strong></span>
            <span class="ptb-sep">✦</span>
            <span>🚀 Directo a tu puerta</span>
            <span class="ptb-sep">✦</span>
            <span>✨ Define tu estilo</span>
            <span class="ptb-sep">✦</span>
            <span>👗 Lo último en tendencia</span>
            <span class="ptb-sep">✦</span>
            <span>💎 Calidad que se siente</span>
            <span class="ptb-sep">✦</span>
            <span>🌟 Renueva tu clóset</span>
            <span class="ptb-sep">✦</span>
            <span>🎁 Entregas rápidas</span>
            <span class="ptb-sep">✦</span>
            <span>🌟 Calidad garantizada</span>
            <span class="ptb-sep">✦</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Carousel Logic (Temu/Shein style) ──
  if (images.length > 1) {
    let pgIdx = 0;
    const track = document.getElementById('pg-track');
    const dots = document.querySelectorAll('.pg-dot');
    const counter = document.getElementById('pg-current');
    const thumbs = document.querySelectorAll('.thumb');

    function goTo(idx) {
      pgIdx = (idx + images.length) % images.length;
      track.style.transform = `translateX(-${pgIdx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === pgIdx));
      thumbs.forEach((t, i) => t.classList.toggle('active', i === pgIdx));
      if (counter) counter.textContent = pgIdx + 1;
    }

    document.getElementById('pg-prev').addEventListener('click', () => goTo(pgIdx - 1));
    document.getElementById('pg-next').addEventListener('click', () => goTo(pgIdx + 1));
    dots.forEach(d => d.addEventListener('click', () => goTo(parseInt(d.dataset.idx))));
    thumbs.forEach(t => t.addEventListener('click', () => goTo(parseInt(t.dataset.index))));

    // Touch/swipe support
    const carousel = document.getElementById('pg-carousel');
    let touchStartX = 0;
    carousel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) goTo(diff > 0 ? pgIdx + 1 : pgIdx - 1);
    });
  }

  // ── Quantity Controls ──
  const qtyInput = document.getElementById('qty-input');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');

  qtyMinus.addEventListener('click', () => {
    quantity = Math.max(1, quantity - 1);
    qtyInput.value = quantity;
  });

  qtyPlus.addEventListener('click', () => {
    quantity = Math.min(99, quantity + 1);
    qtyInput.value = quantity;
  });

  qtyInput.addEventListener('change', () => {
    quantity = Math.max(1, Math.min(99, parseInt(qtyInput.value) || 1));
    qtyInput.value = quantity;
  });

  // ── Size Selection Logic ──
  let selectedSize = null;
  let selectedColor = null;
  const sizeBtns = document.querySelectorAll('.size-option-btn');
  const colorContainer = document.getElementById('color-selector-container');
  const colorGrid = document.getElementById('color-options-grid');

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.dataset.size;

      // Update Colors based on size
      selectedColor = null;
      renderAvailableColors(selectedSize);
    });
  });

  function renderAvailableColors(size) {
    let availableColors = [];
    if (product.sizeVariants) {
      const variant = product.sizeVariants.find(v => v.size === size);
      availableColors = variant ? variant.colors : [];
    } else {
      // Legacy fallback
      availableColors = product.colors || [];
    }

    // Normalize to [{name, image}] format
    const normalizedColors = availableColors.map(c =>
      typeof c === 'string' ? { name: c, image: '' } : c
    );

    if (normalizedColors.length > 0) {
      colorContainer.style.display = 'block';
      colorGrid.innerHTML = normalizedColors.map(c => {
        const hasPhoto = c.image && c.image.trim() !== '';
        const firstLetter = (c.name || '?').charAt(0).toUpperCase();
        return `
          <div class="color-option" data-color="${App.sanitize(c.name)}" data-image="${App.sanitize(c.image || '')}" title="${App.sanitize(c.name)}">
            <div class="color-swatch-circle">
              ${hasPhoto
            ? `<img src="${App.sanitize(c.image)}" alt="${App.sanitize(c.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                   <span class="swatch-fallback" style="display:none; background:${App.getColorCode(c.name)}">${firstLetter}</span>`
            : `<span class="swatch-fallback" style="background:${App.getColorCode(c.name)}">${firstLetter}</span>`
          }
            </div>
            <span class="swatch-label">${App.sanitize(c.name)}</span>
          </div>
        `;
      }).join('');

      // Re-bind color click events
      const colorOpts = colorGrid.querySelectorAll('.color-option');
      colorOpts.forEach(opt => {
        opt.addEventListener('click', () => {
          colorOpts.forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          selectedColor = opt.dataset.color;

          // Update selected color name label
          const nameLabel = document.getElementById('selected-color-name');
          if (nameLabel) nameLabel.textContent = selectedColor;
          const reqLabel = document.getElementById('color-required-label');
          if (reqLabel) reqLabel.style.display = 'none';

          // If this color has its own image, switch the main product image
          const colorImg = opt.dataset.image;
          if (colorImg && colorImg.trim() !== '') {
            const mainImg = document.getElementById('main-product-img');
            if (mainImg) mainImg.src = colorImg;
            // Also highlight the matching thumbnail if exists
            document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
          }
        });
      });
    } else {
      colorContainer.style.display = 'none';
    }

    // Re-show required label if no color selected yet
    const reqLabel = document.getElementById('color-required-label');
    if (reqLabel) reqLabel.style.display = '';
    selectedColor = null;
    const nameLabel = document.getElementById('selected-color-name');
    if (nameLabel) nameLabel.textContent = '';
  }

  // Handle case where no sizes exist but colors do (global)
  if (!hasSizes && hasColors) {
    renderAvailableColors(null);
  }

  // ── Add to Cart ──
  document.getElementById('btn-add-to-cart').addEventListener('click', () => {
    if (stock <= 0) {
      App.showToast('Lo sentimos, este producto está agotado', 'error');
      return;
    }

    if (hasSizes && !selectedSize) {
      document.querySelector('.size-selector-wrap').classList.add('error-shake');
      setTimeout(() => document.querySelector('.size-selector-wrap').classList.remove('error-shake'), 500);
      App.showToast('Por favor selecciona una talla', 'error');
      return;
    }

    if (hasColors && !selectedColor) {
      document.querySelector('.color-selector-wrap').classList.add('error-shake');
      setTimeout(() => document.querySelector('.color-selector-wrap').classList.remove('error-shake'), 500);
      App.showToast('Por favor selecciona un color', 'error');
      return;
    }

    Analytics.trackAddToCart(productId, quantity, selectedSize, selectedColor);
    App.addToCart(productId, quantity, selectedSize, selectedColor);
  });

  // ── Render Reviews ──
  renderReviews();

  function renderReviews() {
    const freshProduct = App.getProduct(productId);
    const reviews = freshProduct.reviews || [];
    const fitStats = App.getFitStats(freshProduct);
    const avgRating = App.getAverageRating(freshProduct);

    // ── Star distribution ──
    const starCounts = [5,4,3,2,1].map(star => ({
      star,
      count: reviews.filter(r => Math.round(r.rating) === star).length
    }));

    let html = `<h2 class="section-title"><span class="emoji">💬</span> Reseñas (${reviews.length})</h2>`;

    // ── Rating overview + Fit stats ──
    if (reviews.length > 0) {
      html += `
        <div class="review-overview-grid">
          <!-- Left: avg + stars breakdown -->
          <div class="review-avg-block">
            <div class="review-avg-number">${avgRating}</div>
            <div class="stars" style="font-size:1.4rem;">${App.starsHTML(avgRating)}</div>
            <div style="font-size:0.8rem;color:var(--texto-muted);margin-top:4px;">${reviews.length} reseña${reviews.length !== 1 ? 's' : ''}</div>
            <div style="margin-top:14px;width:100%;">
              ${starCounts.map(s => {
                const pct = reviews.length > 0 ? Math.round((s.count / reviews.length) * 100) : 0;
                return `
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;font-size:0.8rem;">
                    <span style="white-space:nowrap;color:var(--texto-muted);">${s.star} ★</span>
                    <div style="flex:1;height:7px;background:#f0e6ea;border-radius:4px;overflow:hidden;">
                      <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#FFD93D,#f59e0b);border-radius:4px;transition:width 0.6s ease;"></div>
                    </div>
                    <span style="color:var(--texto-muted);width:28px;text-align:right;">${pct}%</span>
                  </div>`;
              }).join('')}
            </div>
          </div>

          <!-- Right: Fit stats -->
          ${fitStats ? `
          <div class="review-fit-block">
            <div style="font-weight:700;font-size:0.9rem;margin-bottom:12px;color:var(--texto);">📏 ¿Qué tal te quedó?</div>
            ${fitStats.map(f => {
              const barColor = f.label === 'Excelente' ? '#22c55e'
                : f.label === 'A la medida' ? '#3b82f6'
                : f.label === 'Un poco grande' ? '#f59e0b'
                : '#ef4444';
              return `
                <div style="margin-bottom:10px;">
                  <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px;">
                    <span style="font-weight:600;">${f.label}</span>
                    <span style="color:var(--texto-muted);">${f.pct}% <span style="font-size:0.72rem;">(${f.count})</span></span>
                  </div>
                  <div style="height:10px;background:#f0e6ea;border-radius:6px;overflow:hidden;">
                    <div style="width:${f.pct}%;height:100%;background:${barColor};border-radius:6px;transition:width 0.7s ease;"></div>
                  </div>
                </div>`;
            }).join('')}
          </div>` : ''}
        </div>`;
    }

    // ── Individual Reviews ──
    if (reviews.length > 0) {
      html += reviews.slice().reverse().map(review => {
        const media = review.media || [];
        const photos = media.filter(m => m.type === 'photo');
        const video = media.find(m => m.type === 'video');

        return `
          <div class="review-card fade-in-up">
            <div class="review-header">
              <div class="review-avatar">${App.sanitize(review.name).charAt(0).toUpperCase()}</div>
              <div class="review-meta">
                <div class="review-name">${App.sanitize(review.name)}</div>
                <div class="review-date">${formatDate(review.date)}</div>
              </div>
              <div class="stars">${App.starsHTML(review.rating)}</div>
              ${review.fit ? `<span style="font-size:0.75rem;background:#f0f9ff;color:#0369a1;padding:3px 9px;border-radius:20px;font-weight:600;border:1px solid #bae6fd;">📏 ${App.sanitize(review.fit)}</span>` : ''}
            </div>
            <p class="review-text">${App.sanitize(review.text)}</p>

            ${photos.length > 0 ? `
              <div class="review-media-grid">
                ${photos.map(m => `
                  <div class="review-media-item" onclick="openMediaLightbox('${m.src}','photo')">
                    <img src="${m.src}" alt="Foto de la reseña" loading="lazy" onerror="this.parentElement.style.display='none'">
                    <div class="media-play-overlay" style="display:none;"></div>
                  </div>`).join('')}
              </div>` : ''}

            ${video ? `
              <div class="review-video-wrap">
                ${(video.isLocal || video.src.startsWith('data:')) ? `
                  <video controls style="width:100%;border-radius:10px;max-height:280px;background:#000;">
                    <source src="${video.src}">
                    Tu navegador no soporta video.
                  </video>` :
                  (video.src.includes('youtube') || video.src.includes('youtu.be')) ? `
                  <iframe src="${video.src.replace('watch?v=','embed/').replace('youtu.be/','www.youtube.com/embed/')}"
                    frameborder="0" allow="autoplay; encrypted-media" allowfullscreen
                    style="width:100%;aspect-ratio:16/9;border-radius:10px;"></iframe>` : `
                  <video controls style="width:100%;border-radius:10px;max-height:280px;">
                    <source src="${video.src}">
                    Tu navegador no soporta video.
                  </video>`}
              </div>` : ''}
          </div>`;
      }).join('');
    } else {
      html += `<p style="color:var(--texto-light);margin-bottom:20px;">Aún no hay reseñas. ¡Sé el primero en opinar!</p>`;
    }

    // ── Review Form ──
    html += `
      <div class="review-form">
        <h3>✍️ Escribe una reseña</h3>

        <div class="form-group">
          <label>Tu nombre</label>
          <input type="text" id="review-name" placeholder="Ej: María García">
        </div>

        <div class="form-group">
          <label>Calificación</label>
          <div class="star-input" id="star-input">
            <span data-star="1">★</span><span data-star="2">★</span>
            <span data-star="3">★</span><span data-star="4">★</span>
            <span data-star="5">★</span>
          </div>
        </div>

        <div class="form-group">
          <label>Tu reseña</label>
          <textarea id="review-text" rows="3" placeholder="¿Qué te pareció este producto?"></textarea>
        </div>

        <!-- Fit Survey -->
        <div class="form-group">
          <label style="font-weight:700;">📏 ¿Qué tal te quedó? <span style="font-size:0.78rem;color:var(--texto-muted);font-weight:400;">(opcional)</span></label>
          <div class="fit-options-grid">
            ${[
              {val:'Excelente', icon:'🏆', color:'#22c55e'},
              {val:'A la medida', icon:'✅', color:'#3b82f6'},
              {val:'Un poco grande', icon:'📦', color:'#f59e0b'},
              {val:'Un poco pequeño', icon:'🔍', color:'#ef4444'}
            ].map(o => `
              <label class="fit-option-label">
                <input type="radio" name="review_fit" value="${o.val}" style="display:none;">
                <div class="fit-option-card" style="--fit-color:${o.color};">
                  <span class="fit-icon">${o.icon}</span>
                  <span class="fit-text">${o.val}</span>
                </div>
              </label>`).join('')}
          </div>
        </div>

        <!-- Media Upload -->
        <div class="form-group">
          <label style="font-weight:700;">📸 Fotos <span style="font-size:0.78rem;color:var(--texto-muted);font-weight:400;">(máx. 3 — opcional)</span></label>
          <div class="review-upload-zone" id="review-photo-zone">
            <input type="file" id="review-photo-input" accept="image/*" multiple style="display:none;">
            <div id="review-photo-preview" class="review-photo-preview"></div>
            <button type="button" class="btn btn-sm btn-secondary" id="btn-add-photos" onclick="document.getElementById('review-photo-input').click()">
              📷 Seleccionar fotos
            </button>
            <p style="font-size:0.75rem;color:var(--texto-muted);margin-top:6px;">Las fotos ayudan a otros compradores a ver el producto real.</p>
          </div>
        </div>

        <!-- Video Upload -->
        <div class="form-group">
          <label style="font-weight:700;">🎬 Video <span style="font-size:0.78rem;color:var(--texto-muted);font-weight:400;">(desde tu galería — máx. 20 MB — opcional)</span></label>
          <div class="review-upload-zone" id="review-video-zone" style="position:relative;">
            <input type="file" id="review-video-input" accept="video/*" style="display:none;">
            <div id="review-video-preview"></div>
            <button type="button" class="btn btn-sm btn-secondary" id="btn-add-video"
              onclick="document.getElementById('review-video-input').click()" style="gap:6px;">
              🎥 Seleccionar video
            </button>
            <p style="font-size:0.75rem;color:var(--texto-muted);margin-top:6px;">Clip corto del producto (mp4, mov, etc.). Máximo 20 MB.</p>
          </div>
          <div style="margin-top:10px;padding:10px 12px;background:var(--fondo);border-radius:8px;border:1px solid var(--borde);">
            <div style="font-size:0.78rem;color:var(--texto-muted);margin-bottom:6px;">📎 O pega un link de YouTube (opcional)</div>
            <input type="url" id="review-video-url" placeholder="https://youtube.com/watch?v=..." style="font-size:0.85rem;">
          </div>
        </div>

        <button class="btn btn-primary" id="btn-submit-review">Enviar Reseña ⭐</button>
      </div>

      <!-- Lightbox -->
      <div id="media-lightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;align-items:center;justify-content:center;" onclick="this.style.display='none'">
        <img id="lightbox-img" src="" style="max-width:90vw;max-height:90vh;border-radius:10px;object-fit:contain;">
      </div>
    `;

    document.getElementById('reviews-section').innerHTML = html;

    // ── Lightbox function ──
    window.openMediaLightbox = function(src, type) {
      const lb = document.getElementById('media-lightbox');
      const img = document.getElementById('lightbox-img');
      img.src = src;
      lb.style.display = 'flex';
    };

    // ── Fit option card toggle ──
    document.querySelectorAll('.fit-option-label').forEach(label => {
      label.addEventListener('click', () => {
        document.querySelectorAll('.fit-option-card').forEach(c => c.classList.remove('selected'));
        label.querySelector('.fit-option-card').classList.add('selected');
      });
    });

    // ── Photo upload preview ──
    let reviewPhotos = [];
    const photoInput = document.getElementById('review-photo-input');
    const photoPreview = document.getElementById('review-photo-preview');

    photoInput.addEventListener('change', () => {
      const files = Array.from(photoInput.files).slice(0, 3 - reviewPhotos.length);
      files.forEach(file => {
        if (reviewPhotos.length >= 3) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          reviewPhotos.push(e.target.result);
          renderPhotoPreview();
        };
        reader.readAsDataURL(file);
      });
      photoInput.value = '';
    });

    function renderPhotoPreview() {
      photoPreview.innerHTML = reviewPhotos.map((src, i) => `
        <div style="position:relative;display:inline-block;margin:4px;">
          <img src="${src}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:2px solid var(--rosa);">
          <button type="button" onclick="removeReviewPhoto(${i})"
            style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#ef4444;color:white;border:none;cursor:pointer;font-size:0.7rem;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>`).join('');
      document.getElementById('btn-add-photos').style.display = reviewPhotos.length >= 3 ? 'none' : '';
    }

    window.removeReviewPhoto = function(i) {
      reviewPhotos.splice(i, 1);
      renderPhotoPreview();
      document.getElementById('btn-add-photos').style.display = '';
    };

    // ── Video upload from gallery ──
    let reviewVideo = null; // base64 data URL or null
    const videoInput = document.getElementById('review-video-input');
    const videoPreview = document.getElementById('review-video-preview');
    const MAX_VIDEO_MB = 20;

    videoInput.addEventListener('change', () => {
      const file = videoInput.files[0];
      if (!file) return;

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_VIDEO_MB) {
        App.showToast(`El video pesa ${sizeMB.toFixed(1)} MB. Máximo ${MAX_VIDEO_MB} MB. Recorta el clip e inténtalo de nuevo.`, 'error');
        videoInput.value = '';
        return;
      }

      // Show loading indicator
      videoPreview.innerHTML = `<div style="padding:12px;font-size:0.85rem;color:var(--texto-muted);">⏳ Procesando video...</div>`;
      document.getElementById('btn-add-video').disabled = true;

      const reader = new FileReader();
      reader.onload = (e) => {
        reviewVideo = e.target.result;
        renderVideoPreview();
        document.getElementById('btn-add-video').disabled = false;
      };
      reader.onerror = () => {
        App.showToast('Error al leer el video. Inténtalo de nuevo.', 'error');
        document.getElementById('btn-add-video').disabled = false;
        videoPreview.innerHTML = '';
      };
      reader.readAsDataURL(file);
      videoInput.value = '';
    });

    function renderVideoPreview() {
      if (!reviewVideo) { videoPreview.innerHTML = ''; return; }
      videoPreview.innerHTML = `
        <div style="position:relative;margin-bottom:10px;">
          <video src="${reviewVideo}" controls
            style="width:100%;max-height:200px;border-radius:10px;object-fit:cover;border:2px solid var(--rosa);"></video>
          <button type="button" onclick="removeReviewVideo()"
            style="position:absolute;top:8px;right:8px;background:#ef4444;color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);">✕</button>
        </div>`;
      document.getElementById('btn-add-video').style.display = 'none';
    }

    window.removeReviewVideo = function() {
      reviewVideo = null;
      renderVideoPreview();
      document.getElementById('btn-add-video').style.display = '';
    };

    // ── Star Rating ──
    let selectedRating = 0;
    const starContainer = document.getElementById('star-input');
    starContainer.querySelectorAll('span').forEach(star => {
      star.addEventListener('mouseenter', () => highlightStars(parseInt(star.dataset.star)));
      star.addEventListener('click', () => { selectedRating = parseInt(star.dataset.star); highlightStars(selectedRating); });
    });
    starContainer.addEventListener('mouseleave', () => highlightStars(selectedRating));

    function highlightStars(count) {
      starContainer.querySelectorAll('span').forEach(s => {
        const val = parseInt(s.dataset.star);
        s.classList.toggle('filled', val <= count);
        s.style.color = val <= count ? '#FFD93D' : '#F0E6EA';
      });
    }

    // ── Submit Review ──
    document.getElementById('btn-submit-review').addEventListener('click', () => {
      const name = document.getElementById('review-name').value.trim();
      const text = document.getElementById('review-text').value.trim();
      const videoUrl = document.getElementById('review-video-url').value.trim();
      const fitRadio = document.querySelector('input[name="review_fit"]:checked');
      const fit = fitRadio ? fitRadio.value : null;

      if (!name) return App.showToast('Por favor ingresa tu nombre.', 'error');
      if (selectedRating === 0) return App.showToast('Por favor selecciona una calificación.', 'error');
      if (!text) return App.showToast('Por favor escribe tu reseña.', 'error');

      // Use uploaded video (base64) first, fall back to YouTube URL
      const videoSrc = reviewVideo || videoUrl || null;
      const media = [
        ...reviewPhotos.map(src => ({ type: 'photo', src })),
        ...(videoSrc ? [{ type: 'video', src: videoSrc, isLocal: !!reviewVideo }] : [])
      ];

      App.addReview(productId, { name, rating: selectedRating, text, fit, media });
      App.showToast('¡Gracias por tu reseña! ⭐', 'success');
      renderReviews();
    });
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ── Render Similar Products ──
  renderSimilarProducts();

  function renderSimilarProducts() {
    const similarContainer = document.getElementById('similar-products-section');
    if (!similarContainer) return;

    // Get similar products automatically (by category + supplier + price family)
    const similar = App.getSimilarProducts(product, 8);

    if (similar.length === 0) {
      similarContainer.style.display = 'none';
      return;
    }

    let html = `
      <div class="section-flex-header" style="margin-top: 40px;">
        <h2 class="section-title-line">PRODUCTOS SIMILARES</h2>
      </div>
      <div class="products-grid">
    `;

    html += similar.map(p => {
      const imgs = p.images && p.images.length > 0 ? p.images : [p.image];
      const nameEscaped = App.sanitize(p.name).replace(/'/g, "\\'");
      const clickTrack = `Analytics.trackProductClick('${p.id}', '${nameEscaped}')`;
      
      let soldCount = p.stock ? p.stock * 3 + 12 : 124;
      if (soldCount > 999) soldCount = Math.floor(soldCount/1000) + 'k';
      const fakeRating = (4 + Math.random() * 0.9).toFixed(1);

      return `
        <div class="product-card temu-card">
          ${p.badge ? `<span class="badge ${p.badgeType === 'discount' ? 'badge-discount' : 'badge-featured'}">${p.badge}</span>` : ''}
          
          <div class="card-img-slider">
            ${imgs.map(url => `
              <a href="product.html?id=${p.id}" class="card-img-slide" onclick="${clickTrack}">
                <img class="img-skeleton"
                     data-lazy-src="${url}"
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                     alt="${App.sanitize(p.name)}">
              </a>
            `).join('')}
            ${imgs.length > 1 ? `<div class="card-img-slider-hint">Desliza ➔</div>` : ''}
          </div>

          <div class="temu-card-body">
            <a href="product.html?id=${p.id}" class="product-title line-clamp-2" onclick="${clickTrack}">
              ${App.sanitize(p.name)}
            </a>
            
            <div class="temu-shipping-tag">🚚 Envío a tu puerta o provincia</div>
            
            <div class="temu-price-row">
              <span class="temu-price">${App.formatPrice(p.price)}</span>
              ${p.oldPrice ? `<span class="temu-old-price">${App.formatPrice(p.oldPrice)}</span>` : ''}
            </div>
            
            <div class="temu-stats">
               <span>⭐ ${fakeRating}</span>
               <span>|</span>
               <span>+${soldCount} vendidos</span>
            </div>

            <button class="quick-add-btn" onclick="window.location.href='product.html?id=${p.id}'" title="Ver Producto">
              🛒
            </button>
          </div>
        </div>
      `;
    }).join('');

    html += `</div>`;
    similarContainer.innerHTML = html;

    // Activate lazy load for the similar products
    if (typeof LazyGallery !== 'undefined') {
      LazyGallery.init();
    }
  }
}

if (App.isReady) {
    initProduct();
} else {
    window.addEventListener('app-ready', initProduct);
}
