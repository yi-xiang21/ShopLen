document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    setupEventListeners();
});

function formatDateTime(value) {
    const date = new Date(value);
    if (isNaN(date)) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatCurrency(value) {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

async function loadOrders() {

    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(getApiUrl('/orders/all'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.status === 'success') {
            renderOrderList(data.data);
        }
    } catch (err) {
        console.error("Lỗi tải đơn: ", err);
    }
}

// Setup event listeners
function setupEventListeners() {
    document.addEventListener('click', async function(event) {
        // Update order status
        if (event.target && event.target.id === 'btn-updateStatus') {
            const select = document.querySelector('.select-status');
            const maDonHangElement = document.getElementById('maDonHang');
            const orderId = maDonHangElement ? maDonHangElement.getAttribute('data-order-id') : null;
            const newStatus = select ? select.value : null;
            
            if (!orderId || !newStatus) {
                alert('Thiếu thông tin đơn hàng hoặc trạng thái mới');
                return;
            }
            
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const res = await fetch(getApiUrl(`/orders/${orderId}/status`), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ newStatus: newStatus })
                });
                
                const data = await res.json();
                
                if (data.status === 'success') {
                    alert('✅ Cập nhật trạng thái đơn hàng thành công');
                    // Tải lại danh sách đơn hàng
                    loadOrders();
                    // Cập nhật lại chi tiết đơn hàng nếu đang xem
                    viewOrderDetails(orderId);
                } else {
                    alert('❌ Lỗi cập nhật trạng thái: ' + (data.message || ''));
                }
            } catch (err) {
                console.error("Lỗi cập nhật trạng thái đơn hàng: ", err);
                alert('❌ Có lỗi xảy ra khi cập nhật trạng thái đơn hàng');
            }
        }
    });
}

// Hàm xem chi tiết đơn hàng
async function viewOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(getApiUrl(`/orders/${orderId}`), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'success') {
            renderOrderDetails(data.data);
        } else {
            alert('Lỗi: ' + (data.message || 'Không thể tải chi tiết đơn hàng'));
        }
    } catch (err) {
        console.error("Lỗi xem chi tiết đơn hàng: ", err);
        alert('Có lỗi xảy ra khi tải chi tiết đơn hàng');
    }
}

function renderOrderDetails(orderDetail) {
    const { order, items = [] } = orderDetail || {};
    if (!order) return;

    const orderview = document.getElementById('order-view');
    const ordermain = document.getElementById('order-main');
    if (orderview && ordermain) {
        ordermain.style.display = 'none';
        orderview.style.display = 'block';
    }

    const detailContainer = document.getElementById('order-detail');
    if (!detailContainer) return;

    detailContainer.innerHTML = `
        <div id="order-detail-left">
            <div id="order-detail-main" class="card">
                <div class="order-main-row">
                    <div class="order-status">
                        <label class="muted">Ngày đặt</label>
                        <div id="order-date">${formatDateTime(order.ngay_dat_hang)}</div>
                    </div>
                    <div class="order-actions">
                        <select name="action-status" class="select-status">
                            <option value="cho_xu_ly">Chờ xử lý</option>
                            <option value="dang_xu_ly">Đang xử lý</option>
                            <option value="dang_giao">Đang vận chuyển</option>
                            <option value="hoan_thanh">Hoàn thành</option>
                            <option value="huy_don">Hủy đơn</option>
                        </select>
                        <button class="btn btn-primary" id="btn-updateStatus">Cập nhật trạng thái</button>
                    </div>
                </div>
                <div class="order-meta">
                    <div class="customer-card">
                        <div class="customer-info">
                            <div class="name">${order.ho_ten || ''}</div>
                            <div class="muted" id="numberphone">${order.so_dien_thoai || ''}</div>
                            <div class="muted" id="adress">${order.dia_chi_giao_hang || ''}</div>
                        </div>
                    </div>
                    <div class="order-summary">
                        <div id="maDonHang" data-order-id="${order.ma_don_hang}"><strong>Mã đơn:</strong>${order.ma_don_hang}</div>
                        <div class="total"><strong>Tổng tiền:</strong>${formatCurrency(order.tong_tien)}</div>
                    </div>
                </div>
            </div>

            <div id="order-detail-product" class="card">
                <h4>Thông tin sản phẩm</h4>
                <div class="list-product-order"></div>
            </div>
        </div>
        <div id="order-detail-right">
            <div id="order-detail-ship" class="card widget">
                <h4>Thông tin vận chuyển</h4>
                <div class="muted"><strong>Phương thức:</strong> Giao hàng</div>
                <div class="muted"><strong>Đơn vị:</strong> GHTK</div>
                <div class="muted"><strong>Mã vận đơn:</strong> 1Z999AA1234567890</div>
                <div class="muted"><strong>Dự kiến:</strong> Nov 6, 2025</div>
                <div class="muted"><strong>Thực tế:</strong> <span class="success">Nov 6, 2025</span></div>
            </div>

            <div id="order-detail-payment" class="card widget">
                <h4>Chi tiết thanh toán</h4>
                <div><strong>Trạng thái:</strong> <span class="badge-paid">${order.trang_thai_thanh_toan || 'Chưa thanh toán'}</span></div>
                <div class="muted"><strong>Phương thức:</strong> ${order.phuong_thuc_thanh_toan || 'COD'}</div>
                <div class="muted"><strong>Mã giao dịch:</strong>${order.ma_tham_chieu || 'N/A'}</div>

                <div class="summary">
                    <div><span>Tạm tính:</span><span>${formatCurrency(order.tong_tien)}</span></div>
                    <div><span>Vận chuyển:</span><span>Miễn phí</span></div>
                    <div><span>Thuế:</span><span>0</span></div>
                    <div class="total-row"><strong>Tổng:</strong><strong>${formatCurrency(order.tong_tien)}</strong></div>
                </div>
            </div>

            <div id="order-detail-actions" class="card widget actions">
                <button class="btn btn-primary full">Gửi email khách</button>
                <button class="btn btn-outline full">In nhãn vận chuyển</button>
                <button class="btn btn-danger full">Hoàn tiền</button>
                <button class="btn btn-outline full" id="btn-back">Quay lại</button>
            </div>
        </div>
    `;

    const selectStatus = detailContainer.querySelector('.select-status');
    if (selectStatus) {
        selectStatus.value = order.trang_thai;
    }

    const listProductOrder = detailContainer.querySelector('.list-product-order');
    if (listProductOrder) {
        listProductOrder.innerHTML = '';
        items.forEach(item => {
            const productRow = document.createElement('div');
            productRow.className = 'product-row';
            productRow.innerHTML = `
                <img src="${item.url_hinh_anh_bien_the || item.hinh_anh_url || ''}" alt="product" class="product-thumb">
                <div class="product-info">
                    <h5>${item.ten_san_pham || ''}</h5>
                    <div class="product-meta">
                        <div><strong>Mã sản phẩm:</strong>${item.ma_san_pham || ''}</div>
                        <div><strong>Màu:</strong>${item.mau_sac || ''}</div>
                        <div><strong>Khối lượng:</strong> ${item.kich_co || ''}</div>
                        <div><strong>Số lượng:</strong> ${item.so_luong}</div>
                        <div class="muted price">Giá: ${formatCurrency(item.gia)}</div>
                    </div>
                </div>
            `;
            listProductOrder.appendChild(productRow);
        });
    }

    const btnback = detailContainer.querySelector('#btn-back');
    if (btnback && orderview && ordermain) {
        btnback.addEventListener('click', () => {
            orderview.style.display = 'none';
            ordermain.style.display = 'block';
        });
    }
}

function renderOrderList(orders) {
    const container = document.getElementById('order-items');
    if (!container) return;

    container.innerHTML = '';

    orders.forEach(order => {
        const item = document.createElement('div');
        item.className = 'order-row';

        // map status -> text + class
        const statusMap = {
            cho_xu_ly: { text: 'Chờ xử lý', class: 'pending' },
            dang_xu_ly: { text: 'Đang xử lý', class: 'processing' },
            dang_giao: { text: 'Đang giao', class: 'shipping' },
            hoan_thanh: { text: 'Hoàn thành', class: 'done' },
            da_huy: { text: 'Đã hủy', class: 'cancel' }
        };

        const status = statusMap[order.trang_thai] || {
            text: order.trang_thai,
            class: 'pending'
        };

        item.innerHTML = `
            <p class="col-id" >${order.ma_don_hang}</p>
            <p class="col-user">${order.ho_ten}</p>
            <p class="col-total">
                ${formatCurrency(order.tong_tien)}
            </p>
            <p class="col-status">
                <span class="status ${status.class}">
                    ${status.text}
                </span>
            </p>
            <p class="col-date">
                ${formatDateTime(order.ngay_dat_hang)}
            </p>
            <p class="col-action">
                <button class="view-order-btn" data-order-id="${order.ma_don_hang}" onclick="viewOrderDetails('${order.ma_don_hang}') ">
                    Xem
                </button>
            </p>
        `;

        container.appendChild(item);
    });

   
}



