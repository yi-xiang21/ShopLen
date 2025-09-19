//an hien tiem kiem
document.addEventListener('click', function (e) {
  const searchLi = document.querySelector('.search-li');
  const toggle = document.getElementById('toggle-search');
  if (!searchLi.contains(e.target)) {
    toggle.checked = false;
  }
});

//hien thi menu acount khi dang nhap
document.addEventListener('DOMContentLoaded', function() {
  // Ẩn/hiện mục "Tài khoản" dựa vào trạng thái đăng nhập
  const accountLi = document.querySelector('.go-account').parentElement;
  const logoutLi = document.querySelector('.go-logout').parentElement;
  const logginli = document.querySelector('.go-login').parentElement;
  const registerli = document.querySelector('.go-register').parentElement;
  if (localStorage.getItem('isLoggedIn') === 'true') {
    accountLi.style.display = 'block';
    logoutLi.style.display = 'block';
    logginli.style.display = 'none';
    registerli.style.display = 'none';
  } else {
    accountLi.style.display = 'none';
    logoutLi.style.display = 'none';
    logginli.style.display = 'block';
    registerli.style.display = 'block';
  }
});

//khi logout xoa localStorage
document.addEventListener('DOMContentLoaded', function() {
  // Xử lý sự kiện click vào nút "Log out"
  const logoutBtn = document.querySelector('.go-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Xóa thông tin đăng nhập khỏi localStorage
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      alert('Đăng xuất thành công!');
      window.location.href = 'index.html'; // Chuyển hướng về trang chủ
    });
  }
});

//an hien mat khau 
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
///ktra dang nhap
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
        const res = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        console.log(data);
        if (data.status === 'success') {
          const storage = remember ? localStorage : sessionStorage;
          storage.setItem('isLoggedIn', 'true');
          storage.setItem('userRole', data.role || 'customer');
          storage.setItem('userEmail', data.email || username);

          alert('Đăng nhập thành cônggggg!');
          window.location.href = 'index.html';
        } else {
          alert(data.message || 'Đăng nhập thất bại!');
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ!');
        
      }
    });
  }
  //ktra dang ky
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

      try {
        const res = await fetch('http://localhost:3000/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, username, password, email, phone, address })
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


//an hien dropdown user menu
document.addEventListener('DOMContentLoaded', function() {
  // ...existing code...

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


// nut trai phai trong shop
const productsItem = document.querySelector('.products-item');
const btnLeft = document.querySelector('.slider-btn.left');
const btnRight = document.querySelector('.slider-btn.right');
if (btnLeft && productsItem) {
  btnLeft.onclick = () => {
    productsItem.scrollBy({ left: -productsItem.offsetWidth * 0.5, behavior: 'smooth' });
  };
}
if (btnRight && productsItem) {
  btnRight.onclick = () => {
    productsItem.scrollBy({ left: productsItem.offsetWidth * 0.5, behavior: 'smooth' });
  };
}

// duong dan breadcrumb
const breadcrumb = document.getElementById('breadcrumb');
if (breadcrumb) {
  const path = window.location.pathname.split("/").pop();
  let pathDisplay = path.replace(".html", "").replace(/-/g, " ");
  if (path === "index.html" || path === "") {
      breadcrumb.innerHTML = `<a href="index.html">Home</a>`;
  } else {
      breadcrumb.innerHTML = `
          <a href="index.html">Home</a>
          <span class="arrow"> > </span>
          <a href="${path}">${capitalize(pathDisplay)}</a>
      `;
  }
  breadcrumb.style.display = 'block';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
});

