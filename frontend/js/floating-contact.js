/* ── Floating Contact Widget (Zalo, Hotline, Messenger, Scroll to top) ── */
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

        <!-- Messenger Button -->
        <a href="https://m.me/namnguyenpc" target="_blank" rel="noopener" class="floating-btn btn-messenger" title="Chat qua Facebook Messenger" aria-label="Chat Messenger">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.513 3.73 7.215V22l3.364-1.847c.928.257 1.91.396 2.906.396 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.09 12.443l-2.548-2.723-4.97 2.723 5.466-5.8 2.61 2.722 4.908-2.722-5.466 5.8z"/></svg>
        </a>

        <!-- Zalo Button -->
        <a href="javascript:void(0)" onclick="if(window.openZaloModal){window.openZaloModal();}else{window.open('https://zalo.me/0988888888','_blank');}" class="floating-btn btn-zalo pulse-animation" title="Chat tư vấn Zalo" aria-label="Chat Zalo">
          <span class="zalo-icon-text">Zalo</span>
        </a>

        <!-- Hotline Button -->
        <a href="tel:0988888888" class="floating-btn btn-hotline pulse-animation" title="Gọi Hotline: 0988.888.888" aria-label="Gọi Điện">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
        </a>
      </div>
    `;

    document.body.appendChild(container);

    // Scroll to top visibility toggle
    const btnTop = document.getElementById('btn-back-to-top');
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
  });
})();
