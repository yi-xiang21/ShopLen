// Hàm cập nhật UI menu dựa vào trạng thái đăng nhập
function updateMenuVisibility() {
  const accountLi = document.querySelector('.go-account')?.parentElement;
  const logoutLi = document.querySelector('.go-logout')?.parentElement;
  const logginli = document.querySelector('.go-login')?.parentElement;
  const registerli = document.querySelector('.go-register')?.parentElement;
  const adminLi = document.querySelector('.go-admin')?.parentElement;

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
  const role = (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || '').toLowerCase();

  if (isLoggedIn) {
    if (accountLi) accountLi.style.display = 'block';
    if (logoutLi) logoutLi.style.display = 'block';
    if (logginli) logginli.style.display = 'none';
    if (registerli) registerli.style.display = 'none';
    // Chỉ admin mới thấy nút Admin
    if (adminLi) adminLi.style.display = role === 'admin' ? 'block' : 'none';
    if (accountLi) accountLi.style.display = role === 'admin' ? 'none' : 'block';
  } else {
    if (accountLi) accountLi.style.display = 'none';
    if (logoutLi) logoutLi.style.display = 'none';
    if (logginli) logginli.style.display = 'block';
    if (registerli) registerli.style.display = 'block';
    if (adminLi) adminLi.style.display = 'none';
  }
}

// Hiển thị menu account khi đăng nhập
document.addEventListener('DOMContentLoaded', function() {
  updateMenuVisibility();
});

// Khi logout xóa localStorage
document.addEventListener('DOMContentLoaded', function() {
  // Xử lý sự kiện click vào nút "Log out"
  const logoutBtn = document.querySelector('.go-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Xóa thông tin đăng nhập khỏi localStorage và sessionStorage
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('token');

      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('token');
      
      // Cập nhật menu
      updateMenuVisibility();
      alert('Đăng xuất thành công!');
      window.location.href = 'index.html';
    });
  }
});

// Ẩn hiện mật khẩu
document.addEventListener('DOMContentLoaded', function() {
  // Ẩn/hiện mật khẩu cho tất cả icon mắt
  document.querySelectorAll('.input-eye').forEach(function(eyeIcon) {
    eyeIcon.addEventListener('click', function() {
      const pwdInput = this.parentElement.querySelector('input[type="password"], input[type="text"]');
      if (pwdInput) {
        if (pwdInput.type === 'password') {
          pwdInput.type = 'text';
          this.innerHTML = '<i class="bi bi-eye"></i>';
        } else {
          pwdInput.type = "password";
          this.innerHTML = '<i class="bi bi-eye-slash"></i>';
        }
      }
    });
  });
});

// Kiểm tra đăng nhập
document.addEventListener('DOMContentLoaded', function() {
  // Xử lý submit form đăng nhập
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const username = loginForm.querySelector('input[type="text"]').value.trim();
      const password = loginForm.querySelector('input[type="password"], input[type="text"][placeholder="Password"]').value;
      const remember = loginForm.querySelector('input[type="checkbox"]').checked;

      try {
        const apiUrl = getApiUrl('/auth/login');
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        console.log(data);
        if (data.status === 'success') {
          const storage = remember ? localStorage : sessionStorage;
          storage.setItem('isLoggedIn', 'true');

          if (data.user) {
            const displayName = data.user.name || `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim();
            const role = data.user.role || data.role || 'customer';
            const emailValue = data.user.email || data.email || username;
            storage.setItem('userRole', role);
            storage.setItem('userEmail', emailValue);
            storage.setItem('userId', data.user.id);
            if (displayName) storage.setItem('userName', displayName);
          } else {
            storage.setItem('userRole', data.role || 'customer');
            storage.setItem('userEmail', data.email || username);
          }

          if (data.token) {
            storage.setItem('token', data.token);
          }

          // Logic gộp giỏ hàng cho user khi đăng nhập
          const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
          
          if (localCart.length > 0) {
             try {
                // Biến đổi cart localStorage thành dạng mà API mergeCart cần
                const itemsToMerge = localCart.map(item => ({
                    ma_bien_the: item.ma_bien_the || item.variant?.id, // Tùy cách bạn lưu object
                    so_luong: item.quantity || item.so_luong
                })).filter(i => i.ma_bien_the); // Lọc bỏ item lỗi
                if (itemsToMerge.length > 0) {
                    const mergeApiUrl = typeof getApiUrl === 'function' ? getApiUrl('/cart/merge') : '/cart/merge';
                    
                    await fetch(mergeApiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + data.token // Dùng token mới nhận được
                        },
                        body: JSON.stringify({ cartItems: itemsToMerge })
                    });
                    
                    // Xóa giỏ hàng tạm sau khi gộp giỏ hàng
                    localStorage.removeItem('cart'); 
                }
             } catch (err) {
                 console.error("Lỗi gộp giỏ hàng:", err);
             }
          }

          // Cập nhật menu ngay lập tức
          updateMenuVisibility();
          
          alert('Đăng nhập thành công!');
          window.location.href = 'index.html';
        } else {
          alert(data.message || 'Đăng nhập thất bại!');
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ!');
        
      }
    });
  }

  // Kiểm tra đăng ký
  const registerForm = document.querySelector('.register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const firstName = registerForm.elements['firstName'].value.trim();
      const lastName = registerForm.elements['lastName'].value.trim();
      const name = firstName + ' ' + lastName;
      const username = registerForm.elements['username'].value.trim();
      const email = registerForm.elements['email'].value.trim();
      const phone = registerForm.elements['phone'].value.trim();
      const password = registerForm.querySelector('input[name="password"]').value;
      const confirmPassword = registerForm.querySelector('input[name="confirmPassword"]').value;
      // Kiểm tra mật khẩu và xác nhận mật khẩu
      if (password !== confirmPassword) {
        alert('Mật khẩu và xác nhận mật khẩu không khớp!');
        registerForm.querySelector('input[name="confirmPassword"]').value = '';
        registerForm.querySelector('input[name="password"]').value = '';
        return;
      }
      const address = '';
      const city = '';

      try {
        const apiUrl = getApiUrl('/auth/register');
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, firstName, lastName, username, password, email, phone, address, city })
        });
        const data = await res.json();
        alert(data.message);
        if (data.status === 'success') {
          window.location.href = 'login.html';
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ!');
      }
    });
  }
});

// Ẩn hiện dropdown user menu
document.addEventListener('DOMContentLoaded', function() {

  // Dropdown user menu
  const userMenuLi = document.querySelector('.user-menu-li');
  if (userMenuLi) {
    userMenuLi.addEventListener('click', function(e) {
      e.stopPropagation();
      userMenuLi.classList.toggle('active');
    });
    // Ẩn menu khi click ra ngoài
    document.addEventListener('click', function() {
      userMenuLi.classList.remove('active');
    });
  }

  // Điều hướng các nút
  document.querySelectorAll('.go-register').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'register.html';
    });
  });

  document.querySelectorAll('.go-login').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'login.html';
    });
  });

  document.querySelectorAll('.go-account').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'account.html';
    });
  });
  
  document.querySelectorAll('.go-admin').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'admin.html';
    });
  });
});

