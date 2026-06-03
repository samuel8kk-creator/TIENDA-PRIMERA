# TIENDA PRIMERA 🚀

¡Bienvenido a **TIENDA PRIMERA**! Este es un proyecto de E-commerce profesional, rápido y seguro, diseñado para ofrecer la mejor experiencia de compra.

## ✨ Características Principales

- **🛒 Storefront Moderno:** Interfaz tipo Temu/Shein con carga perezosa de imágenes y diseño responsivo.
- **🔐 Seguridad de Grado Senior:** Sanitización universal contra XSS, sesiones asíncronas con Supabase Auth SDK y mapeo de datos seguro (camelCase to snake_case).
- **🚧 Flujo "Soft Wall" Premium:** Navegación libre con muro de conversión inteligente. El login es obligatorio solo para añadir al carrito o checkout, preservando la intención de compra.
- **🌙 Sleek Dark Mode:** Interfaz adaptativa (Deep Indigo) con persistencia de tema y alternador estético.
- **⚡ Rendimiento Optimizado:** Carga perezosa de imágenes, efectos Shimmer en esqueletos y caché inteligente (TTL 5 min) para minimizar llamadas a Supabase.
- **🔄 Carrito Multidispositivo:** Sincronización en tiempo real del carrito entre dispositivos para usuarios autenticados.
- **🛍️ Checkout Profesional:** Proceso de pago en 2 pasos (Información -> Envío interactivo) antes de la redirección a WhatsApp.
- **📦 Gestión Pro:** Panel administrativo con visualización de KPIs y gráficas SVG de tendencias de tráfico.
- **🗺️ Logística Avanzada:** Perfiles de usuario con campos detallados para envíos nacionales e internacionales.

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Backend/Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL + Realtime).
- **Autenticación:** Supabase Auth SDK.

## 🚀 Instalación y Configuración

1.  Clona este repositorio.
2.  Configura tu proyecto en Supabase y actualiza `js/supabase-config.js` con tu URL y Anon Key.
3.  Crea las tablas necesarias usando los archivos `.sql` incluidos (`suppliers_schema.sql`).
4.  ¡Listo! Abre `index.html` para ver la tienda.

---
Desarrollado con ❤️ para **TIENDA PRIMERA**.
