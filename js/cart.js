/* ================================================
   D&E Shop — Cart Page Logic
   Cart rendering, shipping selector, WhatsApp checkout
   ================================================ */

function initCart() {
  if (window._cartInited) return;
  window._cartInited = true;
  document.getElementById('header-root').innerHTML = App.renderHeader('cart');
  document.getElementById('footer-root').innerHTML = App.renderFooter();

  let shippingType = 'santo-domingo';

  function renderCart() {
    const cart = App.getCart();
    const products = App.getProducts();
    const container = document.getElementById('cart-content');

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="emoji">🛒</div>
          <h2>Tu carrito está vacío</h2>
          <p>¡Explora nuestra tienda y encuentra algo que te encante!</p>
          <a href="index.html" class="btn btn-primary">Ir a la Tienda</a>
        </div>
      `;
      return;
    }

    let subtotal = 0;
    const itemsHTML = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return '';
      const itemTotal = product.price * item.qty;
      subtotal += itemTotal;
      
      const cartImg = product.images && product.images.length > 0 ? product.images[0] : (product.image || '');

      return `
        <div class="cart-item fade-in-up">
          <a href="product.html?id=${product.id}">
            <img class="cart-item-img" src="${cartImg}" alt="${App.sanitize(product.name)}"
                 onerror="this.src=App.PLACEHOLDER">
          </a>
          <div class="cart-item-info">
            <a href="product.html?id=${product.id}" class="cart-item-title">${App.sanitize(product.name)}</a>
            <div style="display: flex; gap: 10px; margin-top: 4px;">
              ${item.size ? `<span class="cart-item-size" style="font-size: 0.82rem; color: var(--texto-muted);">Talla: <strong>${App.sanitize(item.size)}</strong></span>` : ''}
              ${item.color ? (() => {
          // Find color image if available
          let colorImg = '';
          if (product.sizeVariants) {
            for (const sv of product.sizeVariants) {
              const found = (sv.colors || []).find(c => (typeof c === 'object' ? c.name : c) === item.color);
              if (found && typeof found === 'object' && found.image) { colorImg = found.image; break; }
            }
          }
          const swatchHTML = colorImg
            ? `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;overflow:hidden;border:1px solid #ccc;vertical-align:middle;"><img src="${colorImg}" style="width:100%;height:100%;object-fit:cover;" alt=""></span>`
            : `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${App.getColorCode(item.color)};border:1px solid #ccc;"></span>`;
          return `<span class="cart-item-color" style="font-size:0.82rem;color:var(--texto-muted);display:flex;align-items:center;gap:4px;">Color: ${swatchHTML} <strong>${App.sanitize(item.color)}</strong></span>`;
        })() : ''}
            </div>
            <span class="cart-item-price" style="display: block; margin-top: 4px;">${App.formatPrice(product.price)} × ${item.qty} = ${App.formatPrice(itemTotal)}</span>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-selector" style="margin: 0;">
              <button class="qty-btn" onclick="updateQty('${product.id}', ${item.qty - 1}, '${item.size || ''}', '${item.color || ''}')">−</button>
              <input type="number" class="qty-input" value="${item.qty}" min="1" max="99"
                     onchange="updateQty('${product.id}', parseInt(this.value) || 1, '${item.size || ''}', '${item.color || ''}')"
                     style="width: 50px;">
              <button class="qty-btn" onclick="updateQty('${product.id}', ${item.qty + 1}, '${item.size || ''}', '${item.color || ''}')">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeItem('${product.id}', '${item.size || ''}', '${item.color || ''}')" title="Eliminar">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    const total = subtotal;

    container.innerHTML = `
      <div class="cart-layout">
        <div class="cart-items">
          ${itemsHTML}
        </div>
        <div class="cart-summary">
          <h2>📋 Resumen del Pedido</h2>

          <div class="cart-summary-row">
            <span>Subtotal (${cart.reduce((s, i) => s + i.qty, 0)} artículos)</span>
            <span>${App.formatPrice(subtotal)}</span>
          </div>

          <div class="shipping-selector">
            <label style="font-size: 0.88rem; font-weight: 500; margin-bottom: 8px; display: block;">📦 Zona de Envío</label>
            <div class="shipping-option ${shippingType === 'santo-domingo' ? 'selected' : ''}" onclick="setShipping('santo-domingo')">
              <input type="radio" name="shipping" value="santo-domingo" ${shippingType === 'santo-domingo' ? 'checked' : ''}>
              <div>
                <strong>Santo Domingo</strong>
                <div style="font-size: 0.85rem; color: var(--texto-light);">A convenir</div>
              </div>
            </div>
            <div class="shipping-option ${shippingType === 'exterior' ? 'selected' : ''}" onclick="setShipping('exterior')">
              <input type="radio" name="shipping" value="exterior" ${shippingType === 'exterior' ? 'checked' : ''}>
              <div>
                <strong>Exterior / Provincias</strong>
                <div style="font-size: 0.85rem; color: var(--texto-light);">A convenir</div>
              </div>
            </div>
          </div>

          <div class="cart-summary-row">
            <span>Envío</span>
            <span>A convenir</span>
          </div>

          <div class="cart-summary-row total">
            <span>Total (sin envío)</span>
            <span>${App.formatPrice(total)}</span>
          </div>

          <button class="btn btn-whatsapp btn-block mt-2" onclick="window.openCheckoutModal()">
            📱 Finalizar Pedido por WhatsApp
          </button>

          <a href="index.html" class="btn btn-secondary btn-block mt-1" style="text-align: center;">
            ← Seguir Comprando
          </a>
        </div>
      </div>
    `;
  }

  // Expose functions globally
  window.updateQty = function (productId, newQty, size = null, color = null) {
    const sizeVal = (size === '' || size === 'null') ? null : size;
    const colorVal = (color === '' || color === 'null') ? null : color;
    if (newQty < 1) {
      window.removeItem(productId, sizeVal, colorVal);
      return;
    }
    App.updateCartQty(productId, newQty, sizeVal, colorVal);
    renderCart();
  };

  window.removeItem = function (productId, size = null, color = null) {
    const sizeVal = (size === '' || size === 'null') ? null : size;
    const colorVal = (color === '' || color === 'null') ? null : color;
    App.removeFromCart(productId, sizeVal, colorVal);
    renderCart();
    App.showToast('Producto eliminado del carrito', 'info');
  };

  window.setShipping = function (type) {
    shippingType = type;
    renderCart();
  };

  // ── WhatsApp Checkout Stepper Modal ──
  function injectCheckoutModal() {
    if (document.getElementById('checkout-modal-overlay')) return;
    const el = document.createElement('div');
    el.innerHTML = `
      <div id="checkout-modal-overlay" class="checkout-modal-overlay">
        <div class="checkout-modal">
          <!-- Header -->
          <div class="cm-header">
            <button class="cm-close-btn" id="cm-close-btn" aria-label="Cerrar">✕</button>
            <div class="cm-header-title">🛍️ Finalizar Pedido</div>
            <div class="cm-header-subtitle">Solo 2 pasos para completar tu compra</div>
          </div>

          <!-- Steps indicator -->
          <div class="cm-steps">
            <div class="cm-step active" id="cm-step-1">
              <div class="cm-step-num">1</div>
              <span>Resumen</span>
            </div>
            <div class="cm-step-connector" id="cm-connector"></div>
            <div class="cm-step" id="cm-step-2">
              <div class="cm-step-num">2</div>
              <span>Envío</span>
            </div>
          </div>

          <!-- PANEL 1: Client Info -->
          <div class="cm-body">
            <div class="cm-panel active" id="cm-panel-1">
              <p style="font-size:0.88rem; color:var(--texto-muted); margin-bottom:14px;">Ingresa tus datos para el envío</p>
              <div style="display:flex;flex-direction:column;gap:12px; margin-bottom: 16px; text-align:left;">
                <div>
                  <label style="font-size:0.85rem; font-weight:600; margin-bottom:4px; display:block;">Nombre Completo <span style="color:var(--danger);">*</span></label>
                  <input type="text" id="cm-input-name" placeholder="Ej. Juan Pérez" style="width:100%;" required>
                </div>
                <div>
                  <label style="font-size:0.85rem; font-weight:600; margin-bottom:4px; display:block;">Teléfono (WhatsApp) <span style="color:var(--danger);">*</span></label>
                  <input type="tel" id="cm-input-phone" placeholder="Ej. 809-000-0000" style="width:100%;" required>
                </div>
                <div>
                  <label style="font-size:0.85rem; font-weight:600; margin-bottom:4px; display:block;">Provincia / Ciudad <span style="color:var(--danger);">*</span></label>
                  <input type="text" id="cm-input-city" placeholder="Ej. Santo Domingo, Santiago..." style="width:100%;" required>
                </div>
              </div>
              <div style="margin-top:16px;padding-top:14px;border-top:2px solid var(--borde);display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:0.92rem;color:var(--texto-light);">Subtotal</span>
                <span id="cm-subtotal" style="font-family:'Outfit',sans-serif;font-size:1.2rem;font-weight:800;color:var(--primary);"></span>
              </div>
            </div>

            <!-- PANEL 2: Shipping Selection -->
            <div class="cm-panel" id="cm-panel-2">
              <p style="font-size:0.88rem; color:var(--texto-muted); margin-bottom:4px;">¿Dónde te enviamos tu pedido?</p>
              <div class="shipping-cards-grid">
                <div class="shipping-card selected" id="sc-sd" onclick="window.selectShippingCard('santo-domingo')">
                  <span class="sc-emoji">🛵</span>
                  <div class="sc-label">Santo Domingo</div>
                  <div class="sc-price">A convenir</div>
                </div>
                <div class="shipping-card" id="sc-ext" onclick="window.selectShippingCard('exterior')">
                  <span class="sc-emoji">🚚</span>
                  <div class="sc-label">Provincias</div>
                  <div class="sc-price">A convenir</div>
                </div>
              </div>
              <div class="cm-total-preview">
                <div class="cm-total-row">
                  <span>Subtotal</span>
                  <span id="cm-total-subtotal"></span>
                </div>
                <div class="cm-total-row">
                  <span>Envío</span>
                  <span id="cm-total-shipping"></span>
                </div>
                <div class="cm-total-row grand">
                  <span>TOTAL</span>
                  <span id="cm-total-grand" style="color:var(--primary);"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer actions -->
          <div class="cm-footer">
            <button class="btn btn-whatsapp btn-block" id="cm-action-btn" onclick="window.cmActionBtn()">
              Continuar → Elegir Envío
            </button>
            <button class="cm-btn-back hidden" id="cm-back-btn" onclick="window.cmGoBack()">
              ← Volver al resumen
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(el.firstElementChild);

    // Close button
    document.getElementById('cm-close-btn').addEventListener('click', window.closeCheckoutModal);
    document.getElementById('checkout-modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'checkout-modal-overlay') window.closeCheckoutModal();
    });
  }

  // Modal state
  let cmStep = 1;
  let cmShipping = 'santo-domingo';

  window.openCheckoutModal = function() {
    const cart = App.getCart();
    const products = App.getProducts();
    if (cart.length === 0) {
      App.showToast('Tu carrito está vacío', 'error');
      return;
    }

    // Validate sizes first
    const missingSize = cart.find(item => {
      const p = products.find(prod => prod.id === item.productId);
      return p && p.sizes && p.sizes.length > 0 && !item.size;
    });

    if (missingSize) {
      const p = products.find(prod => prod.id === missingSize.productId);
      App.showToast(`Por favor selecciona la talla para: ${p.name}`, 'error');
      setTimeout(() => { window.location.href = `product.html?id=${p.id}`; }, 1500);
      return;
    }

    injectCheckoutModal();

    // Populate subtotal
    let subtotal = 0;
    cart.forEach(item => {
      const p = products.find(pr => pr.id === item.productId);
      if (p) subtotal += p.price * item.qty;
    });

    document.getElementById('cm-subtotal').textContent = App.formatPrice(subtotal);
    
    // Pre-fill user data if logged in
    const user = App.getCurrentUser();
    if (user) {
      document.getElementById('cm-input-name').value = user.name || '';
      document.getElementById('cm-input-phone').value = user.phone || '';
      document.getElementById('cm-input-city').value = user.address || '';
    } else {
      document.getElementById('cm-input-name').value = '';
      document.getElementById('cm-input-phone').value = '';
      document.getElementById('cm-input-city').value = '';
    }

    // Reset to step 1
    cmStep = 1;
    cmShipping = 'santo-domingo';
    document.getElementById('cm-panel-1').classList.add('active');
    document.getElementById('cm-panel-2').classList.remove('active');
    document.getElementById('cm-step-1').classList.add('active');
    document.getElementById('cm-step-1').classList.remove('done');
    document.getElementById('cm-step-2').classList.remove('active', 'done');
    document.getElementById('cm-connector').classList.remove('done');
    document.getElementById('cm-action-btn').textContent = 'Continuar → Elegir Envío';
    document.getElementById('cm-action-btn').className = 'btn btn-primary btn-block';
    document.getElementById('cm-back-btn').classList.add('hidden');

    document.getElementById('checkout-modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeCheckoutModal = function() {
    const overlay = document.getElementById('checkout-modal-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  window.selectShippingCard = function(type) {
    cmShipping = type;
    document.getElementById('sc-sd').classList.toggle('selected', type === 'santo-domingo');
    document.getElementById('sc-ext').classList.toggle('selected', type === 'exterior');
    // Update totals
    const cart = App.getCart();
    const products = App.getProducts();
    const subtotal = cart.reduce((s, item) => {
      const p = products.find(pr => pr.id === item.productId);
      return s + (p ? p.price * item.qty : 0);
    }, 0);
    
    document.getElementById('cm-total-subtotal').textContent = App.formatPrice(subtotal);
    document.getElementById('cm-total-shipping').textContent = 'A convenir';
    document.getElementById('cm-total-grand').textContent = App.formatPrice(subtotal);
  };

  window.cmActionBtn = function() {
    if (cmStep === 1) {
      const name = document.getElementById('cm-input-name').value.trim();
      const phone = document.getElementById('cm-input-phone').value.trim();
      const city = document.getElementById('cm-input-city').value.trim();
      
      if (!name || !phone || !city) {
        App.showToast('Por favor completa todos los campos requeridos', 'error');
        return;
      }
      
      window._checkoutInfo = { name, phone, city };

      if (city.toLowerCase().includes('santo domingo')) {
        cmShipping = 'santo-domingo';
      } else {
        cmShipping = 'exterior';
      }

      // Move to step 2
      cmStep = 2;
      document.getElementById('cm-panel-1').classList.remove('active');
      document.getElementById('cm-panel-2').classList.add('active');
      document.getElementById('cm-step-1').classList.remove('active');
      document.getElementById('cm-step-1').classList.add('done');
      document.getElementById('cm-step-1').querySelector('.cm-step-num').textContent = '✓';
      document.getElementById('cm-step-2').classList.add('active');
      document.getElementById('cm-connector').classList.add('done');
      document.getElementById('cm-action-btn').innerHTML = '📱 Finalizar Pedido por WhatsApp';
      document.getElementById('cm-action-btn').className = 'btn btn-whatsapp btn-block';
      document.getElementById('cm-back-btn').classList.remove('hidden');
      // Pre-populate totals
      window.selectShippingCard(cmShipping);
    } else {
      // Finalize: Step 2 → WhatsApp
      window.closeCheckoutModal();
      window.finalizarPedido(cmShipping);
    }
  };

  window.cmGoBack = function() {
    cmStep = 1;
    document.getElementById('cm-panel-2').classList.remove('active');
    document.getElementById('cm-panel-1').classList.add('active');
    document.getElementById('cm-step-1').classList.add('active');
    document.getElementById('cm-step-1').classList.remove('done');
    document.getElementById('cm-step-1').querySelector('.cm-step-num').textContent = '1';
    document.getElementById('cm-step-2').classList.remove('active');
    document.getElementById('cm-connector').classList.remove('done');
    document.getElementById('cm-action-btn').textContent = 'Continuar → Elegir Envío';
    document.getElementById('cm-action-btn').className = 'btn btn-primary btn-block';
    document.getElementById('cm-back-btn').classList.add('hidden');
  };

  window.finalizarPedido = function (selectedShipping) {
    const resolvedShipping = selectedShipping || shippingType;
    const cart = App.getCart();
    if (cart.length === 0) {
      App.showToast('Tu carrito está vacío', 'error');
      return;
    }

    const products = App.getProducts();
    const missingSize = cart.find(item => {
      const p = products.find(prod => prod.id === item.productId);
      return p && p.sizes && p.sizes.length > 0 && !item.size;
    });

    if (missingSize) {
      const p = products.find(prod => prod.id === missingSize.productId);
      App.showToast(`Por favor selecciona la talla para: ${p.name}`, 'error');
      setTimeout(() => { window.location.href = `product.html?id=${p.id}`; }, 1500);
      return;
    }

    const orderItems = cart.map(item => {
      const p = products.find(pr => pr.id === item.productId);
      const itemTotal = (p ? p.price : 0) * item.qty;
      return {
        productId: item.productId,
        name: p ? p.name : item.productId,
        image: p ? (p.images ? p.images[0] : p.image) : '',
        price: p ? p.price : 0,
        qty: item.qty,
        size: item.size || null,
        color: item.color || null,
        subtotal: itemTotal
      };
    });

    const shipping = 0; // A convenir
    const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0);
    const total = subtotal;
    
    const info = window._checkoutInfo || {};

    App.saveOrder({
      items: orderItems,
      subtotal,
      shipping,
      shippingType: resolvedShipping,
      total,
      customer: { name: info.name, email: '', phone: info.phone, address: info.city }
    });

    const cartItems = orderItems.map(i => ({ name: i.name, qty: i.qty, price: i.price, size: i.size }));
    Analytics.trackCheckout(cartItems, total, resolvedShipping);
    App.sendToWhatsApp(resolvedShipping);
  };

  renderCart();
}

if (App.isReady) {
  initCart();
} else {
  window.addEventListener('app-ready', initCart);
}
