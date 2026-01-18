// Lấy thông tin tài khoản User
(function () {
  function getToken() {
    return (
      localStorage.getItem("token") || sessionStorage.getItem("token") || ""
    );
  }

  function api(endpoint, options = {}) {
    const baseUrl =
      typeof getApiUrl === "function"
        ? getApiUrl(endpoint)
        : (API_CONFIG?.BASE_URL || "") + endpoint;

    const headers = Object.assign(
      {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      options.headers || {},
    );

    return fetch(baseUrl, Object.assign({}, options, { headers }));
  }

  // Kiểm tra trạng thái đăng nhập
  function requireAuth(roleCheck = false) {
    const token = getToken();
    if (!token) {
      window.location.href = "login.html";
      return false;
    }
    if (roleCheck) {
      const role = (
        localStorage.getItem("userRole") ||
        sessionStorage.getItem("userRole") ||
        ""
      ).toLowerCase();
      if (roleCheck && role !== roleCheck) {
        window.location.href = "404.html";
        return false;
      }
    }
    return true;
  }

  // Fetch thông tin user
  function fillProfile(user) {
    const form = document.querySelector(".account-form");
    if (!form) return;
    form.querySelector('[name="firstName"]').value = user.firstName || "";
    form.querySelector('[name="lastName"]').value = user.lastName || "";
    form.querySelector('[name="email"]').value = user.email || "";
    form.querySelector('[name="phone"]').value = user.phone || "";
    form.querySelector('[name="address"]').value = user.address || "";
    form.querySelector('[name="city"]').value = user.city || "";

    const displayName =
      user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();
    document
      .querySelectorAll(".sidebar-name, .main-name")
      .forEach((el) => (el.textContent = displayName || "Your name"));
    
    // Hiển thị avatar nếu có
    const preview = document.getElementById("preview");
    if (preview && user.avatarUrl) {
      const baseUrl = typeof getApiUrl === 'function' ? getApiUrl('').replace('/api', '') : (API_CONFIG?.BASE_URL || '').replace('/api', '');
      preview.src = baseUrl + user.avatarUrl;
    }
  }

  // Kiểm tra hạn token
  async function loadProfile() {
    try {
      const res = await api("/users/me");
      if (res.status === 401) {
        showWarning(
          "Phiên hết hạn",
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        );
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
        return;
      }
      const data = await res.json();
      if (data.status !== "success")
        throw new Error(data.message || "Không thể tải thông tin tài khoản");
      fillProfile(data.user || {});
    } catch (err) {
      showError(
        "Lỗi tải dữ liệu",
        err.message || "Không thể tải thông tin tài khoản",
      );
    }
  }

  // Lưu profile người dùng
  async function saveProfile(payload) {
    const res = await api("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      showWarning(
        "Phiên hết hạn",
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      );
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
      return;
    }
    const data = await res.json();
    if (data.status !== "success")
      throw new Error(data.message || "Cập nhật thất bại");
    return data;
  }

  // ========== AVATAR UPLOAD FUNCTIONS ==========
  function initAvatarUpload() {
    const avatarWrapper = document.querySelector(".avatar-wrapper");
    const fileInput = document.getElementById("fileInput");
    const preview = document.getElementById("preview");
    const cropModal = document.getElementById("cropModal");
    const cropImage = document.getElementById("cropImage");
    const saveCropBtn = document.getElementById("saveCropBtn");
    const cancelCropBtn = document.getElementById("cancelCrop");
    const closeCropModal = document.getElementById("closeCropModal");
    
    let cropper = null;

    // Click avatar để chọn file
    avatarWrapper.onclick = () => fileInput.click();

    // Xử lý khi chọn file
    fileInput.onchange = (e) => handleFileSelect(e.target.files[0]);

    // Drag & drop
    avatarWrapper.ondragover = (e) => e.preventDefault();
    avatarWrapper.ondrop = (e) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files[0]);
    };

    // Đóng modal
    cancelCropBtn.onclick = () => closeCropModalHandler();
    closeCropModal.onclick = () => closeCropModalHandler();

    // Lưu avatar
    saveCropBtn.onclick = () => handleSaveAvatar();

    // ===== Handle File Select =====
    function handleFileSelect(file) {
      if (!file) return;

      if (!file.type.match(/image.*/)) {
        showError("Lỗi định dạng", "Vui lòng chọn file ảnh hợp lệ");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        cropImage.src = reader.result;
        openCropModalHandler();
      };
      reader.readAsDataURL(file);
    }

    // ===== Open Crop Modal =====
    function openCropModalHandler() {
      cropModal.style.display = "flex";
      
      if (cropper) {
        cropper.destroy();
      }

      waitForCropper(() => {
        try {
          cropper = new Cropper(cropImage, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 0.9,
            responsive: true,
            background: true,
            modal: true,
            guides: true,
            center: true,
            highlight: true,
            cropBoxResizable: true,
            cropBoxMovable: true,
          });
          console.log('Cropper initialized');
        } catch (err) {
          console.error('Cropper error:', err);
          showError("Lỗi", "Không thể khởi tạo công cụ crop ảnh");
          closeCropModalHandler();
        }
      });
    }

    // ===== Wait For Cropper Library =====
    function waitForCropper(callback, maxAttempts = 50) {
      let attempts = 0;
      const checkCropper = setInterval(() => {
        attempts++;
        if (typeof Cropper !== 'undefined') {
          clearInterval(checkCropper);
          callback();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkCropper);
          showError("Lỗi", "Thư viện Cropper không thể load");
          closeCropModalHandler();
        }
      }, 100);
    }

    // ===== Close Crop Modal =====
    function closeCropModalHandler() {
      cropModal.style.display = "none";
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
      fileInput.value = "";
    }

    // ===== Save Avatar =====
    async function handleSaveAvatar() {
      if (!cropper) {
        showWarning("Chưa có ảnh", "Vui lòng chọn ảnh trước");
        return;
      }

      const loading = showLoading("Đang tải ảnh lên...", "Vui lòng đợi");

      try {
        const canvas = cropper.getCroppedCanvas({
          width: 300,
          height: 300,
          imageSmoothingQuality: 'high'
        });

        canvas.toBlob(async (blob) => {
          if (!blob) {
            loading.close();
            showError("Lỗi", "Không thể xử lý ảnh");
            return;
          }

          const success = await uploadAvatarToServer(blob);
          loading.close();

          if (success) {
            showSuccess("Thành công!", "Ảnh đại diện đã được cập nhật");
            closeCropModalHandler();
            loadProfile();
          }
        }, 'image/jpeg', 0.9);
      } catch (err) {
        loading.close();
        showError("Lỗi", err.message || "Không thể tải ảnh lên");
        console.error('Upload error:', err);
      }
    }

    // ===== Upload To Server =====
    async function uploadAvatarToServer(blob) {
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');

      const token = getToken();
      const apiUrl = typeof getApiUrl === 'function' 
        ? getApiUrl('/users/me/avatar') 
        : (API_CONFIG?.BASE_URL || '') + '/users/me/avatar';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        if (data.avatarUrl) {
          const baseUrl = typeof getApiUrl === 'function' 
            ? getApiUrl('').replace('/api', '') 
            : (API_CONFIG?.BASE_URL || '').replace('/api', '');
          preview.src = baseUrl + data.avatarUrl;
        }
        return true;
      } else {
        showError("Lỗi upload", data.message || "Không thể tải ảnh lên");
        return false;
      }
    }
  }

  // ========== PROFILE FORM FUNCTIONS ==========
  function initProfileForm() {
    const form = document.querySelector(".account-form");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      const payload = {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        address: form.address.value.trim(),
        city: form.city.value.trim(),
      };

      try {
        const loading = showLoading("Đang lưu...", "Vui lòng đợi");
        await saveProfile(payload);
        loading.close();
        
        showSuccess("Thành công!", "Thông tin tài khoản đã được cập nhật");
        
        // Update localStorage
        updateLocalStorage(payload);
        
        loadProfile();
      } catch (err) {
        showError("Lỗi lưu dữ liệu", err.message || "Không thể lưu thông tin");
      }
    });
  }

  // ===== Update LocalStorage =====
  function updateLocalStorage(payload) {
    const fullName = `${payload.firstName} ${payload.lastName}`.trim();
    if (fullName) {
      localStorage.setItem("userName", fullName);
      sessionStorage.setItem("userName", fullName);
    }
    if (payload.email) {
      localStorage.setItem("userEmail", payload.email);
      sessionStorage.setItem("userEmail", payload.email);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.location.pathname.toLowerCase().includes("account.html"))
      return;
    if (!requireAuth()) return;

    loadProfile();
    initAvatarUpload();
    initProfileForm();
  });

  
})(); 
