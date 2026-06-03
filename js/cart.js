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

          <div class="shipping-selector">
            <label style="font-size: 0.88rem; font-weight: 500; margin-bottom: 8px; display: block;">📦 Zona de Envío</label>
            <div class="shipping-option ${shippingType === 'santo-domingo' ? 'selected' : ''}" onclick="setShipping('santo-domingo')">
              <input type="radio" name="shipping" value="santo-domingo" ${shippingType === 'santo-domingo' ? 'checked' : ''}>
              <div>
                <strong>Santo Domingo</strong>
                <div style="font-size: 0.85rem; color: var(--texto-light);">${App.formatPrice(App.SHIPPING.SANTO_DOMINGO)}</div>
              </div>
            </div>
            <div class="shipping-option ${shippingType === 'exterior' ? 'selected' : ''}" onclick="setShipping('exterior')">
              <input type="radio" name="shipping" value="exterior" ${shippingType === 'exterior' ? 'checked' : ''}>
              <div>
                <strong>Exterior / Provincias</strong>
                <div style="font-size: 0.85rem; color: var(--texto-light);">${App.formatPrice(App.SHIPPING.EXTERIOR)}</div>
              </div>
            </div>
          </div>

          <div class="cart-summary-row">
            <span>Envío</span>
            <span>${App.formatPrice(shipping)}</span>
          </div>

          <div class="cart-summary-row total">
            <span>Total</span>
            <span>${App.formatPrice(total)}</span>
          </div>

          <button class="btn btn-whatsapp btn-block mt-2" onclick="finalizarPedido()">
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

  // ── Checkout Stepper Logic ──
  window.finalizarPedido = function () {
    const cart = App.getCart();
    if (cart.length === 0) return App.showToast('Tu carrito está vacío', 'error');

    // Validate sizes
    const products = App.getProducts();
    const missingSize = cart.find(item => {
      const p = products.find(prod => prod.id === item.productId);
      return p && p.sizes && p.sizes.length > 0 && !item.size;
    });
    if (missingSize) {
      App.showToast('Selecciona la talla antes de continuar', 'error');
      return;
    }

    showStepper();
  };

  function showStepper() {
    const user = App.getCurrentUser() || {};
    const subtotal = App.getCartTotal();

    const modal = document.createElement('div');
    modal.className = 'stepper-modal active';
    modal.id = 'checkout-stepper';
    modal.innerHTML = `
      <div class="stepper-content">
        <div class="stepper-header">
          <h3>Confirmar Pedido</h3>
          <div class="stepper-progress">
            <div class="step-dot active" id="dot-1"></div>
            <div class="step-dot" id="dot-2"></div>
          </div>
        </div>
        <div class="stepper-body">
          <!-- Step 1: Info -->
          <div class="step-pane active" id="pane-1">
            <p style="font-size:0.85rem; color:var(--texto-muted); margin-bottom:15px;">Verifica tus datos de contacto para la entrega.</p>
            <div class="form-group">
              <label>Nombre Completo</label>
              <input type="text" id="st-name" value="${App.esc(user.name || '')}" placeholder="Tu nombre...">
            </div>
            <div class="form-group">
              <label>WhatsApp / Teléfono</label>
              <input type="tel" id="st-phone" value="${App.esc(user.phone || '')}" placeholder="8x9-xxx-xxxx">
            </div>
            <div class="form-group">
              <label>Provincia / Sector</label>
              <input type="text" id="st-address" value="${App.esc(user.address || '')}" placeholder="Ej: Santo Domingo, Piantini...">
            </div>
            <button class="btn btn-primary btn-block mt-2" onclick="nextStep()">Siguiente: Envío →</button>
          </div>

          <!-- Step 2: Shipping -->
          <div class="step-pane" id="pane-2">
            <p style="font-size:0.85rem; color:var(--texto-muted); margin-bottom:15px;">¿Dónde entregamos tu pedido?</p>
            <div class="shipping-visual-grid">
              <div class="shipping-card ${shippingType==='santo-domingo'?'selected':''}" id="sc-sd" onclick="selectStShipping('santo-domingo')">
                <span class="icon moto-anim">🛵</span>
                <strong>Santo Domingo</strong>
                <div style="font-size:0.8rem; color:var(--primary); font-weight:700;">${App.formatPrice(App.SHIPPING.SANTO_DOMINGO)}</div>
              </div>
              <div class="shipping-card ${shippingType==='exterior'?'selected':''}" id="sc-ex" onclick="selectStShipping('exterior')">
                <span class="icon truck-anim">🚚</span>
                <strong>Exterior / Prov.</strong>
                <div style="font-size:0.8rem; color:var(--primary); font-weight:700;">${App.formatPrice(App.SHIPPING.EXTERIOR)}</div>
              </div>
            </div>

            <div style="margin-top:20px; padding:15px; background:var(--fondo-soft); border-radius:10px;">
              <div class="d-flex justify-between" style="font-size:0.9rem;"><span>Subtotal:</span> <span>${App.formatPrice(subtotal)}</span></div>
              <div class="d-flex justify-between" style="font-size:0.9rem;"><span>Envío:</span> <span id="st-ship-cost">${App.formatPrice(App.SHIPPING.SANTO_DOMINGO)}</span></div>
              <div class="d-flex justify-between" style="font-weight:800; font-size:1.1rem; margin-top:5px; border-top:1px dashed var(--borde); padding-top:5px;">
                <span>Total:</span> <span id="st-total-cost">${App.formatPrice(subtotal + App.SHIPPING.SANTO_DOMINGO)}</span>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:10px; margin-top:15px;">
              <button class="btn btn-secondary" onclick="prevStep()">← Atrás</button>
              <button class="btn btn-whatsapp" onclick="confirmFinalOrder()">Finalizar por WhatsApp 📱</button>
            </div>
          </div>
        </div>
        <button style="position:absolute; top:15px; right:15px; background:none; border:none; font-size:1.2rem; cursor:pointer; color:var(--texto-muted);" onclick="closeStepper()">✕</button>
      </div>
    `;
    document.body.appendChild(modal);
    window._stShipping = shippingType;
  }

  window.nextStep = function() {
    const name = document.getElementById('st-name').value.trim();
    const phone = document.getElementById('st-phone').value.trim();
    if (!name || !phone) return App.showToast('Nombre y teléfono son obligatorios', 'error');

    document.getElementById('pane-1').classList.remove('active');
    document.getElementById('pane-2').classList.add('active');
    document.getElementById('dot-2').classList.add('active');
  };

  window.prevStep = function() {
    document.getElementById('pane-2').classList.remove('active');
    document.getElementById('pane-1').classList.add('active');
    document.getElementById('dot-2').classList.remove('active');
  };

  window.selectStShipping = function(type) {
    window._stShipping = type;
    document.getElementById('sc-sd').classList.toggle('selected', type === 'santo-domingo');
    document.getElementById('sc-ex').classList.toggle('selected', type === 'exterior');

    const subtotal = App.getCartTotal();
    const ship = type === 'santo-domingo' ? App.SHIPPING.SANTO_DOMINGO : App.SHIPPING.EXTERIOR;
    document.getElementById('st-ship-cost').textContent = App.formatPrice(ship);
    document.getElementById('st-total-cost').textContent = App.formatPrice(subtotal + ship);
  };

  window.confirmFinalOrder = function() {
    const name = document.getElementById('st-name').value.trim();
    const phone = document.getElementById('st-phone').value.trim();
    const address = document.getElementById('st-address').value.trim();
    const type = window._stShipping;

    // Build message with info
    const cart = App.getCart();
    const products = App.getProducts();
    const shipCost = type === 'santo-domingo' ? App.SHIPPING.SANTO_DOMINGO : App.SHIPPING.EXTERIOR;
    const subtotal = App.getCartTotal();

    let message = '🛍️ *NUEVO PEDIDO - D&E Shop*\n\n';
    message += `👤 *Cliente:* ${name}\n`;
    message += `📱 *Teléfono:* ${phone}\n`;
    message += `📍 *Ubicación:* ${address || 'No especificada'}\n\n`;
    message += `📦 *Detalle del Carrito:*\n`;

    cart.forEach((item, i) => {
      const p = products.find(prod => prod.id === item.productId);
      if(p) {
        message += `${i+1}. ${p.name} (x${item.qty}) ${item.size?'Talla:'+item.size:''} ${item.color?'Col:'+item.color:''}\n`;
      }
    });

    message += `\n🚚 *Envío:* ${type === 'santo-domingo' ? 'Santo Domingo' : 'Exterior'} (${App.formatPrice(shipCost)})\n`;
    message += `💰 *TOTAL:* ${App.formatPrice(subtotal + shipCost)}`;

    // Track
    Analytics.trackCheckout(cart.map(i => ({name:i.productId, qty:i.qty})), subtotal+shipCost, type);

    // Save local record
    App.saveOrder({
      items: cart, subtotal, shipping: shipCost, shippingType: type, total: subtotal+shipCost,
      customer: { name, phone, address }
    });

    const url = `https://wa.me/${App.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    closeStepper();
  };

  window.closeStepper = function() {
    const modal = document.getElementById('checkout-stepper');
    if(modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  };
  renderCart();
}

if (App.isReady) {
  initCart();
} else {
  window.addEventListener('app-ready', initCart);
}
