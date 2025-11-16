// JavaScript cho trang chi tiết sản phẩm
let currentProduct = null;
let allProducts = [];
let selectedVariant = null;

// Lấy ID sản phẩm từ tham số URL
function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Tải dữ liệu sản phẩm từ file products.json
async function loadProduct() {
    const productId = getProductId();
    try {
        // Lấy tất cả sản phẩm từ products.json
        const response = await fetch('api/products.json');
        const data = await response.json();
        allProducts = data.products || [];
        
        // Tìm sản phẩm cụ thể theo ma_san_pham
        const product = allProducts.find(p => p.ma_san_pham == productId);
        
        if (!product) {
            showError('Không tìm thấy sản phẩm');
            return;
        }

        // Chuyển đổi sản phẩm sang định dạng nội bộ
        currentProduct = convertProductFormat(product);

        // Hiển thị thông tin sản phẩm
        displayProduct();
        
        // Tải sản phẩm liên quan
        loadRelatedProducts();
        
        // Khởi tạo các tương tác
        initCollapsibleSections();
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        showError('Có lỗi xảy ra khi tải sản phẩm');
    }
}

// Chuyển đổi sản phẩm từ định dạng products.json sang định dạng nội bộ
function convertProductFormat(product) {
    // Lấy biến thể đầu tiên làm mặc định
    const firstVariant = product.bien_the && product.bien_the.length > 0 ? product.bien_the[0] : null;
    
    // Tính tổng tồn kho từ tất cả các biến thể
    const totalStock = product.bien_the ? 
        product.bien_the.reduce((sum, variant) => sum + (variant.ton_kho?.so_luong_ton || 0), 0) : 0;
    
    // Lấy chất liệu từ biến thể đầu tiên hoặc mặc định
    const material = firstVariant?.chat_lieu || 'LEN';
    
    // Tính giá với giảm giá nếu có
    let finalPrice = product.gia || 0;
    let hasDiscount = false;
    let discountPercent = 0;
    
    if (product.khuyen_mai && product.khuyen_mai.length > 0) {
        const activePromo = product.khuyen_mai.find(promo => {
            const now = new Date();
            const start = new Date(promo.ngay_bat_dau);
            const end = new Date(promo.ngay_ket_thuc);
            return now >= start && now <= end;
        });
        if (activePromo) {
            hasDiscount = true;
            discountPercent = activePromo.phan_tram_giam;
            finalPrice = finalPrice * (1 - discountPercent / 100);
        }
    }
    
    // Chuyển đổi biến thể sang định dạng màu sắc
    const colors = product.bien_the ? product.bien_the.map((variant, index) => ({
        id: variant.ma_bien_the,
        name: variant.mau_sac,
        hex: getColorHex(variant.mau_sac),
        available: (variant.ton_kho?.so_luong_ton || 0) > 0,
        image: variant.url_hinh_anh_bien_the || product.hinh_anh_url,
        variant: variant
    })) : [];
    
    return {
        id: product.ma_san_pham,
        name: product.ten_san_pham,
        cost: finalPrice,
        originalCost: product.gia,
        hasDiscount: hasDiscount,
        discountPercent: discountPercent,
        description: product.mo_ta || '',
        detailedDescription: product.mo_ta || '',
        material: material,
        stock: totalStock,
        code: product.ma_san_pham,
        catalogries: product.danh_muc?.ma_danh_muc,
        categoryName: product.danh_muc?.ten_danh_muc,
        images: {
            main: firstVariant?.url_hinh_anh_bien_the || product.hinh_anh_url,
            thumbnails: product.bien_the ? 
                product.bien_the.map(v => v.url_hinh_anh_bien_the || product.hinh_anh_url) : 
                [product.hinh_anh_url]
        },
        colors: colors,
        variants: product.bien_the || [],
        originalProduct: product
    };
}

// Lấy mã màu hex từ tên màu tiếng Việt
function getColorHex(colorName) {
    const colorMap = {
        'Hồng Pastel': '#FFB6C1',
        'Xanh Pastel': '#B0E0E6',
        'Đỏ': '#FF6B6B',
        'Xanh dương': '#4ECDC4',
        'Xanh lá': '#45B7D1',
        'Tím': '#96CEB4',
        'Trắng tinh': '#FFFFFF',
        'Đen': '#000000',
        'Xám': '#808080',
        'Hồng nhạt': '#FFB6C1',
        'Kem vàng': '#FFF8DC',
        'Nâu': '#8B4513',
        'Nâu cam': '#D2691E',
        'Kaki': '#C3B091',
        'Xanh cẩm': '#4169E1',
        'Tím khoai môn': '#9370DB',
        'Ghi': '#708090'
    };
    return colorMap[colorName] || '#CCCCCC';
}

// Hiển thị thông tin sản phẩm
function displayProduct() {
    if (!currentProduct) return;

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
    
    // Cập nhật giá sản phẩm (định dạng tiếng Việt)
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
    
    if (!currentProduct.colors || currentProduct.colors.length === 0) {
        colorContainer.innerHTML = '<p style="color: #666; font-size: 14px;">Không có tùy chọn màu sắc</p>';
        return;
    }
    
    colorContainer.innerHTML = currentProduct.colors.map((color, index) => {
        const isActive = index === 0;
        if (isActive && color.variant) {
            selectedVariant = color.variant.ma_bien_the;
        }
        
        return `
            <button class="color-option ${isActive ? 'active' : ''}" 
                    data-variant-id="${color.id}"
                    data-color-name="${color.name}"
                    onclick="selectVariant('${color.id}', '${color.image}')"
                    style="background-color: ${color.hex || '#ccc'};">
                ${color.variant.kich_co}
            </button>
        `;
    }).join('');
}

// Chọn biến thể (màu sắc)
function selectVariant(variantId, imageUrl) {
    selectedVariant = variantId;
    
    // Tìm biến thể
    const variant = currentProduct.variants.find(v => v.ma_bien_the == variantId);
    if (variant) {
        // Cập nhật thông tin tồn kho
        const stock = variant.ton_kho?.so_luong_ton || 0;
        document.getElementById('stock-info').textContent = `${stock} sản phẩm có sẵn`;
    }
    
    // Cập nhật giá (bao gồm cả giá gốc nếu có giảm giá)
    updateProductPrice();
    
    // Cập nhật trạng thái active
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-variant-id="${variantId}"]`)?.classList.add('active');
    
    // Cập nhật hình ảnh chính nếu biến thể có hình ảnh riêng
    if (imageUrl) {
        document.getElementById('main-product-image').src = imageUrl;
        changeMainImage(imageUrl);
    }
}

// Thay đổi hình ảnh chính
function changeMainImage(imageSrc) {
    document.getElementById('main-product-image').src = imageSrc;
    
    // Cập nhật thumbnail active
    document.querySelectorAll('.thumbnail-images img').forEach(img => {
        img.classList.remove('active');
        if (img.src.includes(imageSrc.split('/').pop())) {
            img.classList.add('active');
        }
    });
}

// Cuộn thumbnail
function scrollThumbnails(direction) {
    const container = document.querySelector('.thumbnail-images');
    const scrollAmount = 100;
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

// Tải sản phẩm liên quan/tương tự
function loadRelatedProducts() {
    if (!currentProduct || !allProducts.length) return;
    
    const relatedProducts = getRelatedProducts();
    const similarContainer = document.getElementById('similar-products');
    
    if (relatedProducts.length === 0) {
        similarContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Không có sản phẩm tương tự</p>';
        return;
    }
    
    similarContainer.innerHTML = relatedProducts.map(product => {
        const converted = convertProductFormat(product);
        const image = converted.images.main || product.hinh_anh_url;
        return `
            <div class="similar-item" onclick="goToProduct('${product.ma_san_pham}')">
                <img src="${image}" alt="${product.ten_san_pham}">
                <div class="similar-item-info">
                    <div class="similar-item-title">${product.ten_san_pham}</div>
                    <div class="similar-item-price">${formatPrice(converted.cost || product.gia || 0)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Lấy sản phẩm liên quan dựa trên danh mục
function getRelatedProducts() {
    if (!currentProduct) return [];

    const currentCategory = currentProduct.catalogries;
    const currentProductId = currentProduct.id;
    
    const related = allProducts.filter(product =>
        product.ma_san_pham != currentProductId &&
        product.danh_muc?.ma_danh_muc === currentCategory &&
        product.loai_san_pham === 'len' // Chỉ hiển thị sản phẩm len, không hiển thị workshop
    );

    // Nếu không có sản phẩm liên quan theo danh mục, trả về sản phẩm ngẫu nhiên
    if (related.length === 0) {
        return allProducts
            .filter(product => 
                product.ma_san_pham != currentProductId && 
                product.loai_san_pham === 'len'
            )
            .slice(0, 8);
    }

    // Trả về tối đa 8 sản phẩm liên quan
    return related.slice(0, 8);
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


// Thêm vào giỏ hàng
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