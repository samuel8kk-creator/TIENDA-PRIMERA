/* ================================================
   Away — Blog Page Logic
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Render shared header & footer
    document.getElementById('header-root').innerHTML = App.renderHeader('blog');
    document.getElementById('footer-root').innerHTML = App.renderFooter();
});
