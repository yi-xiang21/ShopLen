//lay id tai khoan cua acount dang dang nhap
const idKhach = localStorage.getItem("userId");
//render lich su mua hang
async function fetchHistoryBuy() {
  try {
    const response = await fetch("api/historyBuy.json");
    if (!response.ok) {
      throw new Error("That bai");
    }
    const data = await response.json();
    const historyList = document.getElementById("History-items");
    historyList.innerHTML = "";


    data.LichSu.forEach((LichSu) => {
      const HistoryItem = document.createElement("div");
      HistoryItem.className = "History-items";
      HistoryItem.setAttribute("data-id", LichSu.ma_don_hang);

      let productsHTML = "";
      LichSu.san_pham.forEach((sp) => {
        productsHTML += `
            <div class="Historyorder-up">
                <img src="${sp.hinh_anh_url}" id="History-img" />
                <div class="Historyorder-info">
                    <div class="order-title">${sp.ten_san_pham}</div>
                    <div class="order-qty">x ${sp.so_luong}</div>
                    <div id="order-price">Gia : ${sp.gia.toLocaleString("vi-VN")}₫</div>
                </div>
            </div>`;
      });

      HistoryItem.innerHTML = `
        <div class="Historyorder-item">
            ${productsHTML}
            
            <div class="Historyorder-down">
                <div class="order-total">
                    <span>Tổng số tiền:</span>
                    <span class="price-history">₫${LichSu.tong_tien}</span>
                </div>

                <div class="Historyorder-actions">
                    <button class="btn-buyAgain">Mua Lần Nữa</button>
                    <button class="btn-view">Xem Chi Tiết Đơn Hàng</button>
                </div>
            </div>
        </div>
      `;

      historyList.appendChild(HistoryItem);
    });
  } catch (error) {
    console.error("That bai:", error);
  }
}

document.addEventListener('DOMContentLoaded', function () {
    fetchHistoryBuy();
});
