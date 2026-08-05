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

  // --- SEARCH BAR GLOBAL HANDLER & ACCENT REMOVER ---
  function removeAccents(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }
  window.removeAccents = removeAccents;

  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  if (searchBtn && searchInput) {
    const doSearch = () => {
      const q = searchInput.value.trim();
      if (q) {
        const pageName = window.location.pathname.split('/').pop() || 'index.html';
        if (pageName === 'products.html' || pageName === 'search.html') {
          const filterName = document.getElementById('filter-name');
          if (filterName) {
            filterName.value = q;
            if (typeof applyFilterSort === 'function') applyFilterSort();
            else if (typeof applyFilters === 'function') applyFilters();
          } else {
            window.location.href = `products.html?q=${encodeURIComponent(q)}`;
          }
        } else {
          window.location.href = `products.html?q=${encodeURIComponent(q)}`;
        }
      }
    };
    searchBtn.onclick = doSearch;
    searchInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        doSearch();
      }
    };
  }

  // --- AUTHENTICATION UI INJECTION ---
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const mainNavUl = document.querySelector('.main-nav ul');
  if (mainNavUl) {
    // Dynamic Failsafe Menu Items & Icons Booster
    if (!mainNavUl.querySelector('a[href*="pc-builder"]')) {
      const prodLi = mainNavUl.querySelector('a[href*="products"]')?.parentElement;
      const builderLi = document.createElement('li');
      builderLi.innerHTML = '<a href="pc-builder.html">Xây Dựng Cấu Hình</a>';
      if (prodLi) {
        prodLi.after(builderLi);
      } else {
        mainNavUl.appendChild(builderLi);
      }
    }


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
      li.innerHTML = '<a href="login.html">Đăng nhập</a>';
      mainNavUl.appendChild(li);
    }
  }
});

// ═══════════════════════════════════════════════════════════
// ADVANCED ANTI-DEVTOOLS & WEBSITE PROTECTION SHIELD
// ═══════════════════════════════════════════════════════════
(function initSecurity() {
  // 1. Disable right-click context menu (allow selection on input/textarea)
  document.addEventListener('contextmenu', function (e) {
    const targetTag = e.target ? e.target.tagName : '';
    if (targetTag !== 'INPUT' && targetTag !== 'TEXTAREA') {
      e.preventDefault();
      return false;
    }
  });

  // 2. Block Developer Tools Keyboard Shortcuts
  document.addEventListener('keydown', function (e) {
    // F12
    if (e.keyCode === 123 || e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K
    if (e.ctrlKey && e.shiftKey && (
      e.key === 'I' || e.key === 'i' ||
      e.key === 'J' || e.key === 'j' ||
      e.key === 'C' || e.key === 'c' ||
      e.key === 'K' || e.key === 'k'
    )) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Cmd+Option+I, Cmd+Option+J, Cmd+Option+C (Mac)
    if (e.metaKey && e.altKey && (
      e.key === 'I' || e.key === 'i' ||
      e.key === 'J' || e.key === 'j' ||
      e.key === 'C' || e.key === 'c'
    )) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U / Cmd+U (View Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S / Cmd+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  // 3. Infinite Debugger Loop (Freezes DevTools if opened via Menu or Opened First)
  function blockDebugger() {
    try {
      (function () {
        (function a(i) {
          if (('' + i / i).length !== 1 || i % 20 === 0) {
            (function () {}).constructor('debugger')();
          } else {
            (function () {}).constructor('debugger')();
          }
          a(++i);
        })(0);
      })();
    } catch (e) {}
  }
  setInterval(blockDebugger, 500);

  // 4. DevTools Detector (Replaces page with warning if DevTools panel is docked)
  function detectDevTools() {
    const widthDiff = window.outerWidth - window.innerWidth > 160;
    const heightDiff = window.outerHeight - window.innerHeight > 160;
    if (widthDiff || heightDiff) {
      if (document.body) {
        document.body.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; background:#0f172a; color:#fff; text-align:center; padding:2rem; margin:0;">
            <h1 style="color:#ef4444; font-size:2.5rem; margin-bottom:1rem;">🚫 CẢNH BÁO BẢO MẬT</h1>
            <p style="font-size:1.2rem; color:#cbd5e1; max-width:600px;">Trang web không cho phép sử dụng Công cụ nhà phát triển (DevTools). Vui lòng đóng bảng kiểm tra và tải lại trang.</p>
          </div>
        `;
      }
    }
  }
  window.addEventListener('resize', detectDevTools);
  setInterval(detectDevTools, 1000);

  // 5. Disable Console Outputs
  if (typeof console !== 'undefined') {
    try {
      console.log = function () {};
      console.warn = function () {};
      console.error = function () {};
      console.clear();
    } catch (e) {}
  }
})();


