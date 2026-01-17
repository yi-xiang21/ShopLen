document.addEventListener('DOMContentLoaded', () => {
    loadMyOrders();
});

// Hàm format tiền tệ
const currencyFormat = new Intl.NumberFormat(
    'vi-VN', 
    { style: 'currency', currency: 'VND' }
);

// Load danh sách đơn hàng
async function loadMyOrders() {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return; // Chưa login

        const res = await fetch(getApiUrl('/orders/user-orders'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        
        const container = document.querySelector('.orders-wrapper');
        container.innerHTML = '';

        if (data.data.length === 0) {
            container.innerHTML = '<p>Bạn không có đơn hàng nào.</p>';
            return;
        }
        console.log(data.data);
        data.data.forEach(order => {
            // Render đơn hàng
            if (order.trang_thai !== 'hoan_thanh') 
            {
                const date = new Date(order.ngay_dat_hang).toLocaleDateString('vi-VN');
            const html = 
            `
            <div class="order-item">
                <div class="order-content">
                    <div class="order-status">
                        <span class="status-text ${getStatusColor(order.trang_thai)}">${formatStatus(order.trang_thai)}</span>
                        <span class="order-total">${currencyFormat.format(order.tong_tien)}</span>
                    </div>
                    <div class="order-actions">
                        <button class="btn viewOrder-btn" onclick="viewOrderDetail('${order.ma_don_hang}')">Xem chi tiết</button>
                        ${order.trang_thai === 'cho_xu_ly' ? `<button class="btn delOrder-btn" onclick="cancelOrder('${order.ma_don_hang}')" style="display: block;">Huỷ đơn</button>`   : ''}
                    </div>
                </div>
                <div class="order-info">
                    <p>Mã đơn: <span class="order-id">${order.ma_don_hang}</span></p>
                    <p>Ngày đặt: <span class="order-date">${date}</span></p>
                </div>
            </div>
            `
            container.innerHTML += html;
            }
            
        });
    } catch (error) {
        showError('Lỗi', 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
        const container = document.querySelector('.orders-wrapper');
        container.innerHTML = `
        <p>Không thể tải đơn hàng.</p>
        <button onclick="loadOrders()" style="margin-top: 10px; padding: 8px 16px;">
            Thử lại
        </button>
    `;
    }
}

// Xem chi tiết đơn hàng
async function viewOrderDetail(orderId) {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const res = await fetch(getApiUrl(`/orders/${orderId}`), {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await res.json();
        
        if (result.status === 'success') {
            const { order, items } = result.data;
            renderOrderDetail(order, items);

            // Hiển thị giao diện chi tiết đơn hàng
            document.querySelector('.orders-wrapper').style.display = 'none';
            document.querySelector('.order-detail-wrapper').style.display = 'block';
        }
    } catch (error) {
    }
}

// Huỷ đơn hàng
async function cancelOrder(orderId) {
    const confirmed = await showConfirm(
        'Huỷ đơn hàng',
        'Bạn có chắc chắn muốn huỷ đơn hàng này?',
        {
            type: 'warning',
            confirmText: 'Huỷ',
            cancelText: 'Giữ lại',
            confirmClass: 'danger'
        }
    );
    if (!confirmed) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
        const res = await fetch(getApiUrl(`/orders/${orderId}/cancel`), {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        if (data.status === 'success') {
            showSuccess('Thành công', 'Đơn hàng đã được huỷ.');
            loadMyOrders();
        } else {
            showError('Lỗi', data.message || 'Không thể huỷ đơn hàng.');
        }
    } catch (err) {
        showError('Lỗi', 'Đã xảy ra lỗi. Vui lòng thử lại.');
    }
}

// Render chi tiết đơn hàng
function renderOrderDetail(order, items) {
    const infoGrids = document.querySelectorAll('.order-detail-wrapper .order-info-grid');

    // Cập nhật trạng thái đơn hàng
    const statusEl = document.querySelector('.order-detail-header .order-status');
    if (statusEl) {
        statusEl.innerText = formatStatus(order.trang_thai);
        statusEl.className = `order-status ${getStatusColor(order.trang_thai)}`;
    }
    
    
    // Fill thông tin đơn hàng (Grid đầu tiên)
    if (infoGrids[0]) {
        infoGrids[0].innerHTML = 
        `
            <p><strong>Mã đơn hàng:</strong> ${order.ma_don_hang}</p>
            <p><strong>Ngày đặt:</strong> ${new Date(order.ngay_dat_hang).toLocaleString('vi-VN')}</p>
            <p><strong>Trạng thái thanh toán:</strong> ${order.trang_thai_thanh_toan === 'da_thanh_toan' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
            <p><strong>Đơn vị vận chuyển:</strong> Xe đạp giao hàng (Free)</p>
        `;
    }

    // Fill thông tin giao hàng (Grid thứ hai)
    if (infoGrids[1]) {
        infoGrids[1].innerHTML = 
        `
            <p><strong>Họ tên:</strong> ${order.ho_ten || 'Khách lẻ'}</p>
            <p><strong>Email:</strong> ${order.email || ''}</p>
            <p><strong>Số điện thoại:</strong> ${order.so_dien_thoai || ''}</p>
            <p><strong>Địa chỉ:</strong> ${order.dia_chi_giao_hang || ''}</p>
        `;
    }

    // Fill Ghi chú
    const noteEl = document.querySelector('.order-note');
    if (noteEl) {
        noteEl.innerHTML = `<strong>Ghi chú:</strong> ${order.ghi_chu || 'Không có'}`;
    }

    // Fill danh sách sản phẩm
    const itemsContainer = document.querySelector('.order-product').parentNode;
    let itemsHtml = '';
    items.forEach(item => {
        const img = item.url_hinh_anh_bien_the || item.hinh_anh_url || 'img/default.png';
        itemsHtml += `
            <div class="order-product">
                <img src="${img}" alt="">
                <div class="product-info">
                    <p class="product-name">${item.ten_san_pham}</p>
                    <p>Màu / Kích cỡ: ${item.mau_sac || ''} / ${item.kich_co || ''}</p>
                    <p>Số lượng: ${item.so_luong}</p>
                </div>
                <div class="product-price">${currencyFormat.format(item.tong_tien * item.so_luong || item.gia * item.so_luong)}</div>
            </div>
        `;
    });
    
    if(itemsContainer) {
        itemsContainer.innerHTML = `<h3>Sản phẩm đã đặt</h3>` + itemsHtml;
    }

    document.querySelector('.final-total span').innerText = currencyFormat.format(order.tong_tien);
    document.querySelector('.temp-total span').innerText = currencyFormat.format(order.tong_tien);
}

// Màu sắc trạng thái
function getStatusColor(status) {
    
    if(status === 'hoan_thanh') return 'completed';
    if(status === 'da_huy') return 'cancelled';
    if(status === 'dang_giao') return 'shipping';
    if(status === 'cho_xu_ly') return 'pending';
    if(status === 'dang_xu_ly') return 'processing';
}

// Format status đơn hàng
function formatStatus(status) {
    const map = {
        'cho_xu_ly': 'Chờ xử lý',
        'dang_xu_ly': 'Đang xử lý',
        'dang_giao': 'Đang giao hàng',
        'hoan_thanh': 'Hoàn thành',
        'da_huy': 'Đã huỷ'
    };
    return map[status] || status;
}

// Logic nút Quay lại
document.querySelector('.btn-backToOrder').addEventListener('click', () => {
    document.querySelector('.order-detail-wrapper').style.display = 'none';
    document.querySelector('.orders-wrapper').style.display = 'block';
});