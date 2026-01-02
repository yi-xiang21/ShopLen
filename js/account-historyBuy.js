// Lấy id tài khoản của User đang đăng nhập
const idKhach = localStorage.getItem("userId");

// Render lịch sử mua hàng
async function fetchHistoryBuy() {
  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    const res = await fetch(getApiUrl('/orders/user-orders'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });

    const donhang = await res.json();    
    // Kiểm tra nếu data là mảng và có phần tử
    if (!donhang.data || !Array.isArray(donhang.data) || donhang.data.length === 0) {
        const historyList = document.getElementById("History-items");
        historyList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <p>Bạn chưa có đơn hàng nào.</p>
            <p style="font-size: 14px; margin-top: 10px;">
                <a href="shop.html" style="color: #8B4513; text-decoration: underline;">
                    Tiếp tục mua sắm
                </a>
            </p>
        </div>
        `;
        return;
    }
    
    const historyList = document.getElementById("History-items");
    historyList.innerHTML = "";

    // Lặp qua từng đơn hàng
    for (const donHang of donhang.data) {
      try {

        // Chỉ render nếu trạng thái là success
        if (donHang.trang_thai !== 'hoan_thanh') {
          continue;
        }
        // Lấy chi tiết đơn hàng
        const res1 = await fetch(getApiUrl(`/orders/${donHang.ma_don_hang}`), {
          headers: { Authorization: `Bearer ${token}` },
        });

        const chiTietDonHang = await res1.json();
        

        const HistoryItem = document.createElement("div");
        HistoryItem.className = "History-items";
        HistoryItem.setAttribute("data-id", donHang.ma_don_hang);

        let productsHTML = "";
        let tongTien = 0;
        let masp='';
        
        chiTietDonHang.data.items.forEach((sp) => {
          const hinhAnh = sp.url_hinh_anh_bien_the || sp.hinh_anh_url || '';
          tongTien += parseFloat(sp.gia) * sp.so_luong;
          masp=sp.ma_san_pham;
          
          productsHTML += `
            <div class="Historyorder-up">
                <img src="${hinhAnh}" id="History-img" />
                <div class="Historyorder-info">
                    <div class="order-title">${sp.ten_san_pham}</div>
                    <div class="order-variant">Màu: ${sp.mau_sac || 'N/A'} | Size: ${sp.kich_co || 'N/A'}</div>
                    <div class="order-qty">x ${sp.so_luong}</div>
                    <div id="order-price">Giá: ${parseFloat(sp.gia).toLocaleString("vi-VN")}₫</div>
                </div>
            </div>`;
        });
        

        HistoryItem.innerHTML = `
          <div class="Historyorder-item">
              ${productsHTML}
              
              <div class="Historyorder-down">
                  <div class="order-total">
                      <span>Tổng số tiền:</span>
                      <span class="price-history">${tongTien.toLocaleString("vi-VN")}₫</span>
                  </div>

                  <div class="Historyorder-actions">
                      <a class="btn-buyAgain" href="detail.html?id=${masp}">Mua Lần Nữa</a>
                      <button class="btn-view" onclick="renderDetailHistory('${donHang.ma_don_hang}')">Xem Chi Tiết Đơn Hàng</button>
                  </div>
              </div>
          </div>
        `;

        historyList.appendChild(HistoryItem);
      } catch (error) {

      }
    }
  } catch (error) {

  }
}

// Xem chi tiết đơn hàng
async function renderDetailHistory(orderId) {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const res = await fetch(getApiUrl(`/orders/${orderId}`), {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await res.json();
        
        if (result.status === 'success') {
            const { order, items } = result.data;
            renderOrderDetailHistory(order, items);

            // Hiển thị giao diện chi tiết đơn hàng
            document.getElementById('cart-history').style.display = 'none';
            document.querySelector('.order-detail-wrapperHistory').style.display = 'block';
        }
    } catch (error) {

    }
}

function renderOrderDetailHistory(order, items) {
    const infoGrids = document.querySelectorAll('.order-detail-wrapperHistory .order-info-gridHistory');

    // Cập nhật trạng thái đơn hàng
    const statusEl = document.querySelector('.order-detail-wrapperHistory .order-status');
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
    const noteEl = document.querySelector('.order-noteHistory');
    if (noteEl) {
        noteEl.innerHTML = `<strong>Ghi chú:</strong> ${order.ghi_chu || 'Không có'}`;
    }

    // Fill danh sách sản phẩm
    const itemsContainer = document.querySelector('.order-productHistory').parentNode;
    let itemsHtml = '';
    items.forEach(item => {
        const img = item.url_hinh_anh_bien_the || item.hinh_anh_url || 'img/default.png';
        itemsHtml += `
            <div class="order-productHistory">
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

    document.querySelector('.final-totalHistory span').innerText = currencyFormat.format(order.tong_tien);
    document.querySelector('.temp-totalHistory span').innerText = currencyFormat.format(order.tong_tien);
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

// Logic nút Quay lại cho History
document.addEventListener('DOMContentLoaded', function() {
    const btnBackHistory = document.querySelector('.order-detail-wrapperHistory .btn-backToOrderHistory');
    if (btnBackHistory) {
        btnBackHistory.addEventListener('click', () => {
            document.querySelector('.order-detail-wrapperHistory').style.display = 'none';
            document.getElementById('cart-history').style.display = 'block';
        });
    }
});


document.addEventListener("DOMContentLoaded", function () {
  fetchHistoryBuy();
});
