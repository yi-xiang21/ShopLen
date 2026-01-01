let shopProductsState = {
  currentPage: 0,
  pageSize: 8,
  all: [],
  filtered: null,
};

// Hàm chuyển sang đơn vị tiền tệ VN
function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
}

// Hàm lấy thông tin sản phẩm
function convertProduct(product) {
  let finalPrice = Number(product.price);
  let imageUrl = product.imageUrl || "img/default.jpg";
  // Thu thập kích cỡ từ biến thể để lọc
  const sizes = new Set();
  if (
    product.variants &&
    Array.isArray(product.variants) &&
    product.variants.length > 0
  ) {
    const firstVariant = product.variants[0];

    const extraPrice = Number(firstVariant.extraPrice) || 0;
    if (extraPrice > 0) {
      finalPrice = extraPrice;
    }

    product.variants.forEach((v) => {
      if (v.kich_co) sizes.add(String(v.kich_co).toLowerCase());
      if (v.size) sizes.add(String(v.size).toLowerCase());
    });

    imageUrl =
      firstVariant.images?.[0]?.imageUrl ||
      firstVariant.images?.[0] ||
      firstVariant.imageUrl ||
      product.imageUrl ||
      imageUrl;
  }
  let status = product.status == 1 ? "true" : "false";
  return {
    id: product.id,
    name: product.name,
    price: finalPrice,
    categoryId: product.categoryId,
    imageUrl: imageUrl,
    sizes: Array.from(sizes),
    status: status,
  };
}

// Hàm render các sản phẩm
function renderShopProducts() {
  const list = document.getElementById("product-list");
  if (!list) return;
  const { currentPage, pageSize, all, filtered } = shopProductsState;
  const data = filtered ?? all;
  const showProducts = data.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  if (!showProducts.length) {
    list.innerHTML = '<p style="padding:16px;">Không có sản phẩm.</p>';
    return;
  }
  console.log("Hiển thị sản phẩm:", showProducts);

  // Hiển thị danh sách sản phẩm
  list.innerHTML = showProducts.map((product) => `
		<div class="product-item">
			<div class="img-box">
				<img src="${product.imageUrl}" alt="${product.name}">
			</div>
			<p class="title-item">${product.name}</p>
			<p class="cost">${formatCurrency(product.price)}</p>
			<a class="btn-buy" href="detail.html?id=${product.id}">Mua Ngay</a>
		</div>
	`
    )
    .join(""); // Nối các phần tử trong mảng thành 1 chuỗi HTML
}

// Hàm gọi API lấy danh sách sản phẩm và hiển thị lên giao diện
async function fetchShopProducts() {
  try {
    const res = await fetch(
      typeof getApiUrl === "function" ? getApiUrl("/products") : "/products"
    );
    const data = await res.json();

    // Kiểm tra trạng thái API
    if (data.status !== "success")
      throw new Error(data.message || "Không thể tải sản phẩm");
    const products = (data.products || [])
      .map(convertProduct)
      .filter(product => product.status === "true"); // Chỉ hiển thị sản phẩm đang mở
    shopProductsState.all = products;
    shopProductsState.filtered = null;
    shopProductsState.currentPage = 0;
    renderShopProducts();
  } catch (err) {
    const list = document.getElementById("product-list");
    if (list)
      list.innerHTML = '<p style="color:red;">Không thể tải sản phẩm.</p>';
  }
}

// Hàm hiển thị sản phẩm khi dùng bộ lọc
function showAllItems() {
  shopProductsState.filtered = null;
  shopProductsState.currentPage = 0;
  renderShopProducts();
}

// Hàm chuyển sang trang tiếp theo
function next() {
  const data = shopProductsState.filtered ?? shopProductsState.all;
  if (
    (shopProductsState.currentPage + 1) * shopProductsState.pageSize <
    data.length
  ) {
    shopProductsState.currentPage++;
    renderShopProducts();
  }
}

// Hàm quay lại trang trước
function prev() {
  if (shopProductsState.currentPage > 0) {
    shopProductsState.currentPage--;
    renderShopProducts();
  }
}

// Hàm lọc sản phẩm theo mức giá và danh mục
function filter() {
  // Giá tiền từ select range
  let minCost = null;
  let maxCost = null;
  const priceSelect = document.getElementById("rangePriceSelect");
  if (priceSelect) {
    const idx = priceSelect.selectedIndex;
    // Map theo thứ tự option trong HTML
    const ranges = [
      [0, 50000],
      [50000, 100000],
      [100000, 150000],
      [150000, 200000],
      [200000, 250000],
      [250000, 300000],
    ];
    const chosen = ranges[idx];
    if (chosen) {
      [minCost, maxCost] = chosen;
    }
  }

  // Loại sản phẩm
  const findInput = document.querySelector('input[name="find"]:checked');
  const findID = findInput ? findInput.value : null;

  // Kích cỡ
  const sizeCheckboxes = document.querySelectorAll(
    '.filter-material input[type="checkbox"]:checked'
  );
  const selectedSizes = Array.from(sizeCheckboxes).map((cb) =>
    cb.parentElement.textContent.trim().toLowerCase()
  );

  // Lọc sản phẩm theo giá / loại / kích cỡ
  shopProductsState.filtered = shopProductsState.all.filter((product) => {
    const price = Number(product.price);

    if (minCost !== null && price < minCost) return false;
    if (maxCost !== null && price > maxCost) return false;

    // Loại sản phẩm
    if (findID != null && product.categoryId != findID) return false;

    // Kích cỡ
    if (selectedSizes.length > 0) {
      if (!product.sizes || product.sizes.length === 0) return false;
      const hasMatch = product.sizes.some((sz) =>
        selectedSizes.includes(String(sz).toLowerCase())
      );
      if (!hasMatch) return false;
    }

    return true;
  });

  // Đặt lại trang ban đầu
  shopProductsState.currentPage = 0;
  renderShopProducts();
}

// Hàm tìm kiếm sản phẩm theo tên
function find(event) {
  if (event) event.preventDefault(); // Ngừng sự kiện hiện tại nếu có

  const input = document.querySelector(".search-item");
  const keyword = input ? input.value.trim().toLowerCase() : "";

  if (!keyword) {
    showAllItems();
    return;
  }

  // Lọc từ danh sách sản phẩm
  shopProductsState.filtered = shopProductsState.all.filter((product) =>
    product.name.toLowerCase().includes(keyword)
  );
  shopProductsState.currentPage = 0;
  renderShopProducts();
}

// Gắn sự kiện DOMContentLoaded để chạy khi DOM được tải xong (DOMContextLoaded là sự kiện được sử dụng để chạy mã khi toàn bộ nội dung của trang (bao gồm cả HTML và tài nguyên liên quan) đã được tải xong. Nó gắn các sự kiện vào các nút sắp xếp và bắt đầu quá trình lấy sản phẩm từ API.)
document.addEventListener("DOMContentLoaded", () => {
  fetchShopProducts();
  // Gắn sự kiện cho nút Lọc
  const btnFilter = document.getElementById("sort-button-default");
  if (btnFilter) {
    btnFilter.addEventListener("click", filter);
  }
  const resetSort = document.getElementById("reset-sort");
  if (resetSort) {
    resetSort.addEventListener("click", showAllItems);
  }
  // Gắn sự kiện cho form tìm kiếm
  const searchForm = document.querySelector(".search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", find);
  }
});
