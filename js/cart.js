// JavaScript cho trang giỏ hàng - Logic Hybrid (Database + LocalStorage)

let cartData = [];
// Hàm tiện ích lấy URL API
const getEndpoint = (path) => (typeof getApiUrl === "function" ? getApiUrl(path) : path);

// Kiểm tra đăng nhập
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Tải dữ liệu Init
async function initCart() {
    const token = getToken();

    try {
        if (token) {
            // Khi đăng nhập load dữ liệu từ database lên giỏ hàng
            const res = await fetch(getEndpoint('/cart'), {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                cartData = data.cart || [];
            } else {
                console.error("Lỗi tải giỏ hàng server:", data);
                cartData = [];
            }
        } else {
            // Khi chưa đăng nhập load dữ liệu từ LocalStorage
            const local = localStorage.getItem('cart');
            cartData = local ? JSON.parse(local) : [];
        }
    } catch (err) {
        console.error("Init Cart Error:", err);
        cartData = [];
    }

    renderCartItems();
    updateTotalPrice();
}

// Gán đường dẫn hình ảnh sản phẩm
function resolveImage(url) {
    if (!url) return 'img/default.png';
    if (url.startsWith('http')) return url;
    return typeof getApiUrl === "function" ? getApiUrl(url) : url;
}

// Render HTML
function renderCartItems() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

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

    cartContainer.innerHTML = cartData.map((item, index) => {
        const productName = item.name || 'Sản phẩm';
        const productImage = resolveImage(item.image) ;
        const variantInfo = (item.mau_sac ? `Màu: ${item.mau_sac}` : '') + (item.kich_co ? ` - Size: ${item.kich_co}` : '');
        const price = Number(item.price) || 0;
        const transformPrice = formatPrice(price);
        
        const quantity = item.quantity || item.so_luong || 1; // API trả về quantity
        const total = (price * quantity) || 0;

        // data-attributes dùng để xử lý logic
        return `
            <div class="cart-row" data-index="${index}" data-variant-id="${item.ma_bien_the}">
                <div class="product-col">
                    <img class="product-thumb" src="${productImage}" alt="ko load dc">
                    <div class="product-info">
                        <div class="name">${productName}</div>
                        <div class="meta">${variantInfo}</div>
                        <button class="remove-cart-btn" onclick="removeItem(${index})">Xóa</button>
                    </div>
                </div>
                <div class="right-grid">
                    <div class="price-col">${transformPrice}</div>
                    <div class="qty-col">
                        <div class="qty-control">
                            <button onclick="changeQty(${index}, -1)">-</button>
                            <input class="qty-input" type="number" value="${quantity}" min="1" onblur="manualQty(${index}, this.value)">
                            <button onclick="changeQty(${index}, 1)">+</button>
                            
                        </div>
                    </div>
                    <div class="total-col">${formatPrice(total)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Actions Helper
async function performUpdate(index, newQty) {
    const token = getToken();
    const item = cartData[index];


    if (token) {
        // -- DB UPDATE --
        try {
            const url = newQty === 0 ? '/cart/remove' : '/cart/update';
            const body = { ma_bien_the: item.ma_bien_the, so_luong: newQty };
            
            const res = await fetch(getEndpoint(url), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                    if (newQty === 0) {
                        cartData.splice(index, 1);
                    } else {
                        cartData[index].quantity = newQty;
                    }
                    renderCartItems();
                    updateTotalPrice();
                    
            } else {
                alert("Lỗi cập nhật giỏ hàng: " + data.message);
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối server");
        }
    } else {
        // -- LOCAL UPDATE --
        if (newQty <= 0) {
            cartData.splice(index, 1);
        } else {
            cartData[index].quantity = newQty;
        }
        localStorage.setItem('cart', JSON.stringify(cartData));
        renderCartItems();
        updateTotalPrice();
        
    }
}

function removeItem(index) {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
        performUpdate(index, 0); // 0 means remove
    }
}

function changeQty(index, delta) {
    const currentQty = cartData[index].quantity || cartData[index].so_luong || 1;
    let newQty = currentQty + delta;
    if (newQty < 1) newQty = 1; // Min 1 via button
    performUpdate(index, newQty);
}

function manualQty(index, val) {
    let newQty = parseInt(val) || 1;
    if (newQty < 1) newQty = 1;
    performUpdate(index, newQty);
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function updateTotalPrice() {
    const totalPriceElement = document.getElementById('total-price');
    if (!totalPriceElement) return;

    let total = 0;
    cartData.forEach(item => {
        const p = Number(item.price) || 0;
        const q = Number(item.quantity) || Number(item.so_luong) || 1;
        total += p * q;
    });
    totalPriceElement.textContent = formatPrice(total);
}



// Start
document.addEventListener('DOMContentLoaded', initCart);