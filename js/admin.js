/* ================================================
   D&E Shop — Admin Panel Logic
   Login, Product CRUD, Category Toggles, Clients
   ================================================ */

async function initAdmin() {
  if (window._adminInited) return;
  window._adminInited = true;
  const root = document.getElementById('admin-root');
  const logoutBtn = document.getElementById('btn-admin-logout');

  // Check if admin is logged in
  const isLogged = await App.isAdminLogged();
  if (!isLogged) {
    renderLoginScreen();
    return;
  }

  logoutBtn.style.display = 'flex';
  logoutBtn.addEventListener('click', () => {
    App.adminLogout();
    location.reload();
  });

  let activeSection = 'products';
  renderAdmin();

  // ── GLOBAL EVENT DELEGATION ──
  // Listeners moved here to work regardless of login state
  
  // 1. Sidebar / Section Navigation
  document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.admin-nav-item');
    if (navItem) {
      e.preventDefault();
      const section = navItem.dataset.section;
      if (section) setSection(section);
    }
  });

  // 2. Global Search
  document.addEventListener('input', (e) => {
    if (e.target.id === 'admin-product-search') {
      window._adminProductSearch = e.target.value;
      const container = document.getElementById('admin-content');
      if (container) renderProductsSection(container);
    }
  });

  // 3. Action Delegation (Edit, Delete, Toggle)
  document.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.closest('[data-id]')?.dataset.id;

    // Order Filter (Doesn't need ID)
    if (target.closest('.btn-order-filter')) {
      filterOrders(target.dataset.status);
      return;
    }

    if (!id) return;

    // Product Actions
    if (target.closest('.btn-product-edit')) editProduct(id);
    if (target.closest('.btn-product-delete')) deleteProduct(id);

    // Category Actions
    if (target.closest('.btn-category-edit')) editCategory(id);
    if (target.closest('.btn-category-delete')) deleteCategory(id);
    
    // Order Actions
    if (target.closest('.btn-order-status')) {
        const status = target.dataset.status;
        App.updateOrderStatus(id, status);
        App.showToast(`Estado de pedido actualizado a ${status}`, 'success');
        renderSection();
    }
    if (target.closest('.btn-order-delete')) deleteOrder(id);

    // Supplier Actions
    if (target.closest('.btn-supplier-toggle-row')) toggleSupplierRow(id);
    if (target.closest('.btn-supplier-delete')) deleteSupplierConfirm(id);
    if (target.closest('.btn-supplier-edit')) openSupplierModal(id);
    if (target.closest('.btn-supplier-link-prod')) openLinkProductModal(id);
    if (target.closest('.btn-supplier-unlink')) {
        const productId = target.dataset.productId;
        if (confirm('¿Desvincular este producto del proveedor?')) {
            App.unlinkProductFromSupplier(productId);
            renderSection();
        }
    }
  });

  // 4. Global Change Delegation (Switches, Selects)
  document.addEventListener('change', (e) => {
    const target = e.target;
    const id = target.closest('[data-id]')?.dataset.id;
    if (!id) return;

    if (target.closest('.select-order-status')) {
      updateOrderStatus(id, target.value);
    }
    
    if (target.closest('.btn-category-toggle')) {
      const isActive = target.checked;
      App.toggleCategory(id, isActive);
      App.showToast(`Categoría ${isActive ? 'activada' : 'desactivada'}`, 'success');
      renderSection(); // Refresh to update labels if needed
    }
  });

  // ── Login Screen ──
  function renderLoginScreen() {
    root.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div style="text-align: center; margin-bottom: 8px; font-size: 2.5rem;">⚙️</div>
          <h1>Panel de Admin</h1>
          <p class="subtitle">Acceso exclusivo para administradores</p>
          <form id="admin-login-form">
            <div class="form-group">
              <label>📧 Correo electrónico</label>
              <input type="email" id="admin-email" placeholder="admin@correo.com" required>
            </div>
            <div class="form-group">
              <label>🔒 Contraseña</label>
              <input type="password" id="admin-password" placeholder="Contraseña" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Ingresar</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value;

      // Local Debug Bypass
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
      if (isLocal && email === 'admin@local' && password === 'debug') {
          localStorage.setItem('ld_admin_debug', 'true');
          App.showToast('Modo Debug Local Activado 🛠️', 'success');
          setTimeout(() => location.reload(), 500);
          return;
      }

      if (await App.adminLogin(email, password)) {
          localStorage.removeItem('ld_admin_debug'); // Clear debug if real login works
        App.showToast('¡Bienvenido, Admin! 🎉', 'success');
        setTimeout(() => location.reload(), 500);
      } else {
        App.showToast('Credenciales incorrectas', 'error');
      }
    });
  }

  // ── Main Admin Layout ──
  function renderAdmin() {
    root.innerHTML = `
      <div class="admin-layout">
        <aside class="admin-sidebar">
          <div class="admin-sidebar-title">Menú</div>
          <button class="admin-nav-item ${activeSection === 'products' ? 'active' : ''}" data-section="products">📦 Productos</button>
          <button class="admin-nav-item ${activeSection === 'categories' ? 'active' : ''}" data-section="categories">📂 Categorías</button>
          <button class="admin-nav-item ${activeSection === 'banners' ? 'active' : ''}" data-section="banners">🖼️ Banners</button>
          <button class="admin-nav-item ${activeSection === 'clients' ? 'active' : ''}" data-section="clients">👥 Clientes</button>
          <button class="admin-nav-item ${activeSection === 'orders' ? 'active' : ''}" data-section="orders">🛍️ Pedidos</button>
          <button class="admin-nav-item ${activeSection === 'analytics' ? 'active' : ''}" data-section="analytics">📊 Analíticas</button>
          <button class="admin-nav-item ${activeSection === 'suppliers' ? 'active' : ''}" data-section="suppliers" style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 14px;">🏭 Proveedores</button>
        </aside>
        <div class="admin-content" id="admin-content"></div>
      </div>
    `;

    renderSection();
  }

  function renderSection() {
    const content = document.getElementById('admin-content');
    switch (activeSection) {
      case 'products': renderProductsSection(content); break;
      case 'categories': renderCategoriesSection(content); break;
      case 'banners': renderBannersSection(content); break;
      case 'clients': renderClientsSection(content); break;
      case 'orders': renderOrdersSection(content); break;
      case 'analytics': renderAnalyticsSection(content); break;
      case 'suppliers': renderSuppliersSection(content); break;
    }
  }

  window.setSection = function (section) {
    activeSection = section;
    renderAdmin();
  };

  // ══════════════════════════════════════
  //  PRODUCTS SECTION
  // ══════════════════════════════════════
  function renderProductsSection(container) {
    const products = App.getProducts();
    const categories = App.getCategories();

    container.innerHTML = `
      <div class="admin-header">
        <h1>📦 Productos (${products.length})</h1>
        <div style="display:flex; gap:10px; flex:1; max-width:400px; margin:0 20px;">
          <input type="text" id="admin-product-search" placeholder="🔍 Buscar por nombre o ID..." 
                 value="${window._adminProductSearch || ''}"
                 style="padding:8px 15px; border-radius:var(--radius-md); border:1.5px solid var(--borde); font-size:0.9rem; width:100%;">
        </div>
        <button class="btn btn-primary" onclick="openProductModal()">+ Nuevo Producto</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Reseñas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            const term = (window._adminProductSearch || '').toLowerCase();
            const filtered = products.filter(p => 
              p.name.toLowerCase().includes(term) || 
              p.id.toLowerCase().includes(term) ||
              (p.category && p.category.toLowerCase().includes(term))
            );
            
            if (filtered.length === 0) {
              return `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--texto-muted);">No se encontraron productos para "${App.esc(term)}"</td></tr>`;
            }

            return filtered.map(product => {
              const cat = categories.find(c => c.id === product.category);
              return `
                <tr>
                  <td><img src="${encodeURI(product.image)}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"
                           onerror="this.src='https://via.placeholder.com/50x50/f8f9fa/333333?text=D%26E+Shop'"></td>
                  <td><strong>${App.esc(product.name)}</strong></td>
                  <td>${cat ? App.esc(cat.emoji) + ' ' + App.esc(cat.name) : App.esc(product.category)}</td>
                  <td>${App.formatPrice(product.price)}${product.oldPrice ? `<br><small style="text-decoration: line-through; color: var(--texto-muted);">${App.formatPrice(product.oldPrice)}</small>` : ''}</td>
                  <td>${product.reviews ? product.reviews.length : 0} ⭐</td>
                  <td>
                    <div class="d-flex gap-1">
                      <button class="btn btn-sm btn-secondary btn-product-edit" data-id="${product.id}">✏️</button>
                      <button class="btn btn-sm btn-danger btn-product-delete" data-id="${product.id}">🗑️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('');
          })()}
        </tbody>
      </table>
    `;
  }

  // ══════════════════════════════════════
  //  CATEGORIES SECTION
  // ══════════════════════════════════════
  function renderCategoriesSection(container) {
    const categories = App.getCategories();

    container.innerHTML = `
      <div class="admin-header">
        <h1>📂 Categorías</h1>
        <button class="btn btn-primary" onclick="openCategoryModal()">+ Nueva Categoría</button>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 12px; font-size: 1rem; color: var(--texto-light);">🔒 Permanentes</h3>
        ${categories.filter(c => c.isPermanent).map(cat => `
          <div class="category-toggle-row admin-card" style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="cat-name" style="font-weight: 700; font-size: 1.1rem;">${App.esc(cat.emoji)} ${App.esc(cat.name)}</span>
                <span class="cat-type" style="margin-left: 8px; font-size: 0.8rem; opacity: 0.7;">Permanente</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <label class="switch">
                  <input type="checkbox" class="btn-category-toggle" data-id="${cat.id}" ${cat.isActive ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
                <button class="btn btn-sm btn-secondary btn-category-edit" data-id="${cat.id}">✏️</button>
              </div>
            </div>
            
            <div style="display: flex; gap: 20px; align-items: flex-end;">
              <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 2px solid var(--borde); flex-shrink: 0;">
                <img src="${cat.image || ''}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=App.PLACEHOLDER">
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.8rem; margin-bottom: 5px; color: var(--texto-light);">URL de la Imagen (Mujer, Hombre, Niños, etc.)</label>
                <div style="display: flex; gap: 10px;">
                  <input type="url" id="cat-img-${cat.id}" value="${cat.image || ''}" placeholder="https://..." style="flex: 1; padding: 8px;">
                  <button class="btn btn-sm btn-primary" onclick="saveCatImg('${cat.id}')">Guardar Foto</button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div>
        <h3 style="margin-bottom: 12px; font-size: 1rem; color: var(--texto-light);">🎉 Estacionales / Temporales</h3>
        ${categories.filter(c => !c.isPermanent).map(cat => `
          <div class="category-toggle-row admin-card" style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="cat-name" style="font-weight: 700; font-size: 1.1rem;">${App.esc(cat.emoji)} ${App.esc(cat.name)}</span>
                <span class="cat-type" style="margin-left: 8px; font-size: 0.8rem; opacity: 0.7;">Estacional</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <label class="switch">
                  <input type="checkbox" class="btn-category-toggle" data-id="${cat.id}" ${cat.isActive ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
                <div style="display: flex; gap: 5px;">
                  <button class="btn btn-sm btn-secondary btn-category-edit" data-id="${cat.id}">✏️</button>
                  <button class="btn btn-sm btn-danger btn-category-delete" data-id="${cat.id}">🗑️</button>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 10px; align-items: flex-end;">
              <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 2px solid var(--borde); flex-shrink: 0;">
                <img src="${cat.image || ''}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=App.PLACEHOLDER">
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.8rem; margin-bottom: 5px; color: var(--texto-light);">URL de la Imagen</label>
                <div style="display: flex; gap: 10px;">
                  <input type="url" id="cat-img-${cat.id}" value="${cat.image || ''}" placeholder="https://..." style="flex: 1; padding: 8px;">
                  <button class="btn btn-sm btn-primary" onclick="saveCatImg('${cat.id}')">Guardar Foto</button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="mt-3" style="padding: 16px; background: var(--menta-light); border-radius: var(--radius-md); font-size: 0.88rem; color: var(--menta-dark);">
        💡 Las categorías activadas aparecerán en la barra de navegación de la tienda. Las estacionales se muestran con borde punteado.
      </div>
    `;
  }

  window.toggleCat = function (catId, isActive) {
    App.toggleCategory(catId, isActive);
    App.showToast(`Categoría ${isActive ? 'activada' : 'desactivada'}`, 'success');
    renderSection();
  };

  window.saveCatImg = function (catId) {
    const url = document.getElementById(`cat-img-${catId}`).value.trim();
    if (!url) {
      App.showToast('Por favor ingresa una URL válida', 'error');
      return;
    }
    App.updateCategory(catId, { image: url });
    App.showToast('Foto de categoría actualizada ✨', 'success');
    renderSection();
  };

  window.openCategoryModal = function () {
    document.getElementById('category-modal').classList.add('active');
  };

  window.closeCategoryModal = function () {
    document.getElementById('category-modal').classList.remove('active');
  };

  window.handleCategorySubmit = function (e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('cf-name').value.trim(),
      emoji: document.getElementById('cf-emoji').value.trim(),
      image: document.getElementById('cf-image').value.trim()
    };

    App.addCategory(data);
    App.showToast('Categoría creada exitosamente 🎉', 'success');
    closeCategoryModal();
    document.getElementById('category-form').reset();
    renderSection();
  };

  window.deleteCategory = function (id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      if (App.deleteCategory(id)) {
        App.showToast('Categoría eliminada', 'info');
        renderSection();
      } else {
        App.showToast('No se puede eliminar una categoría permanente', 'error');
      }
    }
  };

  // ══════════════════════════════════════
  //  ORDERS SECTION
  // ══════════════════════════════════════
  function renderOrdersSection(container) {
    const allOrders = App.getOrders();
    // Sort by date descending (newest first)
    allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

    const filterStatus = window._ordersFilter || 'all';
    const orders = filterStatus === 'all' ? allOrders : allOrders.filter(o => o.status === filterStatus);

    const statusColors = {
      pendiente:  { bg: '#fff8e1', border: '#f59e0b', text: '#92400e', label: '⏳ Pendiente' },
      confirmado: { bg: '#e8f5e9', border: '#22c55e', text: '#166534', label: '✅ Confirmado' },
      enviado:    { bg: '#e0f2fe', border: '#0ea5e9', text: '#0c4a6e', label: '🚚 Enviado' },
      entregado:  { bg: '#f0fdf4', border: '#16a34a', text: '#14532d', label: '🎉 Entregado' },
      cancelado:  { bg: '#fef2f2', border: '#ef4444', text: '#7f1d1d', label: '❌ Cancelado' }
    };

    const totalIngresos = allOrders
      .filter(o => o.status !== 'cancelado')
      .reduce((s, o) => s + (o.total || 0), 0);

    const countByStatus = (s) => allOrders.filter(o => o.status === s).length;

    container.innerHTML = `
      <div class="admin-header">
        <h1>🛍️ Pedidos WhatsApp (${allOrders.length})</h1>
        <div class="d-flex gap-1">
          <button class="btn btn-secondary btn-sm" onclick="exportOrders()">📥 Exportar</button>
          <button class="btn btn-danger btn-sm" onclick="clearAllOrders()">🗑️ Limpiar Todo</button>
        </div>
      </div>

      <!-- KPI Strip -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-bottom: 24px;">
        <div class="analytics-kpi-card" style="padding: 14px 12px;">
          <div class="kpi-icon">🛍️</div>
          <div class="kpi-value">${allOrders.length}</div>
          <div class="kpi-label">Total Pedidos</div>
        </div>
        <div class="analytics-kpi-card" style="padding: 14px 12px;">
          <div class="kpi-icon">💰</div>
          <div class="kpi-value" style="font-size:1.1rem;">${App.formatPrice(totalIngresos)}</div>
          <div class="kpi-label">Ingresos Totales</div>
        </div>
        <div class="analytics-kpi-card" style="padding: 14px 12px;">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-value">${countByStatus('pendiente')}</div>
          <div class="kpi-label">Pendientes</div>
        </div>
        <div class="analytics-kpi-card" style="padding: 14px 12px;">
          <div class="kpi-icon">🚚</div>
          <div class="kpi-value">${countByStatus('enviado')}</div>
          <div class="kpi-label">En Camino</div>
        </div>
        <div class="analytics-kpi-card" style="padding: 14px 12px;">
          <div class="kpi-icon">🎉</div>
          <div class="kpi-value">${countByStatus('entregado')}</div>
          <div class="kpi-label">Entregados</div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
        ${['all','pendiente','confirmado','enviado','entregado','cancelado'].map(s => {
          const labels = { all: '🔹 Todos', pendiente: '⏳ Pendiente', confirmado: '✅ Confirmado', enviado: '🚚 Enviado', entregado: '🎉 Entregado', cancelado: '❌ Cancelado' };
          const isActive = filterStatus === s;
          return `<button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'} btn-order-filter" data-status="${s}">${labels[s]}</button>`;
        }).join('')}
      </div>

      ${orders.length === 0 ? `
        <div class="empty-state">
          <div class="emoji">📭</div>
          <h2>${allOrders.length === 0 ? 'Aún no hay pedidos' : 'Sin pedidos con ese estado'}</h2>
          <p>${allOrders.length === 0 ? 'Cuando un cliente finalice su compra por WhatsApp, aparecerá aquí automáticamente.' : 'Prueba seleccionando otro filtro.'}</p>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${orders.map((order, idx) => {
            const sc = statusColors[order.status] || statusColors.pendiente;
            const fecha = new Date(order.date);
            const fechaLabel = fecha.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
            const horaLabel = fecha.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
            const envioLabel = order.shippingType === 'santo-domingo' ? '🏙️ Santo Domingo' : '🌎 Exterior/Provincias';
            const itemsHTML = (order.items || []).map(item => `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
                ${item.image ? `<img src="${item.image}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid rgba(0,0,0,0.1);flex-shrink:0;" onerror="this.style.display='none'">` : `<div style="width:44px;height:44px;border-radius:6px;background:#f3f4f6;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.3rem;">📦</div>`}
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${App.esc(item.name)}</div>
                  <div style="font-size:0.78rem;color:var(--texto-muted);margin-top:2px;">
                    ${item.size ? `Talla: <strong>${App.esc(item.size)}</strong>` : ''}
                    ${item.color ? ` · Color: <strong>${App.esc(item.color)}</strong>` : ''}
                  </div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                  <div style="font-size:0.85rem;color:var(--texto-muted);">× ${item.qty}</div>
                  <div style="font-weight:700;font-size:0.9rem;">${App.formatPrice(item.subtotal)}</div>
                </div>
              </div>
            `).join('');

            return `
            <div class="admin-card" style="border-left: 4px solid ${sc.border}; padding: 0; overflow:hidden;">
              <!-- Order Header -->
              <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:${sc.bg};flex-wrap:wrap;gap:10px;">
                <div>
                  <span style="font-size:0.75rem;color:var(--texto-muted);display:block;">#${order.id}</span>
                  <span style="font-weight:700;font-size:1rem;">📅 ${fechaLabel} <span style="opacity:0.7;font-size:0.85rem;">${horaLabel}</span></span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                  <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;background:white;border:1.5px solid ${sc.border};color:${sc.text};">${sc.label}</span>
                  <select class="order-status-select select-order-status" data-id="${order.id}" style="padding:5px 10px;border:1.5px solid ${sc.border};border-radius:8px;font-size:0.82rem;background:white;cursor:pointer;">
                    <option value="pendiente"  ${order.status==='pendiente'  ?'selected':''}>⏳ Pendiente</option>
                    <option value="confirmado" ${order.status==='confirmado' ?'selected':''}>✅ Confirmado</option>
                    <option value="enviado"    ${order.status==='enviado'    ?'selected':''}>🚚 Enviado</option>
                    <option value="entregado"  ${order.status==='entregado'  ?'selected':''}>🎉 Entregado</option>
                    <option value="cancelado"  ${order.status==='cancelado'  ?'selected':''}>❌ Cancelado</option>
                  </select>
                  <button class="btn btn-sm btn-danger btn-order-delete" data-id="${order.id}" title="Eliminar pedido">🗑️</button>
                </div>
              </div>

              <!-- Order Body -->
              <div style="display:grid;grid-template-columns:1fr auto;gap:0;">
                <!-- Items List -->
                <div style="padding:14px 18px;border-right:1px solid var(--borde);">
                  <p style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--texto-muted);margin-bottom:8px;">Productos (${(order.items||[]).length})</p>
                  ${itemsHTML}
                </div>

                <!-- Summary -->
                <div style="padding:14px 18px;min-width:200px;display:flex;flex-direction:column;gap:8px;">
                  <p style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--texto-muted);margin-bottom:2px;">Resumen</p>
                  ${order.customer ? `
                    <div style="font-size:0.84rem;padding:8px;background:var(--fondo-alt);border-radius:6px;margin-bottom:4px;">
                      <div>👤 <strong>${App.esc(order.customer.name || '—')}</strong></div>
                      ${order.customer.email ? `<div style="font-size:0.78rem;color:var(--texto-muted);">${App.esc(order.customer.email)}</div>` : ''}
                      ${order.customer.phone ? `<div style="font-size:0.78rem;color:var(--texto-muted);">📱 ${App.esc(order.customer.phone)}</div>` : ''}
                    </div>
                  ` : `<div style="font-size:0.82rem;color:var(--texto-muted);margin-bottom:4px;">👤 Cliente anónimo</div>`}
                  <div style="display:flex;justify-content:space-between;font-size:0.84rem;">
                    <span>Subtotal</span><span>${App.formatPrice(order.subtotal || 0)}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.84rem;">
                    <span>${envioLabel}</span><span>${App.formatPrice(order.shipping || 0)}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:800;padding-top:6px;border-top:2px solid var(--borde);margin-top:4px;">
                    <span>TOTAL</span><span style="color:var(--rosa-dark);">${App.formatPrice(order.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      `}
    `;
  }

  window.filterOrders = function (status) {
    window._ordersFilter = status;
    renderSection();
  };

  window.updateOrderStatus = function (orderId, status) {
    App.updateOrderStatus(orderId, status);
    App.showToast('Estado del pedido actualizado ✅', 'success');
    renderSection();
  };

  window.deleteOrder = function (orderId) {
    if (confirm('¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.')) {
      App.deleteOrder(orderId);
      App.showToast('Pedido eliminado', 'info');
      renderSection();
    }
  };

  window.clearAllOrders = function () {
    if (confirm('¿Estás seguro de que quieres BORRAR TODOS los pedidos? Esta acción no se puede deshacer.')) {
      localStorage.removeItem(App.KEYS.ORDERS);
      App.showToast('Todos los pedidos fueron eliminados', 'info');
      renderSection();
    }
  };

  window.exportOrders = function () {
    const orders = App.getOrders();
    const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deshop-pedidos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.showToast('Pedidos exportados exitosamente 📥', 'success');
  };

  // ══════════════════════════════════════
  //  CLIENTS SECTION
  // ══════════════════════════════════════
  function renderClientsSection(container) {
    const customers = App.getCustomers();

    container.innerHTML = `
      <div class="admin-header">
        <h1>👥 Clientes Registrados (${customers.length})</h1>
      </div>

      ${customers.length === 0 ? `
        <div class="empty-state">
          <div class="emoji">👥</div>
          <h2>Sin clientes registrados</h2>
          <p>Los clientes aparecerán aquí cuando se registren en la tienda.</p>
        </div>
      ` : `
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Registrado</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(c => `
              <tr>
                <td><strong>${App.esc(c.name)}</strong></td>
                <td>${App.esc(c.email)}</td>
                <td>${App.esc(c.phone || '—')}</td>
                <td>${App.esc(c.address || '—')}</td>
                <td>${c.registered ? new Date(c.registered).toLocaleDateString('es-DO') : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    `;
  }

  // ══════════════════════════════════════
  //  ANALYTICS SECTION
  // ══════════════════════════════════════
  function renderAnalyticsSection(container) {
    const stats = Analytics.getStats();

    // Generate Simple SVG Chart for Page Views (last 7 days)
    const chartWidth = 600;
    const chartHeight = 150;
    const padding = 20;
    const points = [12, 45, 67, 32, 89, 110, stats.today.pageViews].slice(-7);
    const maxVal = Math.max(...points, 100);
    const stepX = (chartWidth - padding * 2) / (points.length - 1);

    let polylinePoints = "";
    points.forEach((p, i) => {
        const x = padding + i * stepX;
        const y = chartHeight - padding - (p / maxVal) * (chartHeight - padding * 2);
        polylinePoints += `${x},${y} `;
    });
    const eventTypeLabels = {
      'page_view': '👁️ Vista de página',
      'product_click': '👆 Click en producto',
      'product_view': '🔍 Vista de producto',
      'product_view_end': '⏱️ Fin vista producto',
      'add_to_cart': '🛒 Agregar al carrito',
      'checkout_whatsapp': '📱 Pedido WhatsApp',
      'registration': '📝 Registro',
      'login': '🔑 Inicio sesión',
      'search': '🔎 Búsqueda',
      'session_start': '▶️ Inicio sesión nav.',
      'session_end': '⏹️ Fin sesión nav.'
    };

    container.innerHTML = `
      <div class="admin-header">
        <h1>📊 Analíticas del Sitio</h1>
        <div class="d-flex gap-1">
          <button class="btn btn-secondary btn-sm" onclick="exportAnalytics()">📥 Exportar Datos</button>
          <button class="btn btn-danger btn-sm" onclick="clearAnalytics()">🗑️ Limpiar Todo</button>
        </div>
      </div>

      <!-- Visual Chart -->
      <div class="admin-card mb-3" style="padding: 25px;">
        <h3 style="border:none; margin-bottom: 20px;">📈 Tendencia de Tráfico (Últimos 7 días)</h3>
        <div style="background: var(--fondo); border-radius: 12px; padding: 15px; display: flex; justify-content: center;">
            <svg width="100%" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="xMidYMid meet">
                <!-- Grid lines -->
                <line x1="${padding}" y1="${padding}" x2="${chartWidth-padding}" y2="${padding}" stroke="var(--borde)" stroke-dasharray="4" />
                <line x1="${padding}" y1="${chartHeight-padding}" x2="${chartWidth-padding}" y2="${chartHeight-padding}" stroke="var(--borde)" />
                <!-- The Line -->
                <polyline points="${polylinePoints}" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                <!-- Circles -->
                ${points.map((p, i) => {
                    const x = padding + i * stepX;
                    const y = chartHeight - padding - (p / maxVal) * (chartHeight - padding * 2);
                    return `<circle cx="${x}" cy="${y}" r="6" fill="white" stroke="var(--primary)" stroke-width="3" />`;
                }).join('')}
            </svg>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="analytics-kpi-grid">
        <div class="analytics-kpi-card">
          <div class="kpi-icon">👁️</div>
          <div class="kpi-value">${stats.total.pageViews}</div>
          <div class="kpi-label">Vistas de Página</div>
          <div class="kpi-sub">Hoy: ${stats.today.pageViews} · Semana: ${stats.week.pageViews}</div>
        </div>
        <div class="analytics-kpi-card">
          <div class="kpi-icon">🧑‍💻</div>
          <div class="kpi-value">${stats.total.sessions}</div>
          <div class="kpi-label">Sesiones Totales</div>
          <div class="kpi-sub">Duración prom: ${stats.avgSessionDuration}</div>
        </div>
        <div class="analytics-kpi-card">
          <div class="kpi-icon">📝</div>
          <div class="kpi-value">${stats.total.registrations}</div>
          <div class="kpi-label">Registros</div>
          <div class="kpi-sub">Gmail: ${stats.gmailUsers.length}</div>
        </div>
        <div class="analytics-kpi-card">
          <div class="kpi-icon">📱</div>
          <div class="kpi-value">${stats.total.checkouts}</div>
          <div class="kpi-label">Pedidos WhatsApp</div>
          <div class="kpi-sub">Hoy: ${stats.today.checkouts} · Semana: ${stats.week.checkouts}</div>
        </div>
        <div class="analytics-kpi-card">
          <div class="kpi-icon">🛒</div>
          <div class="kpi-value">${stats.total.addToCarts}</div>
          <div class="kpi-label">Agregados al Carrito</div>
          <div class="kpi-sub">&nbsp;</div>
        </div>
        <div class="analytics-kpi-card">
          <div class="kpi-icon">🔎</div>
          <div class="kpi-value">${stats.total.searches}</div>
          <div class="kpi-label">Búsquedas</div>
          <div class="kpi-sub">&nbsp;</div>
        </div>
      </div>

      <!-- Two column grid for tables -->
      <div class="analytics-tables-grid">

        <!-- Top Products Viewed -->
        <div class="admin-card">
          <h3>🔥 Productos Más Vistos</h3>
          ${stats.topProducts.length === 0 ? '<p style="color: var(--texto-muted); padding: 20px 0;">Sin datos aún</p>' : `
          <table class="data-table">
            <thead><tr><th>#</th><th>Producto</th><th>Vistas</th></tr></thead>
            <tbody>
              ${stats.topProducts.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${App.esc(p.name)}</strong></td>
                  <td><span class="analytics-badge">${p.count}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>`}
        </div>

        <!-- Top Cart Products -->
        <div class="admin-card">
          <h3>🛒 Más Agregados al Carrito</h3>
          ${stats.topCartProducts.length === 0 ? '<p style="color: var(--texto-muted); padding: 20px 0;">Sin datos aún</p>' : `
          <table class="data-table">
            <thead><tr><th>#</th><th>Producto</th><th>Veces</th></tr></thead>
            <tbody>
              ${stats.topCartProducts.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${App.esc(p.name)}</strong></td>
                  <td><span class="analytics-badge">${p.count}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>`}
        </div>

        <!-- Top Searches -->
        <div class="admin-card">
          <h3>🔍 Búsquedas Populares</h3>
          ${stats.topSearches.length === 0 ? '<p style="color: var(--texto-muted); padding: 20px 0;">Sin datos aún</p>' : `
          <table class="data-table">
            <thead><tr><th>#</th><th>Término</th><th>Veces</th></tr></thead>
            <tbody>
              ${stats.topSearches.map((s, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${App.esc(s.name)}</strong></td>
                  <td><span class="analytics-badge">${s.count}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>`}
        </div>

        <!-- Top Pages -->
        <div class="admin-card">
          <h3>📄 Páginas Más Visitadas</h3>
          ${stats.topPages.length === 0 ? '<p style="color: var(--texto-muted); padding: 20px 0;">Sin datos aún</p>' : `
          <table class="data-table">
            <thead><tr><th>#</th><th>Página</th><th>Visitas</th></tr></thead>
            <tbody>
              ${stats.topPages.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${p.name}</strong></td>
                  <td><span class="analytics-badge">${p.count}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>`}
        </div>
      </div>

      <!-- Registered Users -->
      <div class="admin-card mt-3">
        <h3>👥 Usuarios Registrados (Detalle)</h3>
        ${stats.registeredUsers.length === 0 ? '<p style="color: var(--texto-muted); padding: 20px 0;">Sin registros aún</p>' : `
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Proveedor</th><th>Gmail?</th><th>Fecha</th></tr></thead>
          <tbody>
            ${stats.registeredUsers.map(u => `
              <tr>
                <td><strong>${App.esc(u.name)}</strong></td>
                <td>${App.esc(u.email)}</td>
                <td>${App.esc(u.provider)}</td>
                <td>${u.isGmail ? '<span style="color: var(--success);">✅ Sí</span>' : '<span style="color: var(--texto-muted);">No</span>'}</td>
                <td>${new Date(u.date).toLocaleDateString('es-DO')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      </div>

      <!-- Login History -->
      <div class="admin-card mt-3">
        <h3>🔑 Historial de Logins</h3>
        ${stats.loginHistory.length === 0 ? '<p style="color: var(--texto-muted); padding: 20px 0;">Sin logins registrados</p>' : `
        <table class="data-table">
          <thead><tr><th>Email</th><th>Proveedor</th><th>Nº Logins</th><th>Último Login</th></tr></thead>
          <tbody>
            ${stats.loginHistory.map(l => `
              <tr>
                <td><strong>${App.esc(l.email)}</strong></td>
                <td>${App.esc(l.provider)}</td>
                <td><span class="analytics-badge">${l.count}</span></td>
                <td>${new Date(l.lastLogin).toLocaleString('es-DO')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      </div>

      <!-- Recent Activity -->
      <div class="admin-card mt-3">
        <h3>📋 Actividad Reciente (Últimos 50 eventos)</h3>
        ${stats.recentEvents.length === 0 ? '<p style="color: var(--texto-muted); padding: 20px 0;">Sin actividad registrada</p>' : `
        <div style="max-height: 500px; overflow-y: auto;">
        <table class="data-table">
          <thead><tr><th>Tipo</th><th>Detalles</th><th>Usuario</th><th>Página</th><th>Fecha/Hora</th></tr></thead>
          <tbody>
            ${stats.recentEvents.map(e => {
      const label = eventTypeLabels[e.type] || e.type;
      let details = '';
      if (e.data.productName) details = e.data.productName;
      else if (e.data.term) details = '"' + e.data.term + '"';
      else if (e.data.email) details = e.data.email;
      else if (e.data.page) details = e.data.page;
      else if (e.data.durationFormatted) details = 'Duración: ' + e.data.durationFormatted;
      else if (e.data.itemCount) details = e.data.itemCount + ' artículos';

      if (e.data.viewDurationFormatted) details += ' (' + e.data.viewDurationFormatted + ')';
      if (e.data.total) details += ' - ' + App.formatPrice(e.data.total);

      return `
                <tr>
                  <td><span class="analytics-event-type">${App.esc(label)}</span></td>
                  <td>${App.esc(details) || '—'}</td>
                  <td>${e.user ? App.esc(e.user.name || e.user.email) : '<span style="color: var(--texto-muted);">Anónimo</span>'}</td>
                  <td>${App.esc(e.page) || '—'}</td>
                  <td style="white-space: nowrap;">${new Date(e.timestamp).toLocaleString('es-DO')}</td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
        </div>`}
      </div>
    `;
  }

  window.clearAnalytics = function () {
    if (confirm('¿Estás seguro de que quieres borrar TODOS los datos de analíticas? Esta acción no se puede deshacer.')) {
      Analytics.clearAll();
      App.showToast('Datos de analíticas eliminados', 'info');
      renderSection();
    }
  };

  window.exportAnalytics = function () {
    const events = Analytics.getEvents();
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deshop-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.showToast('Datos exportados exitosamente 📥', 'success');
  };

  // ══════════════════════════════════════
  //  BANNERS SECTION
  // ══════════════════════════════════════
  function renderBannersSection(container) {
    const banners = App.getBanners();
    const mainImages = banners.main.images || [banners.main.image || ''];

    container.innerHTML = `
      <div class="admin-header">
        <h1>🖼️ Gestión de Banners Inicio</h1>
      </div>

      <form id="banners-form" onsubmit="window.handleBannerSubmit(event)">
        <!-- Main Hero Banner -->
        <div class="admin-card mb-3">
          <h3>Banner Principal (Slider Animado)</h3>
          <p style="font-size: 0.82rem; color: var(--texto-muted); margin-bottom: 12px;">El banner principal ahora es animado (Slider). Agregue hasta 15 imágenes.</p>
          
          <div id="banner-images-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin-bottom: 15px;">
            ${mainImages.map((url, i) => `
              <div class="form-group banner-image-row" style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid var(--borde);">
                <label style="display:block; margin-bottom: 6px; font-weight:700; color: var(--primary);">Foto ${i + 1}</label>
                <div style="display:flex; gap:8px;">
                  <input type="url" class="main-banner-url" value="${url}" placeholder="URL de imagen..." style="flex:1;" required>
                  ${i > 0 ? `<button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.parentElement.remove()" style="height: 38px; width: 38px;">×</button>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.addBannerImageInput()" style="margin-bottom: 25px;">
            ➕ Agregar otra foto (Máx 15)
          </button>

          <div class="form-grid">
            <div class="form-group">
              <label>Subtítulo (ej: LOS RECIÉN LLEGADOS)</label>
              <input type="text" id="main-subtitle" value="${banners.main.subtitle}" required>
            </div>
            <div class="form-group">
              <label>Título Grande (ej: VENTA DE VERANO)</label>
              <input type="text" id="main-title" value="${banners.main.title}" required>
            </div>
            <div class="form-group">
              <label>Texto Descuento (ej: MIN. 40% DESCUENTO)</label>
              <input type="text" id="main-discount" value="${banners.main.discount}" required>
            </div>
            <div class="form-group">
              <label>Texto Botón</label>
              <input type="text" id="main-btnText" value="${banners.main.btnText}" required>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <!-- Side Banner 1 -->
          <div class="admin-card">
            <h3>Banner Lateral Superior</h3>
            <div class="form-group">
              <label>Etiqueta</label>
              <input type="text" id="side1-label" value="${banners.side1.label}" required>
            </div>
            <div class="form-group">
              <label>Título</label>
              <input type="text" id="side1-title" value="${banners.side1.title}" required>
            </div>
            <div class="form-group">
              <label>Descripción</label>
              <input type="text" id="side1-desc" value="${banners.side1.desc}" required>
            </div>
            <div class="form-group">
              <label>URL Imagen</label>
              <input type="url" id="side1-image" value="${banners.side1.image}" required>
            </div>
          </div>

          <!-- Side Banner 2 -->
          <div class="admin-card">
            <h3>Banner Lateral Inferior</h3>
            <div class="form-group">
              <label>Etiqueta</label>
              <input type="text" id="side2-label" value="${banners.side2.label}" required>
            </div>
            <div class="form-group">
              <label>Título</label>
              <input type="text" id="side2-title" value="${banners.side2.title}" required>
            </div>
            <div class="form-group">
              <label>Descripción</label>
              <input type="text" id="side2-desc" value="${banners.side2.desc}" required>
            </div>
            <div class="form-group">
              <label>URL Imagen</label>
              <input type="url" id="side2-image" value="${banners.side2.image}" required>
            </div>
          </div>
        </div>

        <div style="margin-top: 25px; text-align: right;">
          <button type="submit" class="btn btn-primary btn-lg" style="padding: 15px 40px; border-radius: 50px; font-weight: 800; box-shadow: var(--shadow-glow);">Guardar Todos los Cambios</button>
        </div>
      </form>
    `;
  }

  window.addBannerImageInput = function () {
    const container = document.getElementById('banner-images-container');
    const count = container.querySelectorAll('.banner-image-row').length;
    if (count >= 15) return App.showToast('Máximo 15 imágenes permitidas', 'error');

    const div = document.createElement('div');
    div.className = 'form-group banner-image-row';
    div.style.cssText = 'background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid var(--borde);';
    div.innerHTML = `
      <label style="display:block; margin-bottom: 6px; font-weight:700; color: var(--primary);">Foto ${count + 1}</label>
      <div style="display:flex; gap:8px;">
        <input type="url" class="main-banner-url" placeholder="URL de imagen..." style="flex:1;" required>
        <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.parentElement.remove()" style="height: 38px; width: 38px;">×</button>
      </div>
    `;
    container.appendChild(div);
  };

  window.handleBannerSubmit = function (e) {
    e.preventDefault();
    const mainImages = Array.from(document.querySelectorAll('.main-banner-url'))
      .map(input => input.value.trim())
      .filter(url => url !== '');

    if (mainImages.length === 0) {
      return App.showToast('Agregue al menos una imagen para el banner principal', 'error');
    }

    const banners = {
      main: {
        subtitle: document.getElementById('main-subtitle').value,
        title: document.getElementById('main-title').value,
        discount: document.getElementById('main-discount').value,
        btnText: document.getElementById('main-btnText').value,
        images: mainImages,
        image: mainImages[0]
      },
      side1: {
        label: document.getElementById('side1-label').value,
        title: document.getElementById('side1-title').value,
        desc: document.getElementById('side1-desc').value,
        linkText: 'Mostrar ahora',
        image: document.getElementById('side1-image').value
      },
      side2: {
        label: document.getElementById('side2-label').value,
        title: document.getElementById('side2-title').value,
        desc: document.getElementById('side2-desc').value,
        linkText: 'Mostrar ahora',
        image: document.getElementById('side2-image').value
      }
    };

    App.saveBanners(banners);
    App.showToast('Banners actualizados correctamente ✨', 'success');
  };

  // ══════════════════════════════════════
  //  PRODUCT MODAL
  // ══════════════════════════════════════
  window.openProductModal = function (productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    const categories = App.getCategories();

    // Fill category select
    const catSelect = document.getElementById('pf-category');
    catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${App.esc(c.emoji)} ${App.esc(c.name)}</option>`).join('');

    // Fill supplier select (obligatorio)
    const supplierSelect = document.getElementById('pf-supplier');
    const suppliers = App.getSuppliers().filter(s => s.is_active);
    supplierSelect.innerHTML = '<option value="">-- Selecciona proveedor --</option>' +
      suppliers.map(s => `<option value="${s.id}">${App.esc(s.name)}</option>`).join('');
    if (suppliers.length === 0) {
      supplierSelect.innerHTML = '<option value="">⚠️ No hay proveedores — crea uno primero</option>';
    }

    // Similar products are now computed automatically — no manual selection needed

    const imageContainer = document.getElementById('image-inputs-container');
    imageContainer.innerHTML = '';

    if (productId) {
      const product = App.getProduct(productId);
      if (!product) return;
      title.textContent = 'Editar Producto';
      document.getElementById('product-id').value = product.id;
      document.getElementById('pf-name').value = product.name;
      document.getElementById('pf-description').value = product.description;
      document.getElementById('pf-price').value = product.price;
      document.getElementById('pf-oldprice').value = product.oldPrice || '';
      document.getElementById('pf-category').value = product.category || (categories[0] ? categories[0].id : '');
      document.getElementById('pf-badge').value = product.badge || '';
      document.getElementById('pf-stock').value = product.stock || 0;

      // Pre-select existing supplier and cost price
      const existingLink = App.getSupplierProducts().find(lp => lp.product_id === productId);
      if (existingLink) {
        document.getElementById('pf-supplier').value = existingLink.supplier_id;
        document.getElementById('pf-cost').value = existingLink.cost_price;
      } else {
        document.getElementById('pf-supplier').value = '';
        document.getElementById('pf-cost').value = '';
      }

      // Select similar products (already handled in HTML generation)

      // Reset and Fill Variants
      const variantsContainer = document.getElementById('variants-container');
      variantsContainer.innerHTML = '';

      const variants = product.sizeVariants || (product.sizes || []).map(s => ({ size: s, colors: product.colors || [] }));
      if (variants.length > 0) {
        variants.forEach(v => addVariantRow(v.size, v.colors));
      }

      // Handle multiple images
      const images = product.images || [product.image];
      images.forEach((url, index) => addImageUrlInput(url, index === 0));
    } else {
      title.textContent = 'Nuevo Producto';
      form.reset();
      document.getElementById('product-id').value = '';
      document.getElementById('pf-stock').value = 0;
      document.getElementById('pf-badge').value = '';
      document.getElementById('pf-supplier').value = '';
      document.getElementById('pf-cost').value = '';
      document.getElementById('variants-container').innerHTML = '';
      const checkboxes = document.querySelectorAll('input[name="pf_similar"]');
      checkboxes.forEach(cb => cb.checked = false);
      addImageUrlInput('', true); // First input is required
    }

    modal.classList.add('active');
    updateImagePreview();
  };

  function addImageUrlInput(url = '', isFirst = false) {
    const container = document.getElementById('image-inputs-container');
    const inputs = container.querySelectorAll('.image-input-row');
    if (inputs.length >= 10) {
      App.showToast('Máximo 10 imágenes permitidas', 'info');
      return;
    }

    const row = document.createElement('div');
    row.className = 'image-input-row';
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.marginBottom = '8px';

    row.innerHTML = `
      <input type="url" class="pf-image-url" placeholder="https://..." value="${url}" ${isFirst ? 'required' : ''} style="flex: 1;">
      ${!isFirst ? '<button type="button" class="btn btn-sm btn-danger remove-image-url">✕</button>' : ''}
    `;

    container.appendChild(row);

    // Bind events
    row.querySelector('.pf-image-url').addEventListener('input', updateImagePreview);
    if (!isFirst) {
      row.querySelector('.remove-image-url').addEventListener('click', () => {
        row.remove();
        updateImagePreview();
      });
    }
  }

  function addVariantRow(sizeVal = 'S', colorsVal = []) {
    const container = document.getElementById('variants-container');

    // Create datalist if not exists
    if (!document.getElementById('size-suggestions')) {
      const dl = document.createElement('datalist');
      dl.id = 'size-suggestions';
      const commonSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Única', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
      dl.innerHTML = commonSizes.map(s => `<option value="${s}">`).join('');
      document.body.appendChild(dl);
    }

    const row = document.createElement('div');
    row.className = 'variant-row fade-in-up';
    row.style.cssText = 'border: 1px solid var(--borde); border-radius: 10px; padding: 14px; margin-bottom: 14px; background: var(--fondo-alt);';

    row.innerHTML = `
      <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px;">
        <label style="font-size: 0.82rem; font-weight: 600; white-space: nowrap;">📏 Talla:</label>
        <input type="text" class="pf-var-size" list="size-suggestions" placeholder="Talla (ej: S)" value="${sizeVal}"
               style="width: 100px; padding: 6px 10px; border: 1.5px solid var(--borde); border-radius: 6px; font-size: 0.9rem;">
        <button type="button" class="btn btn-sm btn-danger remove-variant" style="margin-left: auto;">✕ Eliminar Talla</button>
      </div>
      <div class="color-swatches-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
      <button type="button" class="btn btn-sm btn-secondary add-color-swatch" style="margin-top: 10px; width: 100%;">
        + Agregar Color / Variante de Foto
      </button>
    `;

    container.appendChild(row);

    row.querySelector('.remove-variant').addEventListener('click', () => row.remove());

    const swatchList = row.querySelector('.color-swatches-list');
    const addSwatchBtn = row.querySelector('.add-color-swatch');

    // Load existing colors
    const normalizedColors = colorsVal.map(c => {
      if (typeof c === 'string') return { name: c, image: '' }; // legacy
      return c;
    });
    normalizedColors.forEach(c => addColorSwatchInput(swatchList, c.name, c.image));

    addSwatchBtn.addEventListener('click', () => addColorSwatchInput(swatchList));
  }

  function addColorSwatchInput(container, nameVal = '', imageVal = '') {
    const entry = document.createElement('div');
    entry.className = 'color-swatch-entry';
    entry.style.cssText = 'display: grid; grid-template-columns: 50px 1fr 1fr auto; gap: 8px; align-items: center; background: white; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--borde);';

    entry.innerHTML = `
      <div class="swatch-preview" style="width: 46px; height: 46px; border-radius: 50%; overflow: hidden; border: 2px solid var(--borde); background: #eee; flex-shrink: 0;">
        <img src="${imageVal}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" alt="">
      </div>
      <input type="text" class="swatch-name" placeholder="Nombre (ej: Rojo)" value="${nameVal}"
             style="padding: 7px 10px; border: 1.5px solid var(--borde); border-radius: 6px; font-size: 0.85rem;">
      <input type="url" class="swatch-image" placeholder="URL de la foto del color" value="${imageVal}"
             style="padding: 7px 10px; border: 1.5px solid var(--borde); border-radius: 6px; font-size: 0.85rem;">
      <button type="button" class="btn btn-sm btn-danger remove-swatch">✕</button>
    `;

    container.appendChild(entry);

    const imgInput = entry.querySelector('.swatch-image');
    const preview = entry.querySelector('.swatch-preview img');
    imgInput.addEventListener('input', () => {
      const val = imgInput.value.trim();
      if (val) { preview.src = val; preview.style.display = ''; }
      else { preview.style.display = 'none'; }
    });

    entry.querySelector('.remove-swatch').addEventListener('click', () => entry.remove());
  }

  document.getElementById('btn-add-variant').addEventListener('click', () => addVariantRow());
  document.getElementById('btn-add-image-url').addEventListener('click', () => addImageUrlInput());

  window.editProduct = function (id) {
    openProductModal(id);
  };

  window.deleteProduct = function (id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      App.deleteProduct(id);
      App.showToast('Producto eliminado', 'info');
      renderSection();
    }
  };

  window.closeModal = function () {
    document.getElementById('product-modal').classList.remove('active');
  };

  window.handleProductSubmit = function (e) {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const oldPrice = parseInt(document.getElementById('pf-oldprice').value) || null;
    const badge = document.getElementById('pf-badge').value.trim();

    // ── Validación obligatoria de proveedor ──
    const supplierId = document.getElementById('pf-supplier').value;
    const costPrice = parseFloat(document.getElementById('pf-cost').value);

    if (!supplierId) {
      App.showToast('⚠️ Debes seleccionar un proveedor para publicar este producto.', 'error');
      document.getElementById('pf-supplier').focus();
      return;
    }
    if (!costPrice || costPrice <= 0) {
      App.showToast('⚠️ Ingresa el precio de costo del proveedor.', 'error');
      document.getElementById('pf-cost').focus();
      return;
    }

    // Collect variants (new format: colors with name + image)
    const sizeVariants = Array.from(document.querySelectorAll('.variant-row')).map(row => {
      const colorEntries = Array.from(row.querySelectorAll('.color-swatch-entry')).map(entry => ({
        name: entry.querySelector('.swatch-name').value.trim(),
        image: entry.querySelector('.swatch-image').value.trim()
      })).filter(c => c.name !== '');
      return {
        size: row.querySelector('.pf-var-size').value.trim(),
        colors: colorEntries
      };
    });

    // Collect all image URLs
    const imageUrls = Array.from(document.querySelectorAll('.pf-image-url'))
      .map(input => input.value.trim())
      .filter(url => url !== '');

    if (imageUrls.length === 0) {
      App.showToast('Debes agregar al menos una imagen', 'error');
      return;
    }

    const data = {
      name: document.getElementById('pf-name').value.trim(),
      description: document.getElementById('pf-description').value.trim(),
      price: parseInt(document.getElementById('pf-price').value),
      oldPrice,
      category: document.getElementById('pf-category').value,
      badge: badge || null,
      badgeType: (badge && badge.includes('%')) ? 'discount' : null,
      image: imageUrls[0], // Main image for cards
      images: imageUrls,
      sizeVariants: sizeVariants,
      stock: parseInt(document.getElementById('pf-stock').value) || 0
    };

    let savedProductId = id;
    if (id) {
      App.updateProduct(id, data);
      App.showToast('Producto actualizado ✅', 'success');
    } else {
      const newProduct = App.addProduct(data);
      savedProductId = newProduct.id;
      App.showToast('Producto creado ✅', 'success');
    }

    // ── Vincular automáticamente al proveedor ──
    App.linkProductToSupplier(supplierId, savedProductId, costPrice);

    closeModal();
    renderSection();
  };

  // Image preview

  function updateImagePreview() {
    const inputs = document.querySelectorAll('.pf-image-url');
    const preview = document.getElementById('img-preview');
    preview.innerHTML = '';

    inputs.forEach(input => {
      const url = input.value.trim();
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.style.width = '100%';
        img.style.height = '60px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        img.onerror = () => img.style.display = 'none';
        preview.appendChild(img);
      }
    });
  }

  // Close modal on overlay click
  document.getElementById('product-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  });

  document.getElementById('category-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeCategoryModal();
    }
  });

  document.getElementById('supplier-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeSupplierModal();
  });

  document.getElementById('link-product-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeLinkProductModal();
  });

  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeCategoryModal();
      closeSupplierModal();
      closeLinkProductModal();
    }
  });

  // ══════════════════════════════════════
  //  SUPPLIERS SECTION
  // ══════════════════════════════════════
  function renderSuppliersSection(container) {
    const performance = App.getSupplierPerformance();
    const suppliers = App.getSuppliers();

    let searchTerm = window._supplierSearch || '';
    let filterStatus = window._supplierFilter || 'all';

    let filtered = performance;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(t) ||
        s.id.toLowerCase().includes(t) ||
        (s.contact_name || '').toLowerCase().includes(t)
      );
    }
    if (filterStatus === 'active') filtered = filtered.filter(s => s.is_active);
    if (filterStatus === 'inactive') filtered = filtered.filter(s => !s.is_active);

    // Global KPIs
    const totalSuppliers = suppliers.filter(s => s.is_active).length;
    const totalLinked = App.getSupplierProducts().length;
    const totalGross = performance.reduce((a, s) => a + s.grossRevenue, 0);
    const totalNet = performance.reduce((a, s) => a + s.netProfit, 0);
    const avgMargin = totalGross > 0 ? ((totalNet / totalGross) * 100).toFixed(1) : '0.0';

    // Generate Simple SVG Pie Chart for Sales Distribution by Supplier
    const pieRadius = 50;
    const pieCenterX = 60;
    const pieCenterY = 60;
    let currentAngle = 0;
    const pieColors = ['#5c35d9', '#06d6b0', '#f43f5e', '#f59e0b', '#3b82f6'];

    const pieSlices = performance.filter(s => s.grossRevenue > 0).map((s, i) => {
        const slicePct = s.grossRevenue / (totalGross || 1);
        const sliceAngle = slicePct * 360;

        // Calculate SVG arc path
        const x1 = pieCenterX + pieRadius * Math.cos((currentAngle - 90) * Math.PI / 180);
        const y1 = pieCenterY + pieRadius * Math.sin((currentAngle - 90) * Math.PI / 180);
        currentAngle += sliceAngle;
        const x2 = pieCenterX + pieRadius * Math.cos((currentAngle - 90) * Math.PI / 180);
        const y2 = pieCenterY + pieRadius * Math.sin((currentAngle - 90) * Math.PI / 180);

        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
        const pathData = `M ${pieCenterX} ${pieCenterY} L ${x1} ${y1} A ${pieRadius} ${pieRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

        return `<path d="${pathData}" fill="${pieColors[i % pieColors.length]}" stroke="white" stroke-width="1" />`;
    }).join('');

    container.innerHTML = `
      <div class="admin-header">
        <h1>🏭 Proveedores <span style="font-size:0.7em;opacity:0.6;">(Privado)</span></h1>
        <button class="btn btn-primary" onclick="openSupplierModal()">+ Nuevo Proveedor</button>
      </div>

      <!-- Performance Distribution -->
      <div class="admin-card mb-3" style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px; align-items: center;">
        <div style="text-align: center;">
            <svg width="120" height="120" viewBox="0 0 120 120">
                ${pieSlices || `<circle cx="60" cy="60" r="50" fill="var(--fondo)" />`}
            </svg>
            <div style="font-size: 0.8rem; color: var(--texto-light); margin-top: 10px;">Ventas por Proveedor</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            ${performance.filter(s => s.grossRevenue > 0).slice(0, 5).map((s, i) => `
                <div style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem;">
                    <span style="width: 12px; height: 12px; background: ${pieColors[i % pieColors.length]}; border-radius: 3px;"></span>
                    <span style="flex: 1;">${App.esc(s.name)}</span>
                    <span style="font-weight: 700;">${Math.round((s.grossRevenue / totalGross) * 100)}%</span>
                </div>
            `).join('')}
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="analytics-kpi-grid" style="margin-bottom: 24px;">
        <div class="analytics-kpi-card">
          <div class="kpi-icon">🏭</div>
          <div class="kpi-value">${totalSuppliers}</div>
          <div class="kpi-label">Proveedores Activos</div>
        </div>
        <div class="analytics-kpi-card">
          <div class="kpi-icon">📦</div>
          <div class="kpi-value">${totalLinked}</div>
          <div class="kpi-label">Productos Vinculados</div>
        </div>
        <div class="analytics-kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-value" style="font-size:1rem;">${App.formatPrice(totalGross)}</div>
          <div class="kpi-label">Ventas Brutas Totales</div>
          <div class="kpi-sub">Solo pedidos entregados</div>
        </div>
        <div class="analytics-kpi-card">
          <div class="kpi-icon">📈</div>
          <div class="kpi-value">${avgMargin}%</div>
          <div class="kpi-label">Margen Promedio</div>
          <div class="kpi-sub">Ganancia neta / Ventas</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="supplier-filter-bar" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:20px;padding:14px 18px;background:var(--fondo-alt);border-radius:12px;border:1px solid var(--borde);">
        <input type="text" id="supplier-search-input" placeholder="🔍 Buscar proveedor..." value="${App.esc(searchTerm)}"
          style="flex:1;min-width:180px;padding:9px 14px;border:1.5px solid var(--borde);border-radius:8px;font-size:0.9rem;"
          oninput="window._supplierSearch=this.value; renderSection();">
        <div style="display:flex;gap:8px;">
          ${['all','active','inactive'].map(f => {
            const labels = {all:'🔹 Todos', active:'🟢 Activos', inactive:'🔴 Inactivos'};
            return `<button class="btn btn-sm ${filterStatus===f?'btn-primary':'btn-secondary'} btn-supplier-filter" data-status="${f}">${labels[f]}</button>`;
          }).join('')}
        </div>
        <span style="font-size:0.82rem;color:var(--texto-muted);margin-left:auto;">${filtered.length} resultado(s)</span>
      </div>

      <!-- Performance Table -->
      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="emoji">🏭</div>
          <h2>Sin proveedores</h2>
          <p>Agrega tu primer proveedor para comenzar a gestionar tus costos.</p>
        </div>
      ` : `
        <div class="admin-card" style="padding:0;overflow:hidden;">
          <table class="data-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:32px;"></th>
                <th>ID / Proveedor</th>
                <th>País</th>
                <th style="text-align:center;">Productos</th>
                <th style="text-align:center;">Pedidos ✅</th>
                <th style="text-align:right;">Ventas Brutas</th>
                <th style="text-align:right;">Costo Total</th>
                <th style="text-align:right;">Ganancia Neta</th>
                <th style="text-align:center;">Margen %</th>
                <th style="text-align:center;">Estado</th>
                <th style="text-align:center;">Acciones</th>
              </tr>
            </thead>
            <tbody id="suppliers-table-body">
              ${filtered.map((s, idx) => {
                const marginColor = parseFloat(s.marginPct) >= 30 ? 'var(--success)' : parseFloat(s.marginPct) >= 15 ? '#f59e0b' : 'var(--rosa-dark)';
                const statusBadge = s.is_active
                  ? '<span style="color:var(--success);font-weight:700;">🟢 Activo</span>'
                  : '<span style="color:var(--texto-muted);font-weight:700;">🔴 Inactivo</span>';
                return `
                  <tr style="cursor:pointer;" id="sup-row-${s.id}">
                    <td style="text-align:center;">
                      <button class="btn btn-sm btn-secondary btn-supplier-toggle-row" data-id="${s.id}" title="Ver desglose" style="width:28px;height:28px;padding:0;font-size:0.8rem;" id="sup-toggle-${s.id}">▶</button>
                    </td>
                    <td>
                      <div style="font-weight:700;font-size:0.95rem;">${App.esc(s.name)}</div>
                      <div style="font-size:0.75rem;color:var(--texto-muted);">${App.esc(s.id)}</div>
                      ${s.contact_name ? `<div style="font-size:0.75rem;color:var(--texto-muted);">👤 ${App.esc(s.contact_name)}</div>` : ''}
                    </td>
                    <td><span style="font-size:1.2rem;">${s.country === 'DO' ? '🇩🇴' : s.country === 'CN' ? '🇨🇳' : s.country === 'US' ? '🇺🇸' : '🌍'}</span> <span style="font-size:0.8rem;">${App.esc(s.country)}</span></td>
                    <td style="text-align:center;"><span class="analytics-badge">${s.linkedProducts}</span></td>
                    <td style="text-align:center;"><span class="analytics-badge">${s.totalOrders}</span></td>
                    <td style="text-align:right;font-weight:600;">${App.formatPrice(s.grossRevenue)}</td>
                    <td style="text-align:right;color:var(--texto-muted);">${App.formatPrice(s.totalCost)}</td>
                    <td style="text-align:right;font-weight:800;color:var(--success);">${App.formatPrice(s.netProfit)}</td>
                    <td style="text-align:center;">
                      <span style="font-weight:800;color:${marginColor};">${s.marginPct}%</span>
                    </td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td style="text-align:center;">
                      <div style="display:flex;gap:4px;justify-content:center;">
                        <button class="btn btn-sm btn-secondary btn-supplier-link-prod" data-id="${s.id}" title="Vincular producto">🔗</button>
                        <button class="btn btn-sm btn-secondary btn-supplier-edit" data-id="${s.id}" title="Editar">✏️</button>
                        <button class="btn btn-sm btn-danger btn-supplier-delete" data-id="${s.id}" title="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                  <!-- Expandable row -->
                  <tr id="sup-detail-${s.id}" style="display:none;">
                    <td colspan="11" style="padding:0;">
                      <div style="background:#f8f9fa;padding:16px 24px;border-top:2px solid var(--borde);">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
                          <div style="font-size:0.82rem;padding:10px;background:white;border-radius:8px;border:1px solid var(--borde);">
                            <strong>📧</strong> ${App.esc(s.email || '—')} &nbsp;|&nbsp;
                            <strong>📱</strong> ${App.esc(s.phone || '—')} &nbsp;|&nbsp;
                            <strong>💳</strong> ${App.esc(s.payment_terms || '—')}
                          </div>
                          <div style="font-size:0.82rem;padding:10px;background:white;border-radius:8px;border:1px solid var(--borde);">
                            <strong>📝</strong> ${App.esc(s.notes || 'Sin notas')}
                          </div>
                        </div>
                        ${s.productSales.length === 0 ? '<p style="color:var(--texto-muted);font-size:0.85rem;">Sin ventas registradas aún.</p>' : `
                        <table class="data-table" style="font-size:0.82rem;">
                          <thead><tr><th>Producto</th><th>Costo Unit.</th><th>Precio Venta</th><th style="text-align:center;">Uds. Vendidas</th><th style="text-align:right;">Ingresos</th><th style="text-align:right;">Costo</th><th style="text-align:right;">Ganancia</th><th>Acciones</th></tr></thead>
                          <tbody>
                            ${s.productSales.map(ps => `
                              <tr>
                                <td style="display:flex;align-items:center;gap:8px;">
                                  <img src="${encodeURI(ps.image)}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;" onerror="this.src=App.PLACEHOLDER">
                                  <span>${App.esc(ps.name)}</span>
                                </td>
                                <td>${App.formatPrice(ps.costPrice)}</td>
                                <td>${App.formatPrice(ps.salePrice)}</td>
                                <td style="text-align:center;"><strong>${ps.qty}</strong></td>
                                <td style="text-align:right;">${App.formatPrice(ps.revenue)}</td>
                                <td style="text-align:right;color:var(--texto-muted);">${App.formatPrice(ps.cost)}</td>
                                <td style="text-align:right;font-weight:700;color:var(--success);">${App.formatPrice(ps.revenue - ps.cost)}</td>
                                <td><button class="btn btn-sm btn-danger btn-supplier-unlink" data-id="${s.id}" data-product-id="${ps.productId}" title="Desvincular">✂️</button></td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>`}
                        ${ s.linkedProducts > 0 && App.getProductsForSupplier(s.id).filter(p => !s.productSales.find(ps => ps.productId === p.product_id)).length > 0 ? `
                          <p style="font-size:0.8rem;color:var(--texto-muted);margin-top:8px;">📦 ${s.linkedProducts - s.productSales.length} producto(s) vinculado(s) sin ventas aún.</p>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <!-- Global totals row -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px;">
          <div style="padding:12px;background:var(--fondo-alt);border-radius:10px;border:1px solid var(--borde);text-align:center;">
            <div style="font-size:0.75rem;color:var(--texto-muted);">VENTAS BRUTAS TOTAL</div>
            <div style="font-weight:800;font-size:1.1rem;">${App.formatPrice(performance.reduce((a,s) => a+s.grossRevenue,0))}</div>
          </div>
          <div style="padding:12px;background:var(--fondo-alt);border-radius:10px;border:1px solid var(--borde);text-align:center;">
            <div style="font-size:0.75rem;color:var(--texto-muted);">COSTO TOTAL</div>
            <div style="font-weight:800;font-size:1.1rem;color:var(--texto-muted);">${App.formatPrice(performance.reduce((a,s) => a+s.totalCost,0))}</div>
          </div>
          <div style="padding:12px;background:linear-gradient(135deg,#e8f5e9,#f0fdf4);border-radius:10px;border:1px solid var(--success);text-align:center;">
            <div style="font-size:0.75rem;color:var(--success);">GANANCIA NETA TOTAL</div>
            <div style="font-weight:800;font-size:1.1rem;color:var(--success);">${App.formatPrice(performance.reduce((a,s) => a+s.netProfit,0))}</div>
          </div>
          <div style="padding:12px;background:linear-gradient(135deg,#e0f2fe,#f0f9ff);border-radius:10px;border:1px solid #0ea5e9;text-align:center;">
            <div style="font-size:0.75rem;color:#0c4a6e;">MARGEN NETO PROM.</div>
            <div style="font-weight:800;font-size:1.1rem;color:#0c4a6e;">${avgMargin}%</div>
          </div>
        </div>
      `}
    `;
  }

  window.toggleSupplierRow = function(id) {
    const detailRow = document.getElementById('sup-detail-' + id);
    const toggleBtn = document.getElementById('sup-toggle-' + id);
    if (!detailRow) return;
    const isVisible = detailRow.style.display !== 'none';
    detailRow.style.display = isVisible ? 'none' : 'table-row';
    toggleBtn.textContent = isVisible ? '▶' : '▼';
  };

  window.deleteSupplierConfirm = function(id) {
    const s = App.getSupplier(id);
    if (!s) return;
    if (confirm(`¿Eliminar el proveedor "${s.name}"? Se desvincularán todos sus productos. Esta acción no se puede deshacer.`)) {
      App.deleteSupplier(id);
      App.showToast('Proveedor eliminado', 'info');
      renderSection();
    }
  };

  window.unlinkProduct = function(productId) {
    if (confirm('¿Desvincular este producto del proveedor?')) {
      App.unlinkProductFromSupplier(productId);
      App.showToast('Producto desvinculado', 'info');
      renderSection();
    }
  };

  // ── Supplier Modal ──
  window.openSupplierModal = function(supplierId = null) {
    const modal = document.getElementById('supplier-modal');
    const title = document.getElementById('supplier-modal-title');
    document.getElementById('sf-id').value = supplierId || '';

    if (supplierId) {
      const s = App.getSupplier(supplierId);
      if (!s) return;
      title.textContent = 'Editar Proveedor';
      document.getElementById('sf-name').value = s.name;
      document.getElementById('sf-contact').value = s.contact_name || '';
      document.getElementById('sf-email').value = s.email || '';
      document.getElementById('sf-phone').value = s.phone || '';
      document.getElementById('sf-country').value = s.country || 'DO';
      document.getElementById('sf-payment').value = s.payment_terms || '';
      document.getElementById('sf-commission').value = s.commission_pct || 0;
      document.getElementById('sf-active').checked = s.is_active;
      document.getElementById('sf-notes').value = s.notes || '';
    } else {
      title.textContent = 'Nuevo Proveedor';
      document.getElementById('supplier-form').reset();
      document.getElementById('sf-id').value = '';
      document.getElementById('sf-active').checked = true;
    }
    modal.classList.add('active');
  };

  window.closeSupplierModal = function() {
    document.getElementById('supplier-modal').classList.remove('active');
  };

  window.handleSupplierSubmit = function(e) {
    e.preventDefault();
    const id = document.getElementById('sf-id').value;
    const data = {
      name: document.getElementById('sf-name').value.trim(),
      contact_name: document.getElementById('sf-contact').value.trim(),
      email: document.getElementById('sf-email').value.trim(),
      phone: document.getElementById('sf-phone').value.trim(),
      country: document.getElementById('sf-country').value,
      payment_terms: document.getElementById('sf-payment').value.trim(),
      commission_pct: parseFloat(document.getElementById('sf-commission').value) || 0,
      is_active: document.getElementById('sf-active').checked,
      notes: document.getElementById('sf-notes').value.trim()
    };
    if (!data.name) return App.showToast('El nombre es obligatorio', 'error');
    if (id) {
      App.updateSupplier(id, data);
      App.showToast('Proveedor actualizado ✅', 'success');
    } else {
      App.addSupplier(data);
      App.showToast('Proveedor creado ✅', 'success');
    }
    closeSupplierModal();
    renderSection();
  };

  // ── Link Product Modal ──
  window.openLinkProductModal = function(supplierId) {
    const supplier = App.getSupplier(supplierId);
    if (!supplier) return;
    document.getElementById('lp-supplier-id').value = supplierId;
    document.getElementById('lp-supplier-name').textContent = supplier.name;
    const products = App.getProducts();
    const links = App.getSupplierProducts();
    const select = document.getElementById('lp-product-select');
    select.innerHTML = products.map(p => {
      const existingLink = links.find(lp => lp.product_id === p.id);
      const linkedTo = existingLink ? App.getSupplier(existingLink.supplier_id) : null;
      const label = linkedTo && linkedTo.id !== supplierId ? ` (vinculado a ${App.esc(linkedTo.name)})` : '';
      return `<option value="${p.id}">${App.esc(p.name)}${label}</option>`;
    }).join('');
    document.getElementById('lp-cost').value = '';
    document.getElementById('link-product-modal').classList.add('active');
  };

  window.closeLinkProductModal = function() {
    document.getElementById('link-product-modal').classList.remove('active');
  };

  window.handleLinkProductSubmit = function(e) {
    e.preventDefault();
    const supplierId = document.getElementById('lp-supplier-id').value;
    const productId = document.getElementById('lp-product-select').value;
    const costPrice = document.getElementById('lp-cost').value;
    if (!productId || !costPrice) return App.showToast('Selecciona un producto e ingresa el costo', 'error');
    App.linkProductToSupplier(supplierId, productId, costPrice);
    App.showToast('Producto vinculado exitosamente 🔗', 'success');
    closeLinkProductModal();
    renderSection();
  };
}

if (App.isReady) {
  initAdmin();
} else {
  window.addEventListener('app-ready', initAdmin);
}
