// Admin product management
(function () {
	// Hàm lấy token từ localStorage hoặc sessionStorage (ưu tiên local)
	function getToken() {
		return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
	}

	// Hàm gọi API có kèm token + tự động thêm Content-Type nếu không phải FormData
	function api(endpoint, options = {}) {
		const url = typeof getApiUrl === 'function' ? getApiUrl(endpoint) : endpoint;
		const headers = Object.assign({}, options.headers || {});
		if (!(options.body instanceof FormData)) {
			headers['Content-Type'] = 'application/json';
		}
		const token = getToken();
		if (token) headers['Authorization'] = 'Bearer ' + token;
		return fetch(url, Object.assign({}, options, { headers }));
	}

	let products = [];
	let editingId = null;

	// Kiểm tra quyền admin: nếu chưa đăng nhập / không phải admin => đá về login/home
	function ensureAuth() {
		const token = getToken();
		if (!token) {
			alert('Vui lòng đăng nhập để truy cập trang quản trị.');
			window.location.href = 'login.html';
			return false;
		}
		const role = (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || '').toLowerCase();
		if (role !== 'admin') {
			alert('Bạn không có quyền admin.');
			window.location.href = 'index.html';
			return false;
		}
		return true;
	}

	// Định dạng giá tiền VND
	function formatCurrency(value) {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
	}

	// Render các thẻ sản phẩm dạng lưới trong Admin
	function renderCards() {
		const container = document.getElementById('grid-item');
		if (!container) return;
		if (!products.length) {
			container.innerHTML = '<p style="padding:16px;">Chưa có sản phẩm nào.</p>';
			return;
		}

		// Tạo giao diện từng card sản phẩm
		container.innerHTML = products.map(product => `
			<div class="card-item">
				<img src="${product.imageUrl || 'img/default.jpg'}" alt="${product.name}">
				<h3 class="item-name">${product.name}</h3>
				<p class="item-category">${product.categoryName || ''}</p>
				<p class="item-price">${formatCurrency(product.price)}</p>
				<div class="card-actions">
					<button class="btn btn-edit" data-id="${product.id}">Edit</button>
					<button class="btn btn-delete-product" data-id="${product.id}">Delete</button>
				</div>
			</div>
		`).join('');
	}

	// Lấy danh sách sản phẩm từ API để admin quản lý
	async function fetchProducts() {
		try {
			const res = await fetch(typeof getApiUrl === 'function' ? getApiUrl('/products') : '/products');
			const data = await res.json();
			if (data.status !== 'success') throw new Error(data.message || 'Không thể tải sản phẩm');
			products = data.products || [];
			renderCards();
		} catch (err) {
			console.error(err);
			alert(err.message || 'Không thể tải sản phẩm');
		}
	}

	let variantCounter = 0;
	let productImageCounter = 0;

	// Tạo một dòng input file cho hình ảnh sản phẩm
	function createProductImageRow(imageUrl = '', removable = true) {
		const row = document.createElement('div');
		row.className = 'product-image-row';
		row.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';
		const imageId = productImageCounter++;
		
		// HTML: tùy vào có thể xóa hay không
		if (removable) {
			row.innerHTML = `
				<input type="file" name="productImages" class="product-image-input" accept="image/*" data-image-id="${imageId}">
				${imageUrl ? `<img src="${imageUrl}" style="max-width: 100px; max-height: 100px;" class="product-image-preview">` : ''}
				<input type="hidden" class="product-image-url" value="${imageUrl || ''}">
				<button type="button" class="btn-remove-product-image" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Xóa</button>
			`;
			// Sự kiện xóa dòng ảnh
			row.querySelector('.btn-remove-product-image').addEventListener('click', () => row.remove());
		} else {
			// Dòng ảnh đầu tiên không được xóa
			row.innerHTML = `
				<input type="file" name="productImages" class="product-image-input" accept="image/*" data-image-id="${imageId}">
				${imageUrl ? `<img src="${imageUrl}" style="max-width: 100px; max-height: 100px;" class="product-image-preview">` : ''}
				<input type="hidden" class="product-image-url" value="${imageUrl || ''}">
			`;
		}

		// Preview khi chọn file
		const fileInput = row.querySelector('.product-image-input');
		const preview = row.querySelector('.product-image-preview');
		if (fileInput) {
			fileInput.addEventListener('change', (e) => {
				const file = e.target.files[0];
				if (file) {
					if (!preview) {
						const img = document.createElement('img');
						img.className = 'product-image-preview';
						img.style.cssText = 'max-width: 100px; max-height: 100px;';
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

	// Thêm biến thể sản phẩm
	function addVariant(variant = null) {
		const container = document.getElementById('variantContainer');
		if (!container) return;
		const variantId = variantCounter++;
		const variantDiv = document.createElement('div');
		variantDiv.className = 'variant-item';
		variantDiv.dataset.variantId = variantId;
		variantDiv.innerHTML = `
			<div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 5px; background: #f9f9f9;">
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
					<div>
						<label>Màu sắc:</label>
						<input type="text" class="variant-color" value="${variant?.color || ''}" placeholder="Ví dụ: Hồng Pastel">
					</div>
					<div>
						<label>Kích cỡ:</label>
						<input type="text" class="variant-size" value="${variant?.size || ''}" placeholder="Ví dụ: 100g">
					</div>
				</div>
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
					<div>
						<label>Chất liệu:</label>
						<input type="text" class="variant-material" value="${variant?.material || ''}" placeholder="Ví dụ: Milk Cotton">
					</div>
					<div>
						<label>Giá thêm (VND):</label>
						<input type="number" class="variant-extraPrice" value="${variant?.extraPrice || 0}" step="0.01" min="0">
					</div>
				</div>
				<div style="margin-bottom: 10px;">
					<label>Hình ảnh biến thể:</label>
					<input type="file" class="variant-image" accept="image/*">
					${variant?.imageUrl ? `<img src="${variant.imageUrl}" style="max-width: 100px; max-height: 100px; margin-top: 5px; display: block;" class="variant-preview">` : ''}
					${variant?.imagePath ? `<input type="hidden" class="variant-imagePath" value="${variant.imagePath}">` : ''}
				</div>
				<button type="button" class="btn-remove-variant" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Xóa biến thể</button>
			</div>
		`;
		container.appendChild(variantDiv);

		// Preview image khi chọn file
		const fileInput = variantDiv.querySelector('.variant-image');
		const preview = variantDiv.querySelector('.variant-preview');
		if (fileInput) {
			fileInput.addEventListener('change', (e) => {
				const file = e.target.files[0];
				if (file) {
					if (!preview) {
						const img = document.createElement('img');
						img.className = 'variant-preview';
						img.style.cssText = 'max-width: 100px; max-height: 100px; margin-top: 5px; display: block;';
						fileInput.parentElement.appendChild(img);
						img.src = URL.createObjectURL(file);
					} else {
						preview.src = URL.createObjectURL(file);
					}
				}
			});
		}

		// Xóa biến thể
		const removeBtn = variantDiv.querySelector('.btn-remove-variant');
		if (removeBtn) {
			removeBtn.addEventListener('click', () => {
				variantDiv.remove();
			});
		}
	}

	function showForm(product) {
		const listView = document.getElementById('product-list-view');
		const formView = document.getElementById('add-product-view');
		const btnAdd = document.getElementById('btn-add');
		const form = document.getElementById('productForm');
		if (!form) return;
		editingId = product ? product.id : null;
		form.reset();
		document.getElementById('productId').value = editingId || '';
		
		// Xóa tất cả biến thể cũ
		const variantContainer = document.getElementById('variantContainer');
		if (variantContainer) variantContainer.innerHTML = '';
		variantCounter = 0;

		// Xóa và khởi tạo lại danh sách hình ảnh sản phẩm
		const productImagesList = document.getElementById('productImagesList');
		if (productImagesList) {
			productImagesList.innerHTML = '';
			if (product && product.images && Array.isArray(product.images) && product.images.length > 0) {
				// Nếu có nhiều hình ảnh, hiển thị tất cả
				product.images.forEach((img, idx) => {
					const imgUrl = img.imageUrl || img.imagePath || img;
					productImagesList.appendChild(createProductImageRow(imgUrl, idx > 0));
				});
			} else if (product && product.imageUrl) {
				// Nếu chỉ có 1 hình ảnh
				productImagesList.appendChild(createProductImageRow(product.imageUrl, false));
			} else {
				// Không có hình ảnh, tạo 1 input trống
				productImagesList.appendChild(createProductImageRow('', false));
			}
		}

		if (product) {
			form.productName.value = product.name || '';
			form.productCategory.value = product.categoryId || '';
			form.productPrice.value = product.price || '';
			form.productDescription.value = product.description || '';
			form.productType.value = product.type || '';
			if (form.productImagePreview) {
				if (product.imageUrl) {
					form.productImagePreview.src = product.imageUrl;
					form.productImagePreview.style.display = 'block';
				} else {
					form.productImagePreview.style.display = 'none';
				}
			}
			// Load biến thể nếu có
			if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
				product.variants.forEach(v => {
					addVariant({
						color: v.color,
						size: v.size,
						material: v.material,
						extraPrice: v.extraPrice,
						imageUrl: v.imageUrl,
						imagePath: v.imagePath
					});
				});
			}
		} else {
			if (form.productImagePreview) form.productImagePreview.style.display = 'none';
		}
		listView.style.display = 'none';
		formView.style.display = 'block';
		btnAdd.style.display = 'none';
	}

	function hideForm() {
		const listView = document.getElementById('product-list-view');
		const formView = document.getElementById('add-product-view');
		const btnAdd = document.getElementById('btn-add');
		if (listView) listView.style.display = 'block';
		if (formView) formView.style.display = 'none';
		if (btnAdd) btnAdd.style.display = 'inline-block';
		editingId = null;
	}

	function bindEvents() {
		const btnAdd = document.getElementById('btn-add');
		const btnBack = document.getElementById('btnBackToList');
		const form = document.getElementById('productForm');
		const imageInput = document.getElementById('productImage');
		const preview = document.getElementById('productImagePreview');

		if (btnAdd) btnAdd.addEventListener('click', () => showForm());
		if (btnBack) btnBack.addEventListener('click', hideForm);

		if (imageInput && preview) {
			imageInput.addEventListener('change', () => {
				const file = imageInput.files[0];
				if (file) {
					preview.src = URL.createObjectURL(file);
					preview.style.display = 'block';
				} else {
					preview.style.display = 'none';
				}
			});
		}

		// Nút thêm hình ảnh sản phẩm
		const btnAddProductImg = document.getElementById('btnAddProductImg');
		if (btnAddProductImg) {
			btnAddProductImg.addEventListener('click', () => {
				const productImagesList = document.getElementById('productImagesList');
				if (productImagesList) {
					productImagesList.appendChild(createProductImageRow('', true));
				}
			});
		}

		if (form) {
			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				try {
					// Tạo FormData mới thay vì từ form để tránh conflict với Multer
					const formData = new FormData();
					
					// Thêm các field text từ form
					formData.append('name', form.productName.value.trim());
					formData.append('categoryId', form.productCategory.value);
					formData.append('price', form.productPrice.value);
					formData.append('description', form.productDescription.value);
					formData.append('productType', form.productType.value);
					
					// Thu thập hình ảnh sản phẩm chính
					const productImagesList = document.getElementById('productImagesList');
					if (productImagesList) {
						const imageInputs = productImagesList.querySelectorAll('.product-image-input');
						const imageUrls = [];
						imageInputs.forEach((input) => {
							const file = input.files[0];
							const existingUrl = input.parentElement.querySelector('.product-image-url')?.value;
							
							if (file) {
								// Upload file mới - chỉ append nếu có file
								formData.append('productImages', file);
							} else if (existingUrl && existingUrl.trim()) {
								// Giữ lại URL cũ
								imageUrls.push(existingUrl.trim());
							}
						});
						// Gửi danh sách URL cũ
						if (imageUrls.length > 0) {
							imageUrls.forEach(url => {
								formData.append('productImageUrls', url);
							});
						}
					}
					
					// Thu thập dữ liệu biến thể
					const variants = [];
					const variantItems = document.querySelectorAll('.variant-item');
					variantItems.forEach((item, index) => {
						const color = item.querySelector('.variant-color')?.value.trim() || '';
						const size = item.querySelector('.variant-size')?.value.trim() || '';
						const material = item.querySelector('.variant-material')?.value.trim() || '';
						const extraPrice = Number(item.querySelector('.variant-extraPrice')?.value) || 0;
						const imageFile = item.querySelector('.variant-image')?.files[0];
						const imagePath = item.querySelector('.variant-imagePath')?.value || null;

						if (color || size || material || imageFile || imagePath) {
							const variantData = {
								color,
								size,
								material,
								extraPrice,
								imagePath: imagePath // Giữ lại path cũ nếu không upload file mới
							};
							variants.push(variantData);
							
							// Thêm file vào FormData nếu có
							if (imageFile) {
								formData.append('variantImages', imageFile);
							}
						}
					});

					// Thêm variants vào FormData dưới dạng JSON
					formData.append('variants', JSON.stringify(variants));

					let res;
					if (editingId) {
						res = await api(`/products/${editingId}`, {
							method: 'PUT',
							body: formData
						});
					} else {
						res = await api('/products', {
							method: 'POST',
							body: formData
						});
					}
					if (res.status === 401) {
						alert('Phiên đăng nhập hết hạn.');
						window.location.href = 'login.html';
						return;
					}
					const data = await res.json();
					if (data.status !== 'success') throw new Error(data.message || 'Thao tác thất bại');
					await fetchProducts();
					hideForm();
				} catch (err) {
					alert(err.message || 'Không thể lưu sản phẩm');
				}
			});
		}

		// Nút thêm biến thể
		const btnAddVariant = document.getElementById('btnAddVariant');
		if (btnAddVariant) {
			btnAddVariant.addEventListener('click', () => {
				addVariant();
			});
		}

		document.addEventListener('click', async (e) => {
			if (e.target.classList.contains('btn-edit')) {
				const id = e.target.dataset.id;
				const product = products.find(p => String(p.id) === String(id));
				if (product) showForm(product);
			}
			if (e.target.classList.contains('btn-delete-product')) {
				const id = e.target.dataset.id;
				if (!confirm('Xóa sản phẩm này?')) return;
				try {
					const res = await api(`/products/${id}`, { method: 'DELETE' });
					if (res.status === 401) {
						alert('Phiên đăng nhập hết hạn.');
						window.location.href = 'login.html';
						return;
					}
					const data = await res.json();
					if (data.status !== 'success') throw new Error(data.message || 'Không thể xóa sản phẩm');
					await fetchProducts();
				} catch (err) {
					alert(err.message || 'Không thể xóa sản phẩm');
				}
			}
		});
	}

	document.addEventListener('DOMContentLoaded', () => {
		const productSection = document.querySelector('.main-section[data-section="product-management"]');
		if (!productSection) return;
		if (!ensureAuth()) return;
		bindEvents();
		fetchProducts();
	});
})();

