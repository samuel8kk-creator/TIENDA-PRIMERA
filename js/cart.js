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

    // Save order to localStorage
    App.saveOrder({
      items: orderItems,
      subtotal,
      shipping,
      shippingType,
      total,
      customer: user ? { name: user.name, email: user.email, phone: user.phone || null } : null
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
