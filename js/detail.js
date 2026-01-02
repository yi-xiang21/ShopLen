let currentProduct = null;
let allProducts = [];
let selectedVariant = null;

function getProductId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

function getEndpoint(path) {
  if (typeof getApiUrl === "function") return getApiUrl(path);
  return path;
}

async function loadProduct() {
  const productId = getProductId();
  if (!productId) {
    showError("Không tìm thấy sản phẩm");
    return;
  }
  try {
    const [productRes, listRes] = await Promise.all([
      fetch(getEndpoint(`/products/${productId}`)),
      fetch(getEndpoint("/products")),
    ]);
    const productData = await productRes.json();
    if (productData.status !== "success") {
      throw new Error(productData.message || "Không tìm thấy sản phẩm");
    }

    // Sử dụng trực tiếp dữ liệu từ API
    currentProduct = productData.product;

    selectedVariant = null;

    const listData = await listRes.json();
    allProducts = listData.products || [];
    displayProduct();
    updateProductPrice(); // Cập nhật giá tiền của biến thể
    loadRelatedProducts();
    initCollapsibleSections();
  } catch (error) {
    showError("Có lỗi xảy ra khi tải sản phẩm");
  }
}

// Lấy URL ảnh từ object hoặc string
function getImageUrl(img) {
  if (!img) return "Không có hình ảnh";
  return typeof img === "string"
    ? img
    : img.imageUrl || img.imagePath || "Không có hình ảnh";
}

// Render thumbnails
function renderThumbnails(images, productName) {
  const thumbnailContainer = document.getElementById("thumbnail-images");
  if (!thumbnailContainer) return;

  if (!images || images.length === 0) {
    thumbnailContainer.innerHTML = "";
    return;
  }

  thumbnailContainer.innerHTML = images
    .map(
      (thumb, index) => `
        <img src="${thumb}" alt="${productName}" class="${
        index === 0 ? "active" : ""
      }" onclick="changeMainImage('${thumb}')">
    `
    )
    .join("");
}

// Cập nhật hiển thị giá sản phẩm (bao gồm giá gốc nếu có giảm giá)
function updateProductPrice() {
  const priceContainer = document.getElementById("product-price");
  const selectedVariantData = currentProduct.variants?.find(
    (v) => v.id == selectedVariant
  );

  let basePrice = currentProduct.price || 0;
  if (selectedVariantData) {
      const variantPrice = Number(selectedVariantData.extraPrice) || 0;
      if (variantPrice > 0) {
          basePrice = variantPrice;
      }
  }

  let finalPrice = basePrice;
  let hasDiscount = false;
  let discountPercent = 0;

  // Tìm khuyến mãi hợp lệ
  const promotions = currentProduct.promotions || [];

  if (promotions && promotions.length > 0) {
    const activePromo = promotions.find((promo) => {
      const now = new Date();
      const startDate = promo.startDate;
      const endDate = promo.endDate;

      const start = new Date(startDate);
      const end = new Date(endDate);
      return now >= start && now <= end;
    });

    if (activePromo) {
      hasDiscount = true;
      discountPercent = activePromo.discountPercent || 0;
      finalPrice = basePrice * (1 - discountPercent / 100);
    }
  }

  // Hiển thị giá: nếu có giảm giá thì hiển thị cả giá gốc và giá đã giảm
  if (hasDiscount) {
    priceContainer.innerHTML = `
            <span class="current-price" style="color: #8B4513; font-weight: 700;">${formatPrice(
              finalPrice
            )}</span>
            <span class="original-price" style="color: #999; text-decoration: line-through; margin-left: 10px; font-size: 0.9em;">${formatPrice(
              basePrice
            )}</span>
            <span class="discount-badge" style="background: #e91e63; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; margin-left: 10px;">-${discountPercent}%</span>
        `;
  } else {
    priceContainer.innerHTML = `<span class="current-price" style="color: #8B4513; font-weight: 700;">${formatPrice(
      finalPrice
    )}</span>`;
  }
}
// Hiển thị thông tin sản phẩm
function displayProduct() {
  const p = currentProduct;
  if (!p) return;

  document.getElementById("product-name").textContent = p.name;
  document.getElementById("product-title").textContent = p.name;
  document.getElementById("product-code").textContent = p.id;
  document.getElementById("detailed-description").innerHTML = (
    p.description || ""
  ).replace(/\n/g, "<br>");
  document.getElementById("product-material").textContent = p.type || "LEN";

  // Ảnh mặc định
  let images = [getImageUrl(p.imageUrl || p.imagePath)];

  // Nếu có biến thể
  if (p.variants?.length > 0) {
    const v = p.variants[0];
    document.getElementById("stock-info").textContent = `${
      v.stock || 0
    } sản phẩm có sẵn`;

    if (v.images?.length > 0) images = v.images.map(getImageUrl);
    else if (v.imageUrl || v.imagePath) images = [getImageUrl(v)];
  } else {
    document.getElementById("stock-info").textContent = `${
      p.stock || 0
    } sản phẩm có sẵn`;
  }

  // Gán ảnh
  document.getElementById("main-product-image").src = images[0];
  renderThumbnails(images);
  updateProductPrice();
  loadColorOptions();
}

// Định dạng giá theo định dạng tiếng Việt
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Tải các tùy chọn màu sắc từ biến thể
function loadColorOptions() {
  const colorContainer = document.getElementById("color-options");

  if (!currentProduct.variants || currentProduct.variants.length === 0) {
    colorContainer.innerHTML = "<p>Không có biến thể</p>";
    return;
  }

  // Main product image as fallback
  const mainImgUrl = getImageUrl(
    currentProduct.imageUrl || currentProduct.imagePath
  );

  colorContainer.innerHTML = currentProduct.variants
    .map((v, i) => {
      const text = `${v.color} – ${v.size}`;
      // Lấy ảnh đại diện cho variant
      const vImg = getImageUrl(v.imageUrl || v.imagePath || mainImgUrl);

      return `
            <button class="color-option ${i === 0 ? "active" : ""}"
                data-variant-id="${v.id}"
                onclick="selectVariant('${v.id}', '${vImg}')">
                ${text}
            </button>
        `;
    })
    .join("");

  selectedVariant = currentProduct.variants[0].id;
}

// Chọn biến thể (màu sắc)
function selectVariant(variantId, imageUrl) {
  selectedVariant = variantId;

  const variant = currentProduct.variants.find((v) => v.id == variantId);
  const stock = variant?.stock ?? currentProduct.stock ?? 0;

  document.getElementById(
    "stock-info"
  ).textContent = `${stock} sản phẩm có sẵn`;

  updateProductPrice();

  document
    .querySelectorAll(".color-option")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelector(`[data-variant-id="${variantId}"]`)
    ?.classList.add("active");

  // Cập nhật thumbnails và hình ảnh chính theo biến thể
  if (variant) {
    let variantImages = [];
    if (variant.images && variant.images.length > 0) {
      variantImages = variant.images.map(getImageUrl);
    } else if (variant.imageUrl || variant.imagePath) {
      variantImages = [getImageUrl(variant.imageUrl || variant.imagePath)];
    } else {
      // Fallback to main product image
      variantImages = [
        getImageUrl(currentProduct.imageUrl || currentProduct.imagePath),
      ];
    }

    renderThumbnails(variantImages, currentProduct.name);

    // Nếu có imageUrl được truyền vào (từ click), dùng nó, nếu không dùng ảnh đầu tiên của list
    if (imageUrl) {
      changeMainImage(imageUrl);
    } else if (variantImages.length > 0) {
      changeMainImage(variantImages[0]);
    }
  }
}

// Thay đổi hình ảnh chính
function changeMainImage(imageSrc) {
  const mainImage = document.getElementById("main-product-image");
  mainImage.src = imageSrc;

  const thumbnails = document.querySelectorAll("#thumbnail-images img");
  thumbnails.forEach((img, index) => {
    img.classList.remove("active");
    if (img.src === imageSrc) {
      img.classList.add("active");
      currentThumbIndex = index; // đồng bộ chỉ số
    }
  });
}

// Cuộn thumbnail
let currentThumbIndex = 0;

function scrollThumbnails(direction) {
  const thumbnails = document.querySelectorAll("#thumbnail-images img");
  if (thumbnails.length === 0) return;

  // Tính index mới
  currentThumbIndex += direction;

  if (currentThumbIndex < 0) currentThumbIndex = thumbnails.length - 1;
  if (currentThumbIndex >= thumbnails.length) currentThumbIndex = 0;

  const newImage = thumbnails[currentThumbIndex].src;

  // Đổi ảnh chính
  changeMainImage(newImage);

  // Cập nhật active thumbnail
  thumbnails.forEach((img) => img.classList.remove("active"));
  thumbnails[currentThumbIndex].classList.add("active");
}

// Tải sản phẩm liên quan/tương tự
function loadRelatedProducts() {
  if (!currentProduct || !allProducts.length) return;

  const relatedProducts = getRelatedProducts();
  const similarContainer = document.getElementById("similar-products");

  if (!relatedProducts.length) {
    similarContainer.innerHTML =
      '<p style="text-align: center; color: #666; padding: 20px;">Không có sản phẩm tương tự</p>';
    return;
  }

  similarContainer.innerHTML = relatedProducts
    .map((product) => {
      // product ở đây là raw data từ API list
      const image = getImageUrl(product.imageUrl || product.imagePath);
      // Fallback price if needed
      const price = product.price || 0;

      return `
            <div class="similar-item" onclick="goToProduct('${product.id}')">
                <img src="${image}" alt="${product.name}">
                <div class="similar-item-info">
                    <div class="similar-item-title">${product.name}</div>
                    <div class="similar-item-price">${formatPrice(price)}</div>
                </div>
            </div>
        `;
    })
    .join("");
}

function getRelatedProducts() {
  return allProducts.filter((p) => p.id != currentProduct.id).slice(0, 10);
}

// Điều hướng đến trang chi tiết sản phẩm
function goToProduct(productId) {
  window.location.href = `detail.html?id=${productId}`;
}

// Hàm thay đổi số lượng
function changeQuantity(delta) {
  const quantityInput = document.getElementById("quantity");
  const stockInfo = document.getElementById("stock-info");
  const stock = parseInt(stockInfo.textContent.match(/\d+/)?.[0] || 0);

  let currentQty = parseInt(quantityInput.value) || 1;
  let newQty = currentQty + delta;

  // Đảm bảo số lượng nằm trong khoảng từ 1 đến tồn kho
  newQty = Math.max(1, Math.min(stock, newQty));

  quantityInput.value = newQty;
}

// Khởi tạo các phần có thể thu gọn
function initCollapsibleSections() {
  // Phần đầu tiên mở mặc định
  const firstSection = document.querySelector(".detail-section");
}

// Chuyển đổi trạng thái phần có thể thu gọn
function toggleSection(button) {
  const section = button.closest(".detail-section");
  const isActive = section.classList.contains("active");

  // Đóng tất cả các phần
  document.querySelectorAll(".detail-section").forEach((sec) => {
    sec.classList.remove("active");
  });

  // Chuyển đổi phần hiện tại
  if (!isActive) {
    section.classList.add("active");
  }
}

// Thêm vào giỏ hàng
function addToCart() {
  if (!currentProduct) return;

  const quantity = parseInt(document.getElementById("quantity").value) || 1;
  const selectedVariantData = currentProduct.variants?.find(
    (v) => v.id == selectedVariant
  );

  let finalPrice = Number(currentProduct.price) || 0;

  if (selectedVariantData) {
    const variantPrice = Number(selectedVariantData.extraPrice) || 0;

    if (variantPrice > 0) {
      finalPrice = variantPrice;
    }
  }
  
  // Giá biến thể trước khi giảm giá
  const priceBeforeDiscount = finalPrice; 

  // Áp dụng giảm giá
  const promotions = currentProduct.promotions || [];
  let activePromo = null;

  if (promotions && promotions.length > 0) {
    activePromo = promotions.find((promo) => {
      const now = new Date();
      const start = new Date(promo.startDate);
      const end = new Date(promo.endDate);
      return now >= start && now <= end;
    });

    if (activePromo) {
      const discountPercent = activePromo.discountPercent || 0;
      // Áp dụng giảm giá lên finalPrice đã xử lý biến thể
      finalPrice = finalPrice * (1 - discountPercent / 100);
    }
  }

  // Define product object for cart
  const productToAdd = {
    id: currentProduct.id,
    name: currentProduct.name,
    price: finalPrice, 
    image: getImageUrl(
      selectedVariantData?.imageUrl ||
        selectedVariantData?.imagePath ||
        currentProduct.imageUrl ||
        currentProduct.imagePath
    ),
    variant: selectedVariantData,
    quantity: quantity,
    ma_san_pham: currentProduct.id,
    ma_bien_the: selectedVariant,
    mau_sac: selectedVariantData?.color || "",
    kich_co: selectedVariantData?.size || "",
    price_before_discount: priceBeforeDiscount,
  };

  // Lấy giỏ hàng hiện có từ localStorage
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  // Kiểm tra xem sản phẩm với cùng biến thể đã tồn tại trong giỏ hàng chưa
  const existingIndex = cart.findIndex(
    (item) =>
      item.ma_san_pham == productToAdd.ma_san_pham &&
      item.ma_bien_the == productToAdd.ma_bien_the
  );

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push(productToAdd);
  }

  // Lưu vào localStorage
  localStorage.setItem("cart", JSON.stringify(cart));

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (token) {
      // Nếu đã đăng nhập, gọi API để lưu vào bảng gio_hang
      try {
          const apiUrl = getApiUrl('/cart/add');

          fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({
                ma_bien_the: selectedVariant,  // ID biến thể
                so_luong: quantity             // Số lượng
              })
          })
          .then(res => res.json())
          .then(data => {
              if (data.status === 'success') {
                  // Thành công: Báo cho người dùng biết
                  alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
              } else {
                  // Thất bại: Báo lỗi để kiểm tra
                  alert('Lỗi lưu Database: ' + (data.error || data.message));
              }
          })
          .catch(err => {
              alert('Lỗi kết nối Fetch: ' + err);
          });
      } catch (e) {
          alert("Lỗi code (getApiUrl?): " + e);
      }
  } else {
      // Nếu chưa đăng nhập, lưu vào LocalStorage

  }

  // Cập nhật số lượng giỏ hàng
  if (typeof updateCartCount === "function") {
    updateCartCount();
  }
}

// Mua ngay
function buyNow() {
  if (!currentProduct) return;

  const quantity = parseInt(document.getElementById("quantity").value) || 1;

  // Thêm vào giỏ hàng trước
  addToCart();

  // Chuyển hướng đến trang thanh toán hoặc giỏ hàng
  window.location.href = "bill.html";
}

// Hiển thị thông báo lỗi
function showError(message) {
  const detailDiv = document.getElementById("detail");
  if (detailDiv) {
    detailDiv.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <h2 style="color: #8B4513; margin-bottom: 20px;">${message}</h2>
                <a href="shop.html" style="color: #8B4513; text-decoration: underline;">Quay lại cửa hàng</a>
            </div>
        `;
  }
}

// Cuộn sản phẩm tương tự
function scrollSimilar(direction) {
  const container = document.getElementById("similar-products");
  const scrollAmount = 220; // Chiều rộng item + khoảng cách
  container.scrollBy({
    left: direction * scrollAmount,
    behavior: "smooth",
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadProduct();
});