/* ── Floating Contact Widget (Zalo, Hotline, Scroll to top) ── */
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('floating-contact-container')) return;

    const container = document.createElement('div');
    container.id = 'floating-contact-container';
    container.innerHTML = `
      <div class="floating-widget-wrapper">
        <!-- Back to top button -->
        <button id="btn-back-to-top" class="floating-btn btn-top" title="Lên đầu trang" aria-label="Lên đầu trang">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
        </button>

        <!-- Zalo Button -->
        <a href="https://zalo.me/0345288718" target="_blank" rel="noopener" id="btn-floating-zalo" class="floating-btn btn-zalo pulse-animation" title="Chat Zalo: 0345288718" aria-label="Chat Zalo">
          <span class="zalo-icon-text">Zalo</span>
        </a>

        <!-- Hotline Button -->
        <a href="tel:0383158080" id="btn-floating-hotline" class="floating-btn btn-hotline pulse-animation" title="Gọi Hotline: 0383.158.080" aria-label="Gọi Điện">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
        </a>
      </div>
    `;

    document.body.appendChild(container);

    // Zalo Button Click Event
    const btnZalo = document.getElementById('btn-floating-zalo');
    if (btnZalo) {
      btnZalo.addEventListener('click', function(e) {
        if (typeof window.showZaloQR === 'function' || typeof window.openZaloModal === 'function') {
          e.preventDefault();
          if (typeof window.showZaloQR === 'function') window.showZaloQR();
          else window.openZaloModal();
        }
      });
    }

    // Scroll to top visibility toggle
    const btnTop = document.getElementById('btn-back-to-top');
    if (btnTop) {
      window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
          btnTop.classList.add('show');
        } else {
          btnTop.classList.remove('show');
        }
      });

      btnTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
})();
