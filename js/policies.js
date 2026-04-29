/* ================================================
   D&E Shop — Legal Policies Mapping
   Handles Privacy, Returns, and Shipping content
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Render shared header & footer
    const params = new URLSearchParams(window.location.search);
    const policyKey = params.get('p') || 'privacy';

    document.getElementById('header-root').innerHTML = App.renderHeader('legal');
    document.getElementById('footer-root').innerHTML = App.renderFooter();

    renderPolicy(policyKey);
});

function renderPolicy(key) {
    const container = document.getElementById('policy-container');
    const content = getPolicyContent(key);

    container.innerHTML = `
        <div class="policy-card">
            <div class="policy-header">
                <div class="policy-icon">${content.icon}</div>
                <h1>${content.title}</h1>
                <p class="subtitle">D&E Shop — Compromiso con la Transparencia</p>
            </div>
            <div class="policy-body">
                ${content.body}
            </div>
            <div class="policy-footer">
                <a href="index.html" class="btn btn-outline">Volver a la tienda</a>
                <p style="margin-top: 20px; font-size: 0.85rem; color: var(--texto-light);">
                    Si tienes más dudas, contáctanos a: <a href="mailto:dye.servicioss@gmail.com">dye.servicioss@gmail.com</a>
                </p>
            </div>
        </div>
    `;
}

function getPolicyContent(key) {
    const policies = {
        'privacy': {
            icon: '🛡️',
            title: 'Políticas de Privacidad',
            body: `
                <section>
                    <h3>Valoramos tu confianza</h3>
                    <p>En <strong>D&E Shop</strong>, el manejo responsable de tu información es nuestra prioridad. Esta política explica cómo protegemos tus datos:</p>
                </section>
                
                <section>
                    <div class="policy-item">
                        <span class="dot"></span>
                        <div>
                            <strong>Información Recopilada:</strong>
                            <p>Solo solicitamos los datos estrictamente necesarios para procesar tus pedidos: nombre completo, dirección de entrega exacta, número de teléfono y correo electrónico.</p>
                        </div>
                    </div>
                    <div class="policy-item">
                        <span class="dot"></span>
                        <div>
                            <strong>Seguridad de Pagos:</strong>
                            <p>Tu seguridad financiera es vital. <strong>No almacenamos los datos de tus tarjetas de crédito</strong>. Todos los pagos se procesan a través de plataformas seguras y encriptadas (Azul, PayPal, etc.).</p>
                        </div>
                    </div>
                    <div class="policy-item">
                        <span class="dot"></span>
                        <div>
                            <strong>Uso de Datos:</strong>
                            <p>Tu correo solo se usará para enviarte actualizaciones críticas de tu pedido y, únicamente si te has suscrito voluntariamente, nuestras ofertas exclusivas del Newsletter.</p>
                        </div>
                    </div>
                    <div class="policy-item">
                        <span class="dot"></span>
                        <div>
                            <strong>Derechos del Usuario:</strong>
                            <p>Tienes el control total. Puedes solicitar la actualización, corrección o eliminación de tus datos en cualquier momento escribiendo a <a href="mailto:dye.servicioss@gmail.com">dye.servicioss@gmail.com</a>.</p>
                        </div>
                    </div>
                </section>
            `
        },
        'returns': {
            icon: '🔄',
            title: 'Políticas de Cambios y Devoluciones',
            body: `
                <section>
                    <p>En <strong>D&E Shop</strong>, nos esforzamos por ofrecerte las últimas tendencias con la mejor relación calidad-precio. Para mantener precios competitivos y garantizar la higiene de nuestros productos, aplicamos la siguiente normativa:</p>
                </section>

                <div class="alert alert-warning" style="background: #fff9e6; border: 1px solid #ffeeba; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <strong>1. Ventas Finales:</strong> 
                    Todas las compras realizadas en nuestra tienda virtual son finales. Al completar su pedido, el cliente acepta que no se realizan cambios ni devoluciones de dinero ni de mercancía bajo ninguna circunstancia (talla, color, modelo o cambio de opinión).
                </div>

                <section>
                    <h3>2. Responsabilidad del Cliente</h3>
                    <p>Antes de finalizar tu compra, te pedimos encarecidamente:</p>
                    <ul style="margin-left: 20px; margin-bottom: 20px;">
                        <li>Revisar cuidadosamente las especificaciones del producto.</li>
                        <li>Confirmar que la talla seleccionada es la correcta (consúltanos por WhatsApp si tienes dudas).</li>
                        <li>Verificar que los accesorios y colores sean de tu total agrado.</li>
                    </ul>
                    <p>D&E Shop no se hace responsable por errores en la selección de productos. Una vez procesado el pago, el compromiso de compra es firme.</p>
                </section>

                <section>
                    <h3>3. Excepción por Defectos de Fábrica</h3>
                    <p>Únicamente se evaluará un cambio si el producto presenta un defecto de fábrica evidente. Para esto, el cliente deberá:</p>
                    <ul style="margin-left: 20px;">
                        <li>Notificar el inconveniente en un plazo máximo de <strong>24 horas</strong> tras recibir el paquete.</li>
                        <li>Enviar fotos y videos de la pieza afectada a nuestro WhatsApp: <strong><a href="https://wa.me/18496398500" target="_blank">+1 849-639-8500</a></strong>.</li>
                        <li>El artículo debe conservar sus etiquetas y empaque original.</li>
                    </ul>
                    <p style="margin-top: 15px; font-style: italic; color: var(--texto-light);">Nota: El desgaste por uso o el daño por lavado no se consideran defectos de fábrica.</p>
                </section>
            `
        },
        'shipping': {
            icon: '🚚',
            title: 'Políticas de Envío y Entrega',
            body: `
                <section>
                    <p>Queremos que recibas tus piezas favoritas lo antes posible. Aquí te explicamos cómo funcionan nuestras entregas:</p>
                </section>

                <section>
                    <div class="policy-item">
                        <strong>📍 Zonas de Cobertura:</strong>
                        <p>Realizamos envíos a todo el territorio nacional de la República Dominicana.</p>
                    </div>

                    <div class="policy-item">
                        <strong>⏱️ Tiempos de Entrega:</strong>
                        <ul style="margin-left: 20px; margin-top: 10px;">
                            <li><strong>Santo Domingo:</strong> De 2 a 3 días laborables.</li>
                            <li><strong>Provincias:</strong> De 2 a 5 días laborables mediante transporte externo (Caribe tours, Caribe Pack, Metro Pac, etc.).</li>
                        </ul>
                    </div>

                    <div class="policy-item" style="margin-top: 20px;">
                        <strong>💰 Costo de Envío:</strong>
                        <p>El costo se calculará al momento de finalizar la compra dependiendo de tu ubicación. Contamos con promociones de <strong>Envío Gratis</strong> en compras superiores a montos específicos (ver anuncios en la tienda).</p>
                    </div>
                </section>
            `
        }
    };

    return policies[key] || policies['privacy'];
}
