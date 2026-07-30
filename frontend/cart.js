// frontend/cart.js

function getCartKey() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.id) return 'webpc_cart_' + user.id;
    } catch(e) {}
  }
  return 'webpc_cart';
}

// Lấy giỏ hàng từ localStorage
function getCart() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (!token || !userStr) return [];
  
  const cartKey = getCartKey();
  const cart = localStorage.getItem(cartKey);
  return cart ? JSON.parse(cart) : [];
}

// Lưu giỏ hàng vào localStorage
function saveCart(cart) {
  const cartKey = getCartKey();
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartIcon();
}

// Thêm sản phẩm vào giỏ
function addToCart(product) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
    window.location.href = 'login.html';
    return;
  }

  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.id === product.id);

  // Use shared convertImageUrl (image-utils.js)
  const imgConverter = typeof convertImageUrl === 'function' ? convertImageUrl : (u => u ? (u.trim()) : '');

  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    // Chỉ lưu các thông tin cần thiết
    cart.push({
      id: product.id,
      ten_san_pham: product.ten_san_pham,
      gia: product.gia_khuyen_mai && product.gia_khuyen_mai < product.gia ? product.gia_khuyen_mai : product.gia,
      duong_dan_anh: imgConverter(product.duong_dan_anh || (product.images && product.images[0]) || ''),
      quantity: 1
    });
  }
  saveCart(cart);
  alert(`Đã thêm "${product.ten_san_pham}" vào giỏ hàng!`);
}

// Cập nhật số lượng
function updateQuantity(id, quantity) {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter(item => item.id !== id);
  } else {
    const item = cart.find(i => i.id === id);
    if (item) {
      item.quantity = quantity;
    }
  }
  saveCart(cart);
}

// Xóa sản phẩm khỏi giỏ
function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== id);
  saveCart(cart);
}

// Xóa toàn bộ giỏ hàng
function clearCart() {
  const cartKey = getCartKey();
  localStorage.removeItem(cartKey);
  updateCartIcon();
}

// Tính tổng tiền
function getCartTotal() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.gia * item.quantity), 0);
}

// Tính tổng số lượng (để hiển thị trên icon header nếu có)
function getCartCount() {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
}

// Cập nhật giao diện số lượng trên header (tìm element có id 'cart-count')
function updateCartIcon() {
  const countEl = document.getElementById('cart-count');
  if (countEl) {
    countEl.textContent = getCartCount();
  }
}

// Export for module usage or attach to window for script tags
window.Cart = {
  getCart,
  saveCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCartTotal,
  getCartCount,
  updateCartIcon
};

// Cập nhật icon khi load script
document.addEventListener('DOMContentLoaded', () => {
  updateCartIcon();

  // Load categories for horizontal subnav
  const subnav = document.getElementById('dynamic-category-subnav');
  if (subnav) {
    fetch('/api/categories')
      .then(res => res.json())
      .then(cats => {
        if (cats && cats.length > 0) {
          let html = '<li><a href="categories.html" style="color: var(--orange); font-weight: bold;">Tất cả</a></li>';
          html += cats.map(cat => `<li><a href="categories.html?cat=${cat.id}">${cat.ten_danh_muc}</a></li>`).join('');
          subnav.innerHTML = html;
        }
      })
      .catch(err => console.error('Lỗi tải subnav:', err));
  }

  // --- MOBILE HAMBURGER MENU TOGGLE ---
  const siteHeader = document.querySelector('.site-header');
  const mainNav = document.querySelector('.main-nav');
  if (siteHeader && mainNav) {
    let mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (!mobileMenuBtn) {
      mobileMenuBtn = document.createElement('button');
      mobileMenuBtn.id = 'mobile-menu-btn';
      mobileMenuBtn.className = 'mobile-menu-btn';
      mobileMenuBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
      mobileMenuBtn.innerHTML = `
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      `;
      // Insert after logo if logo exists
      const logo = siteHeader.querySelector('.logo');
      if (logo && logo.nextSibling) {
        siteHeader.insertBefore(mobileMenuBtn, logo.nextSibling);
      } else {
        siteHeader.appendChild(mobileMenuBtn);
      }
    }

    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = mainNav.classList.toggle('active');
      mobileMenuBtn.classList.toggle('active', isActive);
    });

    // Close menu when clicking outside header
    document.addEventListener('click', (e) => {
      if (!siteHeader.contains(e.target) && mainNav.classList.contains('active')) {
        mainNav.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
      }
    });

    // Close menu when clicking nav links
    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
      });
    });
  }

  // --- SEARCH BAR GLOBAL HANDLER ---
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  if (searchBtn && searchInput) {
    const doSearch = () => {
      const q = searchInput.value.trim();
      if (q) {
        window.location.href = `search.html?q=${encodeURIComponent(q)}`;
      }
    };
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        doSearch();
      }
    });
  }

  // --- AUTHENTICATION UI INJECTION ---
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const mainNavUl = document.querySelector('.main-nav ul');
  if (mainNavUl) {
    // Dynamic Failsafe Menu Icons Booster
    const iconMap = {
      'index.html': '🏠',
      'categories.html': '📂',
      'products.html': '🖥️',
      'pc-builder.html': '🛠️',
      'about.html': 'ℹ️',
      'contact.html': '📞'
    };
    mainNavUl.querySelectorAll('a').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      Object.keys(iconMap).forEach(page => {
        if (href.endsWith(page) && !a.innerText.includes(iconMap[page])) {
          a.innerText = `${iconMap[page]} ${a.innerText.trim()}`;
        }
      });
    });

    // Remove any existing login links or auth containers to prevent duplicate login buttons
    const existingLogins = mainNavUl.querySelectorAll('li.auth-dropdown-container, li.auth-login-link, a[href*="login"]');
    existingLogins.forEach(el => {
      const parentLi = el.tagName === 'LI' ? el : el.parentElement;
      if (parentLi && parentLi.tagName === 'LI') {
        parentLi.remove();
      }
    });

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        
        if (user.role && (user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'manager')) {
          const cartLink = document.querySelector('.cart-link');
          if (cartLink && cartLink.parentElement) {
            cartLink.parentElement.style.display = 'none';
          }
        }

        const li = document.createElement('li');
        li.className = 'auth-dropdown-container';
        li.style.position = 'relative';
        li.innerHTML = `
          <a href="#" class="auth-username" style="cursor: pointer;">Xin chào, ${user.fullName || user.fullname || user.username} ▼</a>
          <div class="auth-dropdown" style="display: none; position: absolute; right: 0; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 4px; padding: 10px; min-width: 150px; z-index: 1000;">
            <a href="profile.html" style="display: block; color: #333; padding: 8px; text-decoration: none; border-bottom: 1px solid #eee;">Tài khoản của tôi</a>
            <a href="profile.html" style="display: block; color: #333; padding: 8px; text-decoration: none; border-bottom: 1px solid #eee;">Đơn hàng</a>
            <a href="#" id="btn-logout-client" style="display: block; color: #d32f2f; padding: 8px; text-decoration: none;">Đăng xuất</a>
          </div>
        `;
        mainNavUl.appendChild(li);

        const authUsername = li.querySelector('.auth-username');
        const authDropdown = li.querySelector('.auth-dropdown');
        authUsername.addEventListener('click', (e) => {
          e.preventDefault();
          authDropdown.style.display = authDropdown.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
          if (!li.contains(e.target)) {
            authDropdown.style.display = 'none';
          }
        });

        document.getElementById('btn-logout-client').addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          window.location.href = '/index.html';
        });
      } catch (e) {
        console.error('Invalid user data in localStorage');
      }
    } else {
      const li = document.createElement('li');
      li.className = 'auth-login-link';
      li.innerHTML = '<a href="login.html">👤 Đăng nhập</a>';
      mainNavUl.appendChild(li);
    }
  }
});
