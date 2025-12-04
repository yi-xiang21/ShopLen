let shopProductsState = {
	currentPage: 0,
	pageSize: 8,
	all: [],
	filtered: null
};

// Hàm chuyển sang đơn vị tiền tệ VN
function formatCurrency(value) {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND'
	}).format(value || 0);
}

// Hàm lấy thông tin sản phẩm
function convertProduct(product) {
	return {
		id: product.id,
		name: product.name,
		price: Number(product.price) || 0,
		categoryId: product.categoryId,
		imageUrl: product.imageUrl || 'img/default.jpg'
	};
}

// Hàm render các sản phẩm
function renderShopProducts() {
	const list = document.getElementById('product-list');
	if (!list) return;
	const { currentPage, pageSize, all, filtered } = shopProductsState;
	const data = filtered ?? all;
	const showProducts = data.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

	if (!showProducts.length) {
		list.innerHTML = '<p style="padding:16px;">Không có sản phẩm.</p>';
		return;
	}

	// Hiển thị danh sách sản phẩm
	list.innerHTML = showProducts.map(product => `
		<div class="product-item">
			<img src="${product.imageUrl}" alt="${product.name}">
			<p class="title-item">${product.name}</p>
			<p class="cost">${formatCurrency(product.price)}</p>
			<button class="btn-buy">
				<a href="detail.html?id=${product.id}">Buy Now</a>
			</button>
		</div>
	`).join(''); // Nối các phần tử trong mảng thành 1 chuỗi HTML
}

// Hàm gọi API lấy danh sách sản phẩm và hiển thị lên giao diện
async function fetchShopProducts() {
	try {
		const res = await fetch(typeof getApiUrl === 'function' ? getApiUrl('/products') : '/products');
		const data = await res.json();
		
		// Kiểm tra trạng thái API 
		if (data.status !== 'success') throw new Error(data.message || 'Không thể tải sản phẩm');
		const products = (data.products || []).map(convertProduct);
		shopProductsState.all = products;
		shopProductsState.filtered = null;
		shopProductsState.currentPage = 0;
		renderShopProducts();
	} catch (err) {
		console.error(err);
		const list = document.getElementById('product-list');
		if (list) list.innerHTML = '<p style="color:red;">Không thể tải sản phẩm.</p>';
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
	if ((shopProductsState.currentPage + 1) * shopProductsState.pageSize < data.length) {
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
	const minInput = document.getElementById('mincost')?.value.trim();
	const maxInput = document.getElementById('maxcost')?.value.trim();

	const findInput = document.querySelector('input[name="find"]:checked');
	const findID = findInput ? findInput.value : null;

	let minCost = minInput ? Number(minInput) : null;
	let maxCost = maxInput ? Number(maxInput) : null;

	// Đảo ngược giá trị min và max nếu min > max
	if (minCost !== null && maxCost !== null && minCost > maxCost) {
		[minCost, maxCost] = [maxCost, minCost];
	}
	
	// Lọc sản phẩm theo giá
	shopProductsState.filtered = shopProductsState.all.filter(product => {
		const price = Number(product.price); // Lọc theo giá

		// if (!Number.isFinite(price)) return false;
		if (minCost !== null && price < minCost) return false;
		if (maxCost !== null && price > maxCost) return false;

		// Lọc theo loại sản phẩm (cần chỉnh sửa thành loại sản phẩm)
		if (findID != null && product.categoryId != findID) return false;
		return true;
	});

	// Đặt lại trang ban đầu
	shopProductsState.currentPage = 0;
	renderShopProducts();
}

// Hàm tìm kiếm sản phẩm theo tên
function find(event) {
	if (event) event.preventDefault(); // Ngừng sự kiện hiện tại nếu có

	const input = document.querySelector('.search-item');
    const keyword = input ? input.value.trim().toLowerCase() : '';

	if (!keyword) {
		showAllItems();
		return;
	}
	
	// Lọc từ danh sách sản phẩm
	shopProductsState.filtered = shopProductsState.all.filter(product =>
		product.name.toLowerCase().includes(keyword)
	);
	shopProductsState.currentPage = 0;
	renderShopProducts();
}

// Gắn sự kiện DOMContentLoaded để chạy khi DOM được tải xong (DOMContextLoaded là sự kiện được sử dụng để chạy mã khi toàn bộ nội dung của trang (bao gồm cả HTML và tài nguyên liên quan) đã được tải xong. Nó gắn các sự kiện vào các nút sắp xếp và bắt đầu quá trình lấy sản phẩm từ API.)
document.addEventListener('DOMContentLoaded', () => {
	fetchShopProducts();
    // Gắn sự kiện cho nút Lọc
    const btnFilter = document.getElementById('sort-button-default');
    if (btnFilter) {
        btnFilter.addEventListener('click', filter);
    }
    
    // Gắn sự kiện cho form tìm kiếm
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', find);
    }
});

