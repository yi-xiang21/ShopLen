// JavaScript cho trang giỏ hàng
let allProducts = [];
let cartData = [];

// Tải danh sách sản phẩm từ products.json(tai thong tins an pham gio hang tu api get thong tin gio hang )
async function loadProducts() {
    try {
        const response = await fetch('api/products.json');
        const data = await response.json();
        allProducts = data.products || [];
        return allProducts;
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        return [];
    }
}

// Tải dữ liệu giỏ hàng từ localStorage
function loadCartFromStorage() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

// Lưu dữ liệu giỏ hàng vào localStorage
function saveCartToStorage(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Lấy thông tin sản phẩm từ products.json dựa trên ma_san_pham
function getProductInfo(maSanPham) {
    return allProducts.find(p => p.ma_san_pham == maSanPham);
}

// Định dạng giá theo định dạng tiếng Việt
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Hiển thị các sản phẩm trong giỏ hàng
function renderCartItems() {
    const cartContainer = document.getElementById('cart-items');
    
    if (!cartContainer) return;
    
    cartData = loadCartFromStorage();
    
    if (cartData.length === 0) {
        cartContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <p style="font-size: 18px; margin-bottom: 20px;">Giỏ hàng của bạn đang trống</p>
                <a href="shop.html" style="color: #8B4513; text-decoration: underline;">Tiếp tục mua sắm</a>
            </div>
        `;
        updateTotalPrice();
        return;
    }
    
    // Render từng sản phẩm trong giỏ hàng
    cartContainer.innerHTML = cartData.map((item, index) => {
        const productInfo = getProductInfo(item.ma_san_pham);
        const productName = item.name || (productInfo ? productInfo.ten_san_pham : 'Sản phẩm không xác định');
        const productImage = item.image || (productInfo ? productInfo.hinh_anh_url : '');
        const variantInfo = item.mau_sac ? `Màu: ${item.mau_sac}` : '';
        const price = item.price || 0;
        const quantity = item.quantity || 1;
        const total = price * quantity;
        
        return `
            <div class="cart-row" data-index="${index}" data-ma-san-pham="${item.ma_san_pham}" data-ma-bien-the="${item.ma_bien_the || ''}">
                <div class="product-col">
                    <img class="product-thumb" src="${productImage}" alt="${productName}">
                    <div class="product-info">
                        <div class="name">${productName}</div>
                        <div class="meta">${variantInfo}</div>
                        <button class="remove-cart-btn" data-index="${index}">Xóa</button>
                    </div>
                </div>
                <div class="right-grid">
                    <div class="price-col">${formatPrice(price)}</div>
                    <div class="qty-col">
                        <div class="qty-control">
                            <button data-action="dec" data-index="${index}">-</button>
                            <input class="qty-input" type="number" value="${quantity}" min="1" data-index="${index}">
                            <button data-action="inc" data-index="${index}">+</button>
                        </div>
                    </div>
                    <div class="total-col">${formatPrice(total)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Gắn sự kiện cho các nút
    attachEventHandlers();
    updateTotalPrice();
}

// Gắn sự kiện cho các nút (tăng, giảm, xóa)
function attachEventHandlers() {
    // Nút xóa
    document.querySelectorAll('.remove-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const index = parseInt(btn.getAttribute('data-index'));
            removeCartItem(index);
        });
    });
    
    // Nút tăng số lượng
    document.querySelectorAll('[data-action="inc"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const index = parseInt(btn.getAttribute('data-index'));
            updateQuantity(index, 1);
        });
    });
    
    // Nút giảm số lượng
    document.querySelectorAll('[data-action="dec"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const index = parseInt(btn.getAttribute('data-index'));
            updateQuantity(index, -1);
        });
    });
    
    // Input số lượng
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(input.getAttribute('data-index'));
            const newQty = parseInt(input.value) || 1;
            if (newQty < 1) {
                input.value = 1;
                updateQuantity(index, 0);
            } else {
                setQuantity(index, newQty);
            }
        });
    });
}

// Xóa sản phẩm khỏi giỏ hàng
function removeCartItem(index) {
    cartData = loadCartFromStorage();
    if (index >= 0 && index < cartData.length) {
        cartData.splice(index, 1);
        saveCartToStorage(cartData);
        renderCartItems();
    }
}

// Cập nhật số lượng sản phẩm
function updateQuantity(index, delta) {
    cartData = loadCartFromStorage();
    if (index >= 0 && index < cartData.length) {
        const currentQty = cartData[index].quantity || 1;
        const newQty = Math.max(1, currentQty + delta);
        
        if (newQty < 1) {
            removeCartItem(index);
        } else {
            cartData[index].quantity = newQty;
            saveCartToStorage(cartData);
            renderCartItems();
        }
    }
}

// Đặt số lượng sản phẩm
function setQuantity(index, quantity) {
    cartData = loadCartFromStorage();
    if (index >= 0 && index < cartData.length) {
        cartData[index].quantity = Math.max(1, quantity);
        saveCartToStorage(cartData);
        renderCartItems();
    }
}

// Cập nhật tổng giá
function updateTotalPrice() {
    const totalPriceElement = document.getElementById('total-price');
    if (!totalPriceElement) return;
    
    cartData = loadCartFromStorage();
    let total = 0;
    
    cartData.forEach(item => {
        const price = item.price || 0;
        const quantity = item.quantity || 1;
        total += price * quantity;
    });
    
    totalPriceElement.textContent = formatPrice(total);
}

// Khởi tạo trang giỏ hàng
async function initCart() {
    // Tải danh sách sản phẩm trước
    await loadProducts();
    
    // Hiển thị các sản phẩm trong giỏ hàng
    renderCartItems();
    
    // Cập nhật tổng giá ban đầu
    updateTotalPrice();
}

// Chạy khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    initCart();
});