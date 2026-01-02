// Lấy thông tin tài khoản User
(function () {
  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  }

  function api(endpoint, options = {}) {
    const baseUrl = typeof getApiUrl === 'function'
      ? getApiUrl(endpoint)
      : (API_CONFIG?.BASE_URL || '') + endpoint;

    const headers = Object.assign(
      { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      options.headers || {}
    );

    return fetch(baseUrl, Object.assign({}, options, { headers }));
  }

  // Kiểm tra trạng thái đăng nhập
  function requireAuth(roleCheck = false) {
    const token = getToken();
    if (!token) {
      window.location.href = 'login.html';
      return false;
    }
    if (roleCheck) {
      const role = (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || '').toLowerCase();
      if (roleCheck && role !== roleCheck) {
        window.location.href = '404.html';
        return false;
      }
    }
    return true;
  }

  // Fetch thông tin user
  function fillProfile(user) {
    const form = document.querySelector('.account-form');
    if (!form) return;
    form.querySelector('[name="firstName"]').value = user.firstName || '';
    form.querySelector('[name="lastName"]').value = user.lastName || '';
    form.querySelector('[name="email"]').value = user.email || '';
    form.querySelector('[name="phone"]').value = user.phone || '';
    form.querySelector('[name="address"]').value = user.address || '';
    form.querySelector('[name="city"]').value = user.city || '';

    const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    document.querySelectorAll('.sidebar-name, .main-name').forEach(el => el.textContent = displayName || 'Your name');
    document.querySelectorAll('.sidebar-avatar, .main-avatar').forEach(el => {
      el.textContent = displayName ? displayName.charAt(0).toUpperCase() : '';
    });
  }

  // Kiểm tra hạn token
  async function loadProfile() {
    try {
      const res = await api('/users/me');
      if (res.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = 'login.html';
        return;
      }
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'Không thể tải thông tin tài khoản');
      fillProfile(data.user || {});
    } catch (err) {
      console.error(err);
      alert(err.message || 'Không thể tải thông tin tài khoản');
    }
  }

  // Lưu profile người dùng
  async function saveProfile(payload) {
    const res = await api('/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (res.status === 401) {
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      window.location.href = 'login.html';
      return;
    }
    const data = await res.json();
    if (data.status !== 'success') throw new Error(data.message || 'Cập nhật thất bại');
    return data;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.location.pathname.toLowerCase().includes('account.html')) return;
    if (!requireAuth()) return;

    loadProfile();

    const form = document.querySelector('.account-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        address: form.address.value.trim(),
        city: form.city.value.trim()
      };
      try {
        await saveProfile(payload);
        alert('Lưu thông tin thành công!');
        // Update name/email
        const fullName = `${payload.firstName} ${payload.lastName}`.trim();
        if (fullName) {
          localStorage.setItem('userName', fullName);
          sessionStorage.setItem('userName', fullName);
        }
        if (payload.email) {
          localStorage.setItem('userEmail', payload.email);
          sessionStorage.setItem('userEmail', payload.email);
        }
        loadProfile();
      } catch (err) {
        alert(err.message || 'Không thể lưu thông tin');
      }
    });
  });
})();

