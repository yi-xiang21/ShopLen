document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
});

async function loadOrders() {
    // Check if containers exist
    const colId = document.getElementById('order-id');
    if (!colId) return;

    // Show loading state in the first column or main container
    colId.innerHTML = '...';

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
    // 1. Get Column Containers
    const colId = document.getElementById('order-id');
    const colCus = document.getElementById('order-cus');
    const colCost = document.getElementById('order-cost');
    const colStatus = document.getElementById('order-status');
    const colDate = document.getElementById('order-date');
    const colAction = document.getElementById('order-action');

    // 2. Clear old data
    colId.innerHTML = '';
    colCus.innerHTML = '';
    colCost.innerHTML = '';
    colStatus.innerHTML = '';
    colDate.innerHTML = '';
    colAction.innerHTML = '';

    if (orders.length === 0) {
        colId.innerHTML = '<p>Trống</p>';
        return;
    }

    // 3. Render each order into columns
    orders.forEach(order => {
        // Style common for all cells to ensure alignment
        const cellStyle = "min-height: 50px; display: flex; align-items: center; border-bottom: 1px solid #eee; padding: 5px 0;";
        
        // --- Column 1: Mã Đơn ---
        const divId = document.createElement('div');
        divId.style.cssText = cellStyle + "font-weight: bold; color: #333;";
        divId.textContent = order.ma_don_hang;
        colId.appendChild(divId);

        // --- Column 2: Khách Hàng ---
        const divCus = document.createElement('div');
        divCus.style.cssText = cellStyle + "flex-direction: column; align-items: flex-start; justify-content: center;";
        divCus.innerHTML = `
            <div style="font-weight: 500;">${order.ho_ten || 'Khách vãng lai'}</div>
            <div style="font-size: 12px; color: #888;">${order.so_dien_thoai || ''}</div>
        `;
        colCus.appendChild(divCus);

        // --- Column 3: Tổng Tiền ---
        const divCost = document.createElement('div');
        divCost.style.cssText = cellStyle + "color: #d35400; font-weight: bold;";
        divCost.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.tong_tien);
        colCost.appendChild(divCost);

        // --- Column 4: Trạng Thái ---
        const divStatus = document.createElement('div');
        divStatus.style.cssText = cellStyle + "flex-direction: column; align-items: flex-start; justify-content: center;";
        
        // Status Text
        let statusText = order.trang_thai;
        let statusColor = '#856404'; // Default yellow/brown
        if (statusText === 'hoan_thanh') { statusText = 'Hoàn thành'; statusColor = 'green'; }
        if (statusText === 'cho_xu_ly') { statusText = 'Chờ xử lý'; statusColor = '#d35400'; }

        // Payment Text
        let payText = 'Chưa TT';
        let payColor = 'red';
        if (order.trang_thai_thanh_toan === 'da_thanh_toan') {
            payText = 'Đã TT';
            payColor = 'green';
        }

        divStatus.innerHTML = `
            <span style="color: ${statusColor}; font-size: 13px;">${statusText}</span>
            <span style="color: ${payColor}; font-size: 11px; margin-top: 2px;">(${payText})</span>
        `;
        colStatus.appendChild(divStatus);

        // --- Column 5: Ngày Đặt ---
        const divDate = document.createElement('div');
        divDate.style.cssText = cellStyle + "font-size: 13px; color: #555;";
        divDate.textContent = new Date(order.ngay_dat_hang).toLocaleDateString('vi-VN');
        colDate.appendChild(divDate);

        // --- Column 6: Hành Động ---
        const divAction = document.createElement('div');
        divAction.style.cssText = cellStyle;
        divAction.innerHTML = `
            <button onclick="alert('Xem chi tiết: ${order.ma_don_hang}')" style="cursor: pointer; padding: 4px 8px; border: 1px solid #ddd; background: #fff; border-radius: 4px;">Xem</button>
        `;
        colAction.appendChild(divAction);
    });
}