/* ================================================
   D&E Shop — Customer Auth
   Login/Register with tabs, profile view
   ================================================ */

function initAuth() {
  if (window._authInited) return;
  window._authInited = true;
  document.getElementById('header-root').innerHTML = App.renderHeader('login');
  document.getElementById('footer-root').innerHTML = App.renderFooter();

  const user = App.getCurrentUser();

  if (user) {
    renderProfile(user);
  } else {
    renderAuthForm();
  }

  function renderProfile(user) {
    document.getElementById('auth-page').innerHTML = `
      <div class="auth-card">
        <div style="text-align: center; margin-bottom: 24px;">
          <div class="review-avatar" style="width: 70px; height: 70px; font-size: 1.8rem; margin: 0 auto 16px;">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <h1 style="font-size: 1.5rem;">¡Hola, ${App.sanitize(user.name)}! 👋</h1>
          <p class="subtitle">${App.sanitize(user.email)}</p>
        </div>

        <div style="background: var(--fondo); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
          <p style="font-size: 0.88rem; color: var(--texto-light); margin-bottom: 4px;">📱 Teléfono</p>
          <p style="font-weight: 500;">${App.sanitize(user.phone) || 'No registrado'}</p>
        </div>

        <div style="background: var(--fondo); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
          <p style="font-size: 0.88rem; color: var(--texto-light); margin-bottom: 4px;">📍 Dirección</p>
          <p style="font-weight: 500;">${App.sanitize(user.address) || 'No registrada'}</p>
        </div>

        <a href="index.html" class="btn btn-primary btn-block mb-1">🛍️ Ir a la Tienda</a>
        <button class="btn btn-secondary btn-block" onclick="logoutUser()">Cerrar Sesión</button>
      </div>
    `;
  }

  function renderAuthForm() {
    let activeTab = 'login';

    function render() {
      document.getElementById('auth-page').innerHTML = `
        <div class="auth-card">
          <div style="text-align: center; margin-bottom: 8px; font-size: 2.5rem;">✨</div>
          <h1>D&E Shop</h1>
          <p class="subtitle">Tu tienda de moda favorita</p>

          <div class="auth-tabs">
            <button class="auth-tab ${activeTab === 'login' ? 'active' : ''}" onclick="switchTab('login')">Iniciar Sesión</button>
            <button class="auth-tab ${activeTab === 'register' ? 'active' : ''}" onclick="switchTab('register')">Registrarse</button>
          </div>

          ${activeTab === 'login' ? renderLoginForm() : renderRegisterForm()}
        </div>
      `;
    }

    function renderLoginForm() {
      return `
        <form id="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label>📧 Correo electrónico</label>
            <input type="email" id="login-email" placeholder="tu@correo.com" required>
          </div>
          <div class="form-group">
            <label>🔒 Contraseña</label>
            <input type="password" id="login-password" placeholder="Tu contraseña" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Iniciar Sesión</button>
        </form>
      `;
    }

    function renderRegisterForm() {
      return `
        <form id="register-form" onsubmit="handleRegister(event)">
          <div class="form-group">
            <label>👤 Nombre completo</label>
            <input type="text" id="reg-name" placeholder="Tu nombre" required>
          </div>
          <div class="form-group">
            <label>📧 Correo electrónico</label>
            <input type="email" id="reg-email" placeholder="tu@correo.com" required>
          </div>
          <div class="form-group">
            <label>📱 Teléfono</label>
            <input type="tel" id="reg-phone" placeholder="+1 809-000-0000">
          </div>
          <div class="form-group">
            <label>📍 Dirección</label>
            <input type="text" id="reg-address" placeholder="Tu dirección de envío">
          </div>
          <div class="form-group">
            <label>🔒 Contraseña (mín. 6 caracteres)</label>
            <input type="password" id="reg-password" placeholder="Crea una contraseña" required minlength="6">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Crear Cuenta</button>
        </form>
      `;
    }

    window.switchTab = function (tab) {
      activeTab = tab;
      render();
    };

    async function handlePostAuthRedirect() {
        // 1. Check for pending cart item
        const pendingItem = sessionStorage.getItem('ld_pending_cart_item');
        if (pendingItem) {
            try {
                const item = JSON.parse(pendingItem);
                // Only process if recent (e.g., < 30 mins)
                if (Date.now() - item.timestamp < 1800000) {
                    App.addToCart(item.productId, item.quantity, item.size, item.color);
                    sessionStorage.removeItem('ld_pending_cart_item');
                    App.showToast('Producto añadido al carrito ✨', 'success');
                    setTimeout(() => window.location.href = 'cart.html', 1000);
                    return;
                }
            } catch (e) { console.error('Error processing pending cart item:', e); }
            sessionStorage.removeItem('ld_pending_cart_item');
        }

        // 2. Check for redirect intent
        const redirectPath = sessionStorage.getItem('ld_redirect_after_login');
        if (redirectPath) {
            sessionStorage.removeItem('ld_redirect_after_login');
            window.location.href = redirectPath;
            return;
        }

        // Default: Refresh current page
        location.reload();
    }

    window.handleLogin = async function (e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      const result = await App.loginCustomer(email, password);
      if (result.success) {
        Analytics.trackLogin(email);
        App.showToast('¡Bienvenido de vuelta! 🎉', 'success');
        handlePostAuthRedirect();
      } else {
        App.showToast(result.message, 'error');
      }
    };

    window.handleRegister = async function (e) {
      e.preventDefault();
      const data = {
        name: document.getElementById('reg-name').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        phone: document.getElementById('reg-phone').value.trim(),
        address: document.getElementById('reg-address').value.trim(),
        password: document.getElementById('reg-password').value
      };

      const result = await App.registerCustomer(data);
      if (result.success) {
        Analytics.trackRegistration(data.email, data.name);
        App.showToast('¡Cuenta creada exitosamente! 🎉', 'success');
        handlePostAuthRedirect();
      } else {
        App.showToast(result.message, 'error');
      }
    };

    render();
  }

  window.logoutUser = function () {
    App.logoutCustomer();
    App.showToast('Sesión cerrada', 'info');
    setTimeout(() => location.reload(), 500);
  };
}

if (App.isReady) {
  initAuth();
} else {
  window.addEventListener('app-ready', initAuth);
}
