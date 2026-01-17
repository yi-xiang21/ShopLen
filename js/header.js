document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector('header[data-inserted="true"]')) return;

  const headerHTML = `
    <header data-inserted="true" >
      <ul class="hero-header">
        <li><img src="img/Logo.png" alt="Logo" onclick="window.location.href='index.html'"></li>
        <div class="CatSleepingHeader">
            <lottie-player src="animation/SleepingCatHeader.json" background="transparent" speed="1" style="width: 250px; height: 250px;" loop autoplay>
            </lottie-player>
        </div> 
        <ul id="nav">
          <li><a href="index.html">Home</a></li>
          <li><a href="shop.html">Shop</a></li>
          <li><a href="workshop.html">Workshops</a></li>
          <li><a href="about.html">About</a></li>
          
          <li class="cart">
            <a href="cart.html" style="position: relative; display: inline-block;">
              <i class="cart bi bi-cart"></i>
              <span class="cart-count" id="cartCount">0</span>
            </a>
          </li>
          <li class="user-menu-li">
            <a href="#">
              <i class="bi bi-person"></i>
            </a>
            <ul class="user-dropdown">
              <li>
                <a class="go-admin" href="admin.html">
                  <i class="bi bi-shield-lock"></i> Admin
                </a>
              </li>
              <li>
                <a class="go-register" href="register.html">
                  <i class="bi bi-person-plus"></i> Sign up
                </a>
              </li>
              <li>
                <a class="go-login" href="login.html">
                  <i class="bi bi-box-arrow-in-right"></i> Log in
                </a>
              </li>
              <li>
                <a class="go-account" href="account.html">
                  <i class="bi bi-person-circle"></i> Account
                </a>
              </li>
              <li>
                <a class="go-logout" href="login.html">
                  <i class="bi bi-box-arrow-in-left"></i> Log out
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </ul>
    </header>
  `;

      

  // Chèn vào đầu body hoặc thay thế placeholder nếu có
  const placeholder =
    document.getElementById("header-placeholder") ||
    document.querySelector("[data-insert-header]");
  const headerEl = document.createElement("div");
  headerEl.innerHTML = headerHTML;
  if (placeholder) {
    placeholder.replaceWith(headerEl.firstElementChild);
  } else {
    document.body.insertAdjacentElement(
      "afterbegin",
      headerEl.firstElementChild
    );
  }


});

// Cập nhật số lượng giỏ hàng hiển thị
async function updateCartCount() {
    const cartCountEl = document.getElementById('cartCount');
    if (!cartCountEl) return;

  const showCount = (count) => {
    const safe = Number(count) || 0;
    cartCountEl.textContent = safe > 99 ? '99+' : safe;
    cartCountEl.style.display = 'flex';
  };

  // Kiểm tra token người dùng
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // Nếu chưa đăng nhập: đếm giỏ local
  if (!token) {
    const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const localTotal = localCart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    showCount(localTotal);
    return;
  }

  // Đã đăng nhập: luôn lấy số lượng từ API, nếu lỗi/missing => 0
  try {
    const apiUrl = typeof getApiUrl === 'function'
      ? getApiUrl('/users/me/cart-quantity')
      : '/users/me/cart-quantity';

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const count = Number(data?.quantity);
      const serverCount = Number.isFinite(count) ? count : 0;
      console.log('Số lượng giỏ hàng từ server:', serverCount);
      showCount(serverCount);
    } else {
      showCount(0);
    }
  } catch (err) {
    console.error('Lỗi khi cập nhật số lượng giỏ hàng:', err);
    showCount(0);
  }
}

// Gọi hàm cập nhật số lượng giỏ hàng khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    // Đợi một chút để đảm bảo header đã render xong
    setTimeout(() => {
        updateCartCount();
    }, 100);
});

// Export hàm để các trang khác có thể gọi sau khi thêm/xóa sản phẩm
window.updateCartCount = updateCartCount;

// Lắng nghe thay đổi storage (thêm/xóa giỏ ở tab khác)
window.addEventListener('storage', (e) => {
  if (e.key === 'cart') {
    updateCartCount();
  }
});

