// Admin category management
(function () {
  // Hàm lấy token từ localStorage
  function getToken() {
    return (
      localStorage.getItem("token") || sessionStorage.getItem("token") || ""
    );
  }

  // Hàm gọi API có kèm token
  function api(endpoint, options = {}) {
    const url =
      typeof getApiUrl === "function" ? getApiUrl(endpoint) : endpoint;
    const headers = Object.assign({}, options.headers || {});
    headers["Content-Type"] = "application/json";
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
    return fetch(url, Object.assign({}, options, { headers }));
  }

  let categories = [];
  let editingId = null;

  // Kiểm tra quyền admin
  function ensureAuth() {
    const token = getToken();
    if (!token) {
      window.location.href = "404.html";
      return false;
    }
    const role = (
      localStorage.getItem("userRole") ||
      sessionStorage.getItem("userRole") ||
      ""
    ).toLowerCase();
    if (role !== "admin") {
      window.location.href = "404.html";
      return false;
    }
    return true;
  }

  //Render danh mục lên sản phẩm  
  function renderProductTypes() {
    // map slect trên sort ds products
    const selectElement = document.getElementById("selectCatelogy");
    // map select trên form thêm/sửa sản phẩm
    const productCategorys = document.getElementById("productCategory");
    if (!selectElement || !categories) return;
    if (!productCategorys || !categories) return;
    // nếu không có danh mục thì ghi option này
    if (!categories.length) {
      selectElement.innerHTML ='<option value="">Chưa có danh mục nào</option>';
    }
    // nếu là slect sort ds products thì bể sung thêm option tất cả rồi cộng vs option trong db
    if(selectElement){
      selectElement.innerHTML ='<option value="">Tất cả danh mục</option>';
      const optionsHTML = categories.map((cate) => {
        return `<option value="${cate.id}">${cate.name}</option>`;
      })
      .join(""); // Nối các phần tử mảng thành 1 chuỗi HTML
      selectElement.innerHTML += optionsHTML;
    }
    // nếu là select trên form thêm/sửa sản phẩm thì chỉ cần render option trong db
    const optionsProductsHTML = categories.map((category) => {
      return `<option value="${category.id}">${category.name}</option>`;
    }).join("");
    productCategorys.innerHTML = optionsProductsHTML;
  }

  // Render danh sách danh mục giống như managemant-catagogy.js
  function renderCategories() {
    const categoryList = document.getElementById("category-list");
    if (!categoryList) return;

    categoryList.innerHTML = "";

    if (!categories.length) {
      categoryList.innerHTML =
        '<p style="padding:16px;">Chưa có danh mục nào.</p>';
      return;
    }

    // Render từng category 
    categories.forEach((category) => {
      const categoryItem = document.createElement("div");
      categoryItem.className = "category-item";
      categoryItem.setAttribute("data-id", category.id);

      categoryItem.innerHTML = `
				<p id="category-name">${category.name}</p>
				<div id="category-grid">
					<div id="category-description">
						<span id="category-description-title">Description :</span>
						<span id="category-description-text">${
              category.description || "Không có mô tả"
            }</span>
					</div>
					<div class="category-actions">
						<button class="btn btn-editcate" id="btn-edit-category" data-id="${
              category.id
            }">Sửa</button>
						<button class="btn btn-deletecate" id="btn-delete-category" data-id="${
              category.id
            }">Xóa</button>
					</div>
				</div>
			`;

      categoryList.appendChild(categoryItem);
    });

    // Thêm event listeners cho các nút Sửa và Xóa
    document.querySelectorAll(".btn-editcate").forEach((button) => {
      button.addEventListener("click", function () {
        const categoryId = parseInt(this.getAttribute("data-id"));
        const category = categories.find((c) => c.id === categoryId);
        if (category) {
          showForm(category);
        }
      });
    });

    document.querySelectorAll(".btn-deletecate").forEach((button) => {
      button.addEventListener("click", function () {
        const categoryId = parseInt(this.getAttribute("data-id"));
        deleteCategory(categoryId);
      });
    });
  }

  // Lấy danh sách danh mục từ API
  async function fetchCategories() {
    try {
      const res = await api("/categories");
      const data = await res.json();
      if (data.status !== "success")
        throw new Error(data.message || "Không thể tải danh mục");
      categories = data.categories || [];
      renderCategories();
	  renderProductTypes();
    } catch (err) {
      console.error(err);
      alert(err.message || "Không thể tải danh mục");
    }
  }

  // Hiển thị form thêm/sửa
  function showForm(category = null) {
    const listView = document.getElementById("category-list-view");
    const formView = document.getElementById("form-catagory");

    if (!listView || !formView) return;

    listView.style.display = "none";
    formView.style.display = "block";

    const btnAdd = document.getElementById("btn-add-category");
    if (btnAdd) btnAdd.style.display = "none";

    if (category) {
      // Chế độ sửa
      editingId = category.id;
      const formTitle = document.getElementById("catagory-form-title");
      if (formTitle) formTitle.textContent = "Sửa danh mục";
      document.getElementById("cate-name").value = category.name || "";
      document.getElementById("note").value = category.description || "";
    } else {
      // Chế độ thêm mới
      editingId = null;
      const formTitle = document.getElementById("catagory-form-title");
      if (formTitle) formTitle.textContent = "Thêm danh mục mới";
      document.getElementById("cate-name").value = "";
      document.getElementById("note").value = "";
    }
  }

  // Ẩn form, quay lại danh sách
  function hideForm() {
    const listView = document.getElementById("category-list-view");
    const formView = document.getElementById("form-catagory");
    const btnAdd = document.getElementById("btn-add-category");

    if (listView) listView.style.display = "block";
    if (formView) formView.style.display = "none";
    if (btnAdd) btnAdd.style.display = "block";

    editingId = null;
  }

  // Xử lý submit form
  async function handleSubmit() {
    const name = document.getElementById("cate-name").value.trim();
    const description = document.getElementById("note").value.trim();

    if (!name) {
      alert("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      if (editingId) {
        // Cập nhật
        const res = await api(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ name, description }),
        });
        const data = await res.json();
        if (data.status !== "success")
          throw new Error(data.message || "Không thể cập nhật");
        alert("Cập nhật danh mục thành công!");
      } else {
        // Tạo mới
        const res = await api("/categories", {
          method: "POST",
          body: JSON.stringify({ name, description }),
        });
        const data = await res.json();
        if (data.status !== "success")
          throw new Error(data.message || "Không thể tạo");
        alert("Tạo danh mục thành công!");
      }

      hideForm();
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra");
    }
  }

  // Xóa danh mục
  async function deleteCategory(id) {
    if (!confirm(`Bạn có chắc muốn xóa danh mục này?`)) return;

    try {
      const res = await api(`/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status !== "success")
        throw new Error(data.message || "Không thể xóa");
      alert("Xóa danh mục thành công!");
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra");
    }
  }

  // Khởi tạo khi trang load
  document.addEventListener("DOMContentLoaded", () => {
    if (!ensureAuth()) return;

    const categorySection = document.querySelector(
      '.main-section[data-section="category-management"]'
    );
    if (!categorySection) return;

    // Nút "Thêm danh mục"
    const btnAdd = document.getElementById("btn-add-category");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        showForm();
      });
    }

    // Nút "Quay lại"
    const btnBack = document.getElementById("btn-back-catalo");
    if (btnBack) {
      btnBack.addEventListener("click", () => {
        hideForm();
      });
    }

    // Nút "Lưu"
    const btnSave = document.getElementById("btn-save-catalo");
    if (btnSave) {
      btnSave.addEventListener("click", (e) => {
        e.preventDefault();
        handleSubmit();
      });
    }

    // Tải danh sách danh mục
    fetchCategories();
  });
})();
