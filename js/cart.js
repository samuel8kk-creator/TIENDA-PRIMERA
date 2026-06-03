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

    const shipping = shippingType === 'santo-domingo' ? App.SHIPPING.SANTO_DOMINGO : App.SHIPPING.EXTERIOR;
    const total = subtotal + shipping;

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

          <div class="cart-summary-row total" style="margin-bottom: 20px;">
            <span>Subtotal estimado</span>
            <span>${App.formatPrice(subtotal)}</span>
          </div>

          <button class="btn btn-primary btn-block mt-2" onclick="openCheckoutStepper()">
            🛍️ Continuar al Pago
          </button>

          <a href="index.html" class="btn btn-secondary btn-block mt-1" style="text-align: center;">
            ← Seguir Comprando
          </a>
        </div>
      </div>

      <!-- Checkout Stepper Modal -->
      <div id="checkout-modal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>Finalizar Compra</h2>
            <button class="modal-close" onclick="closeCheckoutStepper()">✕</button>
          </div>

          <div class="checkout-stepper">
            <div class="stepper-header">
              <div class="step-item active" id="step-dot-1">1</div>
              <div class="step-item" id="step-dot-2">2</div>
            </div>

            <!-- Step 1: Info -->
            <div class="checkout-step active" id="checkout-step-1">
              <h3 style="margin-bottom: 15px;">Verifica tus datos</h3>
              <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" id="chk-name" value="${App.getCurrentUser()?.name || ''}" placeholder="Tu nombre">
              </div>
              <div class="form-group">
                <label>Teléfono (WhatsApp)</label>
                <input type="tel" id="chk-phone" value="${App.getCurrentUser()?.phone || ''}" placeholder="+1 8xx-xxx-xxxx">
              </div>
              <div class="form-group">
                <label>Provincia / Ciudad</label>
                <input type="text" id="chk-province" value="${App.getCurrentUser()?.province || ''}" placeholder="Ej: Santo Domingo">
              </div>
              <button class="btn btn-primary btn-block" onclick="nextCheckoutStep()">Siguiente ➔</button>
            </div>

            <!-- Step 2: Shipping -->
            <div class="checkout-step" id="checkout-step-2">
              <h3 style="margin-bottom: 15px;">Selecciona método de envío</h3>

              <div class="shipping-card ${shippingType === 'santo-domingo' ? 'selected' : ''}" onclick="setCheckoutShipping('santo-domingo')">
                <div class="shipping-icon">🛵</div>
                <div class="shipping-info">
                  <strong>Santo Domingo</strong>
                  <span>Entrega rápida el mismo día</span>
                </div>
                <div style="font-weight: 700;">${App.formatPrice(App.SHIPPING.SANTO_DOMINGO)}</div>
              </div>

              <div class="shipping-card ${shippingType === 'exterior' ? 'selected' : ''}" onclick="setCheckoutShipping('exterior')">
                <div class="shipping-icon">🚚</div>
                <div class="shipping-info">
                  <strong>Exterior / Provincias</strong>
                  <span>Envío seguro vía transporte</span>
                </div>
                <div style="font-weight: 700;">${App.formatPrice(App.SHIPPING.EXTERIOR)}</div>
              </div>

              <div class="cart-summary-row total" style="margin: 20px 0; border-top: 1px solid var(--borde); padding-top: 15px;">
                <span>Total Final</span>
                <span id="chk-total-display">${App.formatPrice(total)}</span>
              </div>

              <div class="d-flex gap-1">
                <button class="btn btn-secondary" onclick="prevCheckoutStep()" style="flex: 1;">Atrás</button>
                <button class="btn btn-whatsapp" onclick="finalizarPedido()" style="flex: 2;">
                  Completar por WhatsApp 📱
                </button>
              </div>
            </div>
          </div>
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

  window.openCheckoutStepper = function() {
    document.getElementById('checkout-modal').classList.add('active');
  };

  window.closeCheckoutStepper = function() {
    document.getElementById('checkout-modal').classList.remove('active');
  };

  window.nextCheckoutStep = function() {
    const name = document.getElementById('chk-name').value;
    const phone = document.getElementById('chk-phone').value;
    if (!name || !phone) return App.showToast('Por favor completa tus datos', 'error');

    document.getElementById('checkout-step-1').classList.remove('active');
    document.getElementById('checkout-step-2').classList.add('active');
    document.getElementById('step-dot-2').classList.add('active');
  };

  window.prevCheckoutStep = function() {
    document.getElementById('checkout-step-2').classList.remove('active');
    document.getElementById('checkout-step-1').classList.add('active');
    document.getElementById('step-dot-2').classList.remove('active');
  };

  window.setCheckoutShipping = function(type) {
    shippingType = type;
    const cards = document.querySelectorAll('.shipping-card');
    cards[0].classList.toggle('selected', type === 'santo-domingo');
    cards[1].classList.toggle('selected', type === 'exterior');

    // Update total
    const subtotal = App.getCartTotal();
    const shipping = type === 'santo-domingo' ? App.SHIPPING.SANTO_DOMINGO : App.SHIPPING.EXTERIOR;
    document.getElementById('chk-total-display').textContent = App.formatPrice(subtotal + shipping);
  };

  window.finalizarPedido = function () {
    const cart = App.getCart();
    if (cart.length === 0) {
      App.showToast('Tu carrito está vacío', 'error');
      return;
    }

    // Final security check: Ensure all items that need sizes have them
    const products = App.getProducts();
    const missingSize = cart.find(item => {
      const p = products.find(prod => prod.id === item.productId);
      return p && p.sizes && p.sizes.length > 0 && !item.size;
    });

    if (missingSize) {
      const p = products.find(prod => prod.id === missingSize.productId);
      App.showToast(`Por favor selecciona la talla para: ${p.name}`, 'error');
      setTimeout(() => {
        window.location.href = `product.html?id=${p.id}`;
      }, 1500);
      return;
    }

    // Build order data for admin panel record
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

    const shipping = shippingType === 'santo-domingo' ? App.SHIPPING.SANTO_DOMINGO : App.SHIPPING.EXTERIOR;
    const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0);
    const total = subtotal + shipping;
    const user = App.getCurrentUser();

    // Update logistics data if changed in stepper
    const chkName = document.getElementById('chk-name').value;
    const chkPhone = document.getElementById('chk-phone').value;
    const chkProvince = document.getElementById('chk-province').value;

    // Save order to localStorage
    App.saveOrder({
      items: orderItems,
      subtotal,
      shipping,
      shippingType,
      total,
      customer: {
        name: chkName || user?.name || 'Cliente',
        email: user?.email || '',
        phone: chkPhone || user?.phone || '',
        province: chkProvince
      }
    });

    // Track checkout
    const cartItems = orderItems.map(i => ({ name: i.name, qty: i.qty, price: i.price, size: i.size }));
    Analytics.trackCheckout(cartItems, total, shippingType);
    App.sendToWhatsApp(shippingType);
  };

  renderCart();
}

if (App.isReady) {
  initCart();
} else {
  window.addEventListener('app-ready', initCart);
}
