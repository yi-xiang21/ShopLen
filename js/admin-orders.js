document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
});

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

function renderOrderList(orders) {
    console.log('Đơn hàng tải về: ', orders);
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
                ${new Intl.NumberFormat('vi-VN').format(order.tong_tien)} đ
            </p>
            <p class="col-status">
                <span class="status ${status.class}">
                    ${status.text}
                </span>
            </p>
            <p class="col-date">
                ${new Date(order.ngay_dat_hang).toLocaleDateString('vi-VN')}
            </p>
            <p class="col-action">
                <button 
                    class="view-order-btn"
                    data-order-id="${order.ma_don_hang}">
                    Xem
                </button>
            </p>
        `;

        container.appendChild(item);
    });

    // gán sự kiện xem chi tiết
    container.querySelectorAll('.view-order-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.orderId;
            window.location.href = `order-details.html?id=${id}`;
        };
    });
}
