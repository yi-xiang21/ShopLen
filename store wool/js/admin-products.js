// Admin product management
(function () {
  // Hàm lấy token từ localStorage hoặc sessionStorage (ưu tiên local)
  function getToken() {
    return (
      localStorage.getItem("token") || sessionStorage.getItem("token") || ""
    );
  }

  // Hàm gọi API có kèm token + tự động thêm Content-Type nếu không phải FormData
  function api(endpoint, options = {}) {
    const url =
      typeof getApiUrl === "function" ? getApiUrl(endpoint) : endpoint;
    const headers = Object.assign({}, options.headers || {});
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
    return fetch(url, Object.assign({}, options, { headers }));
  }

  let products = [];
  let editingId = null;

  // Kiểm tra quyền admin: nếu chưa đăng nhập / không phải admin => đá về login/home
  function ensureAuth() {
    const token = getToken();
    if (!token) {
      alert("Vui lòng đăng nhập để truy cập trang quản trị.");
      window.location.href = "login.html";
      return false;
    }
    const role = (
      localStorage.getItem("userRole") ||
      sessionStorage.getItem("userRole") ||
      ""
    ).toLowerCase();
    if (role !== "admin") {
      alert("Bạn không có quyền admin.");
      window.location.href = "index.html";
      return false;
    }
    return true;
  }

  // Định dạng giá tiền VND
  function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);
  }

  // Render các thẻ sản phẩm dạng lưới trong Admin
  function renderCards() {
    const container = document.getElementById("grid-item");
    if (!container) return;
    if (!products.length) {
      container.innerHTML =
        '<p style="padding:16px;">Chưa có sản phẩm nào.</p>';
      return;
    }

    // Tạo giao diện từng card sản phẩm
    // Lấy hình ảnh từ biến thể đầu tiên (nếu có), nếu không thì dùng default
    container.innerHTML = products
      .map((product) => {
        let imageUrl = "img/default.jpg";
        if (
          product.variants &&
          Array.isArray(product.variants) &&
          product.variants.length > 0
        ) {
          const firstVariant = product.variants[0];
          if (
            firstVariant.images &&
            Array.isArray(firstVariant.images) &&
            firstVariant.images.length > 0
          ) {
            imageUrl =
              firstVariant.images[0].imageUrl ||
              firstVariant.images[0] ||
              imageUrl;
          } else if (firstVariant.imageUrl) {
            imageUrl = firstVariant.imageUrl;
          }
        } else if (product.imageUrl) {
          imageUrl = product.imageUrl; // Fallback nếu vẫn có imageUrl ở product level
        }

        return `
				<div class="card-item">
					<img src="${imageUrl}" alt="${product.name}">
					<h3 class="item-name">${product.name}</h3>
					<p class="item-category">${product.categoryName || ""}</p>
					<p class="item-price">${formatCurrency(product.price)}</p>
					<div class="card-actions">
						<button class="btn btn-edit" data-id="${product.id}">Edit</button>
						<button class="btn btn-delete-product" data-id="${product.id}">Delete</button>
					</div>
				</div>
			`;
      })
      .join("");
  }

  // Lấy danh sách sản phẩm từ API để admin quản lý
  async function fetchProducts(keyword = "", catId = "") {
    try {
      // Xây dựng URL với query params
      let url =
        typeof getApiUrl === "function" ? getApiUrl("/products") : "/products";
      const params = new URLSearchParams();

      if (keyword) params.append("search", keyword);
      if (catId) params.append("categoryId", catId);

      // Nếu có tham số thì nối vào URL
      if (params.toString()) {
        url += "?" + params.toString();
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== "success")
        throw new Error(data.message || "Không thể tải sản phẩm");
      products = data.products || [];
      renderCards();
    } catch (err) {
      console.error(err);
      alert(err.message || "Không thể tải sản phẩm");
    }
  }

  let variantCounter = 0;

  // Thêm biến thể sản phẩm (hình ảnh chỉ lưu trong biến thể)
  function addVariant(variant = null) {
    const container = document.getElementById("variantContainer");
    if (!container) return;
    const variantId = variantCounter++;
    const variantDiv = document.createElement("div");
    variantDiv.className = "variant-item";
    variantDiv.dataset.variantId = variantId;

    // Xử lý hình ảnh: array hoặc string
    const images = variant
      ? Array.isArray(variant.images)
        ? variant.images
        : variant.imageUrl
        ? [variant.imageUrl]
        : []
      : [];

    variantDiv.innerHTML = `
			
			<div class="variant-fields">
                <label>Màu:</label>
                <input type="text" class="variantColor" placeholder="red" value="${
                  variant ? variant.color || "" : ""
                }">

                <label>Kích cỡ:</label>
                <input type="text" class="variantSize" placeholder="100gr" value="${
                  variant ? variant.size || "" : ""
                }">

                <label>Chất liệu:</label>
                <input type="text" class="variantMaterial" placeholder="Cotton" value="${
                  variant ? variant.material || "" : ""
                }">

                <label>Hình ảnh:</label>
                <div class="variant-images-list" ">
                  <!-- Hình ảnh sẽ được thêm vào đây -->
                </div>
                <button type="button" class="btn btn-add-variant-image">+ Thêm hình</button>
                <label>Giá thêm :</label>
                <input type="number" class="variantPriceExtra" step="0.01" value="${
                  variant
                    ? typeof variant.extraPrice !== "undefined"
                      ? variant.extraPrice
                      : typeof variant.priceExtra !== "undefined"
                      ? variant.priceExtra
                      : 0
                    : 0
                }">

                <label>Tồn kho:</label>
                <input type="number" class="variantStock" step="1" value="${
                  variant ? variant.stock || 0 : 0
                }">

                <div class="variant-actions">
                    <button type="button" class="btn btn-remove-variant">Remove Variant</button>
                </div>
            </div>
		`;
    container.appendChild(variantDiv);

    // Khởi tạo danh sách hình ảnh cho biến thể
    const imagesList = variantDiv.querySelector(".variant-images-list");
    function createVariantImageRow(imageUrl = "", removable = true) {
      const row = document.createElement("div");
      row.style.cssText =
        "display: flex; align-items: center; gap: 10px; margin-bottom: 5px;";
      if (removable) {
        row.innerHTML = `
					<input type="file" class="variant-image-input" accept="image/*">
					${
            imageUrl
              ? `<img src="${imageUrl}" style="max-width: 80px; max-height: 80px;" class="variant-image-preview">`
              : ""
          }
					<input type="hidden" class="variant-image-url" value="${imageUrl || ""}">
					<button type="button" class="btn-remove-variant-image" style="background: #dc3545; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">Xóa</button>
				`;
        row
          .querySelector(".btn-remove-variant-image")
          .addEventListener("click", () => row.remove());
      } else {
        row.innerHTML = `
					<input type="file" class="variant-image-input" accept="image/*">
					${
            imageUrl
              ? `<img src="${imageUrl}" style="max-width: 80px; max-height: 80px;" class="variant-image-preview">`
              : ""
          }
					<input type="hidden" class="variant-image-url" value="${imageUrl || ""}">
				`;
      }

      // Preview khi chọn file
      const fileInput = row.querySelector(".variant-image-input");
      const preview = row.querySelector(".variant-image-preview");
      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file) {
            if (!preview) {
              const img = document.createElement("img");
              img.className = "variant-image-preview";
              img.style.cssText = "max-width: 80px; max-height: 80px;";
              fileInput.parentElement.insertBefore(img, fileInput.nextSibling);
              img.src = URL.createObjectURL(file);
            } else {
              preview.src = URL.createObjectURL(file);
            }
          }
        });
      }
      return row;
    }

    // Khởi tạo hình ảnh
    if (images.length > 0) {
      images.forEach((img, idx) => {
        const imgUrl =
          typeof img === "string" ? img : img.imageUrl || img.imagePath || "";
        imagesList.appendChild(createVariantImageRow(imgUrl, idx > 0));
      });
    } else {
      imagesList.appendChild(createVariantImageRow("", false));
    }

    // Nút thêm hình ảnh
    const btnAddImage = variantDiv.querySelector(".btn-add-variant-image");
    if (btnAddImage) {
      btnAddImage.addEventListener("click", () => {
        imagesList.appendChild(createVariantImageRow("", true));
      });
    }

    // Xóa biến thể
    const removeBtn = variantDiv.querySelector(".btn-remove-variant");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        variantDiv.remove();
      });
    }
  }

  function showForm(product) {
    const listView = document.getElementById("product-list-view");
    const formView = document.getElementById("add-product-view");
    const selectType = document.getElementById("selecttype");
    const btnAdd = document.getElementById("btn-add");
    const form = document.getElementById("productForm");
    if (!form) return;

    // Nếu đang edit, hiện form trực tiếp
    if (product) {
      editingId = product.id;
      form.reset();
      document.getElementById("productId").value = editingId || "";

      // Xóa tất cả biến thể cũ
      const variantContainer = document.getElementById("variantContainer");
      if (variantContainer) variantContainer.innerHTML = "";
      variantCounter = 0;

      // Điền thông tin sản phẩm
      form.productName.value = product.name || "";
      form.productCategory.value = product.categoryId || "";
      form.productPrice.value = product.price || "";
      form.productDescription.value = product.description || "";
      form.inputType.value = product.type || "";

      // Load biến thể nếu có (hình ảnh trong biến thể)
      if (
        product.variants &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
      ) {
        product.variants.forEach((v) => {
          // Xử lý hình ảnh: có thể là array hoặc string
          const variantImages = v.images || (v.imageUrl ? [v.imageUrl] : []);
          addVariant({
            color: v.color,
            size: v.size,
            material: v.material,
            extraPrice: v.extraPrice,
            images: variantImages,
            stock: v.stock,
          });
        });
      }

      listView.style.display = "none";
      formView.style.display = "block";
      form.style.display = "block";
      selectType.style.display = "none";
      btnAdd.style.display = "none";
    } else {
      // Nếu thêm mới, hiện form chọn loại sản phẩm
      editingId = null;
      form.reset();
      document.getElementById("productId").value = "";

      // Xóa tất cả biến thể cũ
      const variantContainer = document.getElementById("variantContainer");
      if (variantContainer) variantContainer.innerHTML = "";
      variantCounter = 0;

      listView.style.display = "none";
      selectType.style.display = "block";
      formView.style.display = "none";
      form.style.display = "none";
      btnAdd.style.display = "none";
    }
  }

  function hideForm() {
    const listView = document.getElementById("product-list-view");
    const formView = document.getElementById("add-product-view");
    const selectType = document.getElementById("selecttype");
    const btnAdd = document.getElementById("btn-add");
    if (listView) listView.style.display = "block";
    if (formView) formView.style.display = "none";
    if (selectType) selectType.style.display = "none";
    if (btnAdd) btnAdd.style.display = "inline-block";
    editingId = null;
  }

  function bindEvents() {
    const btnAdd = document.getElementById("btn-add");
    const btnBack = document.getElementById("btnBackToList");
    const btnBackToSelect = document.getElementById("productBackToSelect");
    const btnSelectType = document.getElementById("btnSelectType");
    const form = document.getElementById("productForm");
    const selectType = document.getElementById("selecttype");
    const productType = document.getElementById("productType");

    if (btnAdd) btnAdd.addEventListener("click", () => showForm());
    if (btnBack) btnBack.addEventListener("click", hideForm);

    // Nút quay lại từ form về chọn loại
    if (btnBackToSelect) {
      btnBackToSelect.addEventListener("click", () => {
        const formView = document.getElementById("add-product-view");
        if (formView) formView.style.display = "none";
        if (form) form.style.display = "none";
        if (selectType) selectType.style.display = "block";
      });
    }

    // Nút chọn loại sản phẩm
    if (btnSelectType && productType) {
      btnSelectType.addEventListener("click", () => {
        const type = productType.value;
        const textType = productType.options[productType.selectedIndex].text;
        const formView = document.getElementById("add-product-view");
        const inputType = document.getElementById("inputType");

        if (type === "0" || type === "1") {
          // Len hoặc Công cụ
          if (inputType) inputType.value = textType;
          if (selectType) selectType.style.display = "none";
          if (formView) formView.style.display = "block";
          if (form) form.style.display = "block";
        } else if (type === "2") {
          alert("Workshop chưa được triển khai");
        }
      });
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          // Tạo FormData mới thay vì từ form để tránh conflict với Multer
          const formData = new FormData();

          // Thêm các field text từ form
          formData.append("name", form.productName.value.trim());
          formData.append("categoryId", form.productCategory.value);
          formData.append("price", form.productPrice.value);
          formData.append("description", form.productDescription.value);
          const inputType = document.getElementById("inputType");
          if (inputType) {
            formData.append("productType", inputType.value);
          }

          // Thu thập dữ liệu biến thể (hình ảnh chỉ lưu trong biến thể)
          const variants = [];
          const variantItems = document.querySelectorAll(".variant-item");
          variantItems.forEach((item, variantIndex) => {
            const color =
              item.querySelector(".variantColor")?.value.trim() || "";
            const size = item.querySelector(".variantSize")?.value.trim() || "";
            const material =
              item.querySelector(".variantMaterial")?.value.trim() || "";
            const extraPrice =
              Number(item.querySelector(".variantPriceExtra")?.value) || 0;
            const stock =
              Number(item.querySelector(".variantStock")?.value) || 0;

            // Thu thập hình ảnh từ biến thể
            const imageInputs = item.querySelectorAll(".variant-image-input");
            const imageUrls = [];
            imageInputs.forEach((input, imgIdx) => {
              const file = input.files[0];
              const existingUrl =
                input.parentElement.querySelector(".variant-image-url")?.value;

              if (file) {
                // Upload file mới - append với fieldname có index biến thể và index hình
                formData.append(
                  `variantImages_${variantIndex}_${imgIdx}`,
                  file
                );
              } else if (existingUrl && existingUrl.trim()) {
                // Giữ lại URL cũ
                imageUrls.push(existingUrl.trim());
              }
            });

            if (
              color ||
              size ||
              material ||
              imageInputs.length > 0 ||
              imageUrls.length > 0
            ) {
              const variantData = {
                color,
                size,
                material,
                extraPrice,
                imageUrls: imageUrls,
                stock,
              };
              variants.push(variantData);
            }
          });

          // Thêm variants vào FormData dưới dạng JSON
          formData.append("variants", JSON.stringify(variants));

          let res;
          if (editingId) {
            res = await api(`/products/${editingId}`, {
              method: "PUT",
              body: formData,
            });
          } else {
            res = await api("/products", {
              method: "POST",
              body: formData,
            });
          }
          if (res.status === 401) {
            alert("Phiên đăng nhập hết hạn.");
            window.location.href = "login.html";
            return;
          }
          const data = await res.json();
          if (data.status !== "success")
            throw new Error(data.message || "Thao tác thất bại");
          await fetchProducts();
          hideForm();
        } catch (err) {
          alert(err.message || "Không thể lưu sản phẩm");
        }
      });
    }

    // Nút thêm biến thể
    const btnAddVariant = document.getElementById("btnAddVariant");
    if (btnAddVariant) {
      btnAddVariant.addEventListener("click", () => {
        addVariant();
      });
    }

    document.addEventListener("click", async (e) => {
      if (e.target.classList.contains("btn-edit")) {
        const id = e.target.dataset.id;
        try {
          const res = await api(`/products/${id}`);
          const data = await res.json();
          if (data.status === "success") {
            showForm(data.product);
          } else {
            alert(data.message || "Không thể tải thông tin sản phẩm");
          }
        } catch (err) {
          console.error(err);
          alert("Lỗi khi tải thông tin sản phẩm");
        }
      }
      if (e.target.classList.contains("btn-delete-product")) {
        const id = e.target.dataset.id;
        if (!confirm("Xóa sản phẩm này?")) return;
        try {
          const res = await api(`/products/${id}`, { method: "DELETE" });
          if (res.status === 401) {
            alert("Phiên đăng nhập hết hạn.");
            window.location.href = "login.html";
            return;
          }
          const data = await res.json();
          if (data.status !== "success")
            throw new Error(data.message || "Không thể xóa sản phẩm");
          await fetchProducts();
        } catch (err) {
          alert(err.message || "Không thể xóa sản phẩm");
        }
      }
    });
    const searchInput = document.querySelector('.filters input[type="text"]');
    const categorySelect = document.querySelector(".filters select");
    // Biến để debounce (tránh gọi API liên tục khi gõ)
    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        // Đợi 500ms sau khi ngừng gõ mới gọi API
        searchTimeout = setTimeout(() => {
          const keyword = e.target.value.trim();
          // Lấy giá trị danh mục hiện tại (nếu có)
          const catId = categorySelect ? categorySelect.value : "";
          // Gọi hàm fetchProducts với tham số
          fetchProducts(keyword, catId);
        }, 500);
      });
    }
    if (categorySelect) {
      categorySelect.addEventListener("change", (e) => {
        const catId = e.target.value;
        // Lấy từ khóa tìm kiếm hiện tại (nếu có)
        const keyword = searchInput ? searchInput.value.trim() : "";
        // Gọi hàm fetchProducts với tham số
        fetchProducts(keyword, catId);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const productSection = document.querySelector(
      '.main-section[data-section="product-management"]'
    );
    if (!productSection) return;
    if (!ensureAuth()) return;
    bindEvents();
    fetchProducts();
  });
})();
