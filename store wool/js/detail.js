let currentProduct = null;
let allProducts = [];
let selectedVariant = null;

function getProductId() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('id');
}

function getEndpoint(path) {
	if (typeof getApiUrl === 'function') return getApiUrl(path);
	return path;
}   

async function loadProduct() {
	const productId = getProductId();
	if (!productId) {
		showError('Không tìm thấy sản phẩm');
		return;
	}
	try {
		const [productRes, listRes] = await Promise.all([
			fetch(getEndpoint(`/products/${productId}`)),
			fetch(getEndpoint('/products'))
		]);
		const productData = await productRes.json();
		if (productData.status !== 'success')
        {

            throw new Error(productData.message || 'Không tìm thấy sản phẩm');
        }
        currentProduct = convertProductFormat(productData.product);
        
		selectedVariant = null;

		const listData = await listRes.json();
		allProducts = listData.products || [];
		displayProduct();
		loadRelatedProducts();
		initCollapsibleSections();
	} catch (error) {
		console.error('Lỗi khi tải sản phẩm:', error);
		showError('Có lỗi xảy ra khi tải sản phẩm');
	}
}

function convertProductFormat(product) {
	if (!product) return null;
	const isLegacy = typeof product.ma_san_pham !== 'undefined';
	const id = isLegacy ? product.ma_san_pham : product.id;
	const name = isLegacy ? product.ten_san_pham : product.name;
	const price = Number(isLegacy ? product.gia : product.price) || 0;
	const image = isLegacy ? (product.hinh_anh_url || 'img/default.jpg') : (product.imageUrl || 'img/default.jpg');
	const description = isLegacy ? product.mo_ta : product.description;
	const categoryId = isLegacy ? product.danh_muc?.ma_danh_muc : product.categoryId;
	const categoryName = isLegacy ? product.danh_muc?.ten_danh_muc : product.categoryName;
	const type = (isLegacy ? product.loai_san_pham : product.type || product.productType) || 'LEN';
	
	// Xử lý biến thể: API mới trả về `variants`, định dạng cũ là `bien_the`
	let variants = [];
	if (product.variants && Array.isArray(product.variants)) {
		// Định dạng API mới
		variants = product.variants.map(v => ({
			ma_bien_the: v.id,
			mau_sac: v.color,
			kich_co: v.size,
			chat_lieu: v.material,
			url_hinh_anh_bien_the: v.imageUrl || v.imagePath,
			gia_them: v.extraPrice || 0
		}));
	} else if (product.bien_the && Array.isArray(product.bien_the)) {
		// Định dạng cũ
		variants = product.bien_the;
	}

	return {
		id,
		name,
		cost: price,
		originalCost: price,
		hasDiscount: false,
		discountPercent: 0,
		description: description || '',
		detailedDescription: description || '',
		material: type,
		stock: 99,
		code: id,
		catalogries: categoryId,
		categoryName,
		images: {
			main: image,
			thumbnails: variants.length ? variants.map(v => v.url_hinh_anh_bien_the || image) : [image]
		},
		colors: variants.map((variant, index) => ({
			id: variant.ma_bien_the,
			name: variant.mau_sac,
			available: true,
			image: variant.url_hinh_anh_bien_the || image,
			variant: variant,
			active: index === 0
		})),
		variants: variants,
		originalProduct: {
			...product,
			gia: price,
			hinh_anh_url: image,
			khuyen_mai: product.khuyen_mai || [],
			danh_muc: product.danh_muc || { ma_danh_muc: categoryId, ten_danh_muc: categoryName },
			loai_san_pham: type,
			bien_the: variants
		}
	};
}


// Hiển thị thông tin sản phẩm
function displayProduct() {
     if (!currentProduct) 
         return;
    
    // Cập nhật breadcrumb
    document.getElementById('product-name').textContent = currentProduct.name;
    
    // Cập nhật hình ảnh chính của sản phẩm
    const mainImage = currentProduct.images.main || currentProduct.originalProduct.hinh_anh_url;
    document.getElementById('main-product-image').src = mainImage;
    document.getElementById('main-product-image').alt = currentProduct.name;
    
    // Cập nhật hình ảnh thumbnail
    
    const thumbnailContainer = document.getElementById('thumbnail-images');
    const thumbnails = currentProduct.images.thumbnails || [mainImage];
    if (thumbnails.length > 0) {
        thumbnailContainer.innerHTML = thumbnails.map((thumb, index) => `
            <img src="${thumb}" alt="${currentProduct.name}" class="${index === 0 ? 'active' : ''}" onclick="changeMainImage('${thumb}')">
        `).join('');
    } else {
        thumbnailContainer.innerHTML = `
            <img src="${mainImage}" alt="${currentProduct.name}" class="active" onclick="changeMainImage('${mainImage}')">
        `;
    }
    
    // Cập nhật tên sản phẩm
    document.getElementById('product-title').textContent = currentProduct.name;
    
    // Cập nhật mã sản phẩm
    document.getElementById('product-code').textContent = currentProduct.code || currentProduct.id || '-';
    
    // Cập nhật giá sản phẩm
    updateProductPrice();
    
    // Cập nhật mô tả sản phẩm
    const detailedDesc = currentProduct.detailedDescription || currentProduct.description || '';
    document.getElementById('detailed-description').innerHTML = detailedDesc.replace(/\n/g, '<br>');
    
    // Cập nhật chất liệu
    document.getElementById('product-material').textContent = currentProduct.material || 'LEN';
    
    // Cập nhật thông tin tồn kho
    const stock = currentProduct.stock || 0;
    document.getElementById('stock-info').textContent = `${stock} sản phẩm có sẵn`;
    
    // Đặt biến thể đầu tiên làm mặc định
    if (currentProduct.variants && currentProduct.variants.length > 0) {
        selectedVariant = currentProduct.variants[0].ma_bien_the;
    }
    
    // Tải các tùy chọn màu sắc
    loadColorOptions();
}

// Cập nhật hiển thị giá sản phẩm (bao gồm giá gốc nếu có giảm giá)
function updateProductPrice() {
    const priceContainer = document.getElementById('product-price');
    const selectedVariantData = currentProduct.variants.find(v => v.ma_bien_the == selectedVariant);
    
    // Tính giá cơ bản với biến thể
    let basePrice = (currentProduct.originalProduct.gia || 0) + (selectedVariantData?.gia_them || 0);
    let finalPrice = basePrice;
    let hasDiscount = false;
    let discountPercent = 0;
    
    // Áp dụng giảm giá nếu có
    if (currentProduct.originalProduct.khuyen_mai && currentProduct.originalProduct.khuyen_mai.length > 0) {
        const activePromo = currentProduct.originalProduct.khuyen_mai.find(promo => {
            const now = new Date();
            const start = new Date(promo.ngay_bat_dau);
            const end = new Date(promo.ngay_ket_thuc);
            return now >= start && now <= end;
        });
        if (activePromo) {
            hasDiscount = true;
            discountPercent = activePromo.phan_tram_giam;
            finalPrice = basePrice * (1 - discountPercent / 100);
        }
    }
    
    // Hiển thị giá: nếu có giảm giá thì hiển thị cả giá gốc và giá đã giảm
    if (hasDiscount) {
        priceContainer.innerHTML = `
            <span class="current-price" style="color: #8B4513; font-weight: 700;">${formatPrice(finalPrice)}</span>
            <span class="original-price" style="color: #999; text-decoration: line-through; margin-left: 10px; font-size: 0.9em;">${formatPrice(basePrice)}</span>
            <span class="discount-badge" style="background: #e91e63; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; margin-left: 10px;">-${discountPercent}%</span>
        `;
    } else {
        priceContainer.innerHTML = `<span class="current-price" style="color: #8B4513; font-weight: 700;">${formatPrice(finalPrice)}</span>`;
    }
}

// Định dạng giá theo định dạng tiếng Việt
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Tải các tùy chọn màu sắc từ biến thể
function loadColorOptions() {
    const colorContainer = document.getElementById('color-options');

    if (!currentProduct.variants || currentProduct.variants.length === 0) {
        colorContainer.innerHTML = '<p>Không có biến thể</p>';
        return;
    }

    colorContainer.innerHTML = currentProduct.variants.map((v, i) => {
        const text = `${v.mau_sac} – ${v.kich_co}`;
        return `
            <button class="color-option ${i === 0 ? 'active' : ''}"
                data-variant-id="${v.ma_bien_the}"
                onclick="selectVariant('${v.ma_bien_the}', '${v.url_hinh_anh_bien_the || currentProduct.images.main}')">
                ${text}
            </button>
        `;
    }).join('');

    selectedVariant = currentProduct.variants[0].ma_bien_the;
}



// Chọn biến thể (màu sắc)
function selectVariant(variantId, imageUrl) {
    selectedVariant = variantId;

    const variant = currentProduct.variants.find(v => v.ma_bien_the == variantId);
    const stock = variant?.ton_kho?.so_luong_ton ?? currentProduct.stock ?? 99;

    document.getElementById('stock-info').textContent = `${stock} sản phẩm có sẵn`;

    updateProductPrice();

    document.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-variant-id="${variantId}"]`)?.classList.add('active');

    if (imageUrl) {
        changeMainImage(imageUrl);
    }
}


// Thay đổi hình ảnh chính
function changeMainImage(imageSrc) {
    const mainImage = document.getElementById('main-product-image');
    mainImage.src = imageSrc;

    const thumbnails = document.querySelectorAll('#thumbnail-images img');
    thumbnails.forEach((img, index) => {
        img.classList.remove('active');
        if (img.src === imageSrc) {
            img.classList.add('active');
            currentThumbIndex = index; // đồng bộ chỉ số
        }
    });
}




// Cuộn thumbnail
let currentThumbIndex = 0;

function scrollThumbnails(direction) {
    const thumbnails = document.querySelectorAll('#thumbnail-images img');
    if (thumbnails.length === 0) return;

    // Tính index mới
    currentThumbIndex += direction;

    if (currentThumbIndex < 0) currentThumbIndex = thumbnails.length - 1;
    if (currentThumbIndex >= thumbnails.length) currentThumbIndex = 0;

    const newImage = thumbnails[currentThumbIndex].src;

    // Đổi ảnh chính
    changeMainImage(newImage);

    // Cập nhật active thumbnail
    thumbnails.forEach(img => img.classList.remove('active'));
    thumbnails[currentThumbIndex].classList.add('active');
}


// Tải sản phẩm liên quan/tương tự
function loadRelatedProducts() {
    if (!currentProduct || !allProducts.length) return;
    
    const relatedProducts = getRelatedProducts();
    const similarContainer = document.getElementById('similar-products');
    
    if (!relatedProducts.length) {
        similarContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Không có sản phẩm tương tự</p>';
        return;
    }
    
    similarContainer.innerHTML = relatedProducts.map(product => {
        const converted = convertProductFormat(product);
        if (!converted) return '';
        const image = converted.images.main;
        return `
            <div class="similar-item" onclick="goToProduct('${converted.id}')">
                <img src="${image}" alt="${converted.name}">
                <div class="similar-item-info">
                    <div class="similar-item-title">${converted.name}</div>
                    <div class="similar-item-price">${formatPrice(converted.cost || 0)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function getRelatedProducts() {
    return allProducts.filter(p => p.id != currentProduct.id).slice(0, 10);
}

// Điều hướng đến trang chi tiết sản phẩm
function goToProduct(productId) {
    window.location.href = `detail.html?id=${productId}`;
}

// Hàm thay đổi số lượng
function changeQuantity(delta) {
    const quantityInput = document.getElementById('quantity');
    const stockInfo = document.getElementById('stock-info');
    const stock = parseInt(stockInfo.textContent.match(/\d+/)?.[0] || 99);
    
    let currentQty = parseInt(quantityInput.value) || 1;
    let newQty = currentQty + delta;
    
    // Đảm bảo số lượng nằm trong khoảng từ 1 đến tồn kho
    newQty = Math.max(1, Math.min(stock, newQty));
    
    quantityInput.value = newQty;
}

// Khởi tạo các phần có thể thu gọn
function initCollapsibleSections() {
    // Phần đầu tiên mở mặc định
    const firstSection = document.querySelector('.detail-section');
}

// Chuyển đổi trạng thái phần có thể thu gọn
function toggleSection(button) {
    const section = button.closest('.detail-section');
    const isActive = section.classList.contains('active');
    
    // Đóng tất cả các phần
    document.querySelectorAll('.detail-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Chuyển đổi phần hiện tại
    if (!isActive) {
        section.classList.add('active');
    }
}


// Thêm vào giỏ hàng( sua doi sang kieu lay du lieu xuat thanh json gui request den api them vao gio hang )
function addToCart() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const selectedVariantData = currentProduct.variants.find(v => v.ma_bien_the == selectedVariant);
    
    // Tính giá cuối cùng với biến thể và giảm giá
    let basePrice = (currentProduct.originalProduct.gia || 0) + (selectedVariantData?.gia_them || 0);
    
    // Áp dụng giảm giá nếu có
    if (currentProduct.originalProduct.khuyen_mai && currentProduct.originalProduct.khuyen_mai.length > 0) {
        const activePromo = currentProduct.originalProduct.khuyen_mai.find(promo => {
            const now = new Date();
            const start = new Date(promo.ngay_bat_dau);
            const end = new Date(promo.ngay_ket_thuc);
            return now >= start && now <= end;
        });
        if (activePromo) {
            basePrice = basePrice * (1 - activePromo.phan_tram_giam / 100);
        }
    }
    
    const productToAdd = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: basePrice,
        image: selectedVariantData?.url_hinh_anh_bien_the || currentProduct.images.main,
        variant: selectedVariantData,
        quantity: quantity,
        ma_san_pham: currentProduct.id,
        ma_bien_the: selectedVariant,
        mau_sac: selectedVariantData?.mau_sac || ''
    };
    
    // Lấy giỏ hàng hiện có từ localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Kiểm tra xem sản phẩm với cùng biến thể đã tồn tại trong giỏ hàng chưa
    const existingIndex = cart.findIndex(item => 
        item.ma_san_pham == productToAdd.ma_san_pham && 
        item.ma_bien_the == productToAdd.ma_bien_the
    );
    
    if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push(productToAdd);
    }
    
    // Lưu vào localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Hiển thị thông báo
    alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    
    // Cập nhật số lượng giỏ hàng nếu hàm tồn tại
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
}

// Mua ngay
function buyNow() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    // Thêm vào giỏ hàng trước
    addToCart();
    
    // Chuyển hướng đến trang thanh toán hoặc giỏ hàng
    window.location.href = 'bill.html';
}

// Hiển thị thông báo lỗi
function showError(message) {
    const detailDiv = document.getElementById('detail');
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
    const container = document.getElementById('similar-products');
    const scrollAmount = 220; // Chiều rộng item + khoảng cách
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadProduct();
});