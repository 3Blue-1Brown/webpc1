/* ── Recent Purchase Popup Notification (Social Proof) ── */
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const samplePurchases = [
      { name: "Anh Nam (Hà Nội)", item: "CPU Intel Core i9-13900K Tray", time: "3 phút trước", img: "https://lh3.googleusercontent.com/d/1ZyINxYJkS2P3dPGxx8pa914dH_MiyTdy" },
      { name: "Anh Tuấn (TP.HCM)", item: "Bo mạch chủ ASUS ROG STRIX Z790-F", time: "8 phút trước", img: "https://lh3.googleusercontent.com/d/1HcazfJ0eAtEw8cpmWMROk6CD8b1_z-hT" },
      { name: "Anh Đức (Đà Nẵng)", item: "RAM KingSton Fury Beast 32GB RGB", time: "12 phút trước", img: "https://lh3.googleusercontent.com/d/1ZyINxYJkS2P3dPGxx8pa914dH_MiyTdy" },
      { name: "Anh Minh (Hải Phòng)", item: "Card đồ họa NVIDIA RTX 4070 Ti 12GB", time: "15 phút trước", img: "https://lh3.googleusercontent.com/d/1HcazfJ0eAtEw8cpmWMROk6CD8b1_z-hT" },
      { name: "Chị Lan (Cần Thơ)", item: "Màn hình LG 27 inch 4K IPS UltraFine", time: "22 phút trước", img: "https://lh3.googleusercontent.com/d/1ZyINxYJkS2P3dPGxx8pa914dH_MiyTdy" },
      { name: "Anh Hùng (Bắc Ninh)", item: "Bo dàn PC Gaming Core i7 - RTX 4060", time: "27 phút trước", img: "flash_banner1.png" }
    ];

    let currentIndex = 0;

    function showPopup() {
      let popup = document.getElementById('purchase-notification-popup');
      if (!popup) {
        popup = document.createElement('div');
        popup.id = 'purchase-notification-popup';
        popup.className = 'purchase-popup';
        document.body.appendChild(popup);
      }

      const p = samplePurchases[currentIndex];
      popup.innerHTML = `
        <button class="popup-close-btn" onclick="document.getElementById('purchase-notification-popup').classList.remove('show');">&times;</button>
        <div class="popup-body">
          <div class="popup-avatar">🛍️</div>
          <div class="popup-info">
            <div class="popup-title"><b>${p.name}</b> vừa đặt mua thành công!</div>
            <div class="popup-item-name">${p.item}</div>
            <div class="popup-time">🕒 ${p.time} • <i>Đã xác nhận đơn hàng</i></div>
          </div>
        </div>
      `;

      popup.classList.add('show');

      // Auto hide after 6 seconds
      setTimeout(() => {
        popup.classList.remove('show');
      }, 6000);

      currentIndex = (currentIndex + 1) % samplePurchases.length;
    }

    // First trigger after 8 seconds, then every 25 seconds
    setTimeout(showPopup, 8000);
    setInterval(showPopup, 25000);
  });
})();
