document.addEventListener("DOMContentLoaded", async function () {
  // Khởi tạo hàm xử lý địa chỉ khác
  initAddressLogic();

  await loadOrderSummary(); // Load giỏ hàng
  await fillUserInfo(); // Tự động điền thông tin user
});

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

// Logic UI địa chỉ
function initAddressLogic() {
  const checkboxAddressAdd = document.getElementById("address_add");
  const inputAddress2 = document.getElementById("address2");

  function themDiaChiKhac() {
    if (!checkboxAddressAdd || !inputAddress2) return;
    if (checkboxAddressAdd.checked) {
      inputAddress2.style.display = "inline-block";
      inputAddress2.required = true;
      inputAddress2.focus();
    } else {
      inputAddress2.style.display = "none";
      inputAddress2.required = false;
      inputAddress2.value = "";
    }
  }

  if (checkboxAddressAdd) {
    checkboxAddressAdd.addEventListener("change", themDiaChiKhac);
  }
}

// Render giỏ hàng
async function loadOrderSummary() {
  const token = getToken();
  let cartItems = [];

  // Logic Hybrid: Có token thì lấy từ API, không có thì lấy từ localStorage
  if (token && typeof getApiUrl === "function") {
    try {
      const res = await fetch(getApiUrl("/cart"), {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.status === "success") {
        cartItems = data.cart || [];
      }
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
    }
  } else {
    const local = localStorage.getItem("cart");
    cartItems = local ? JSON.parse(local) : [];
  }

  renderOrderItems(cartItems);
}

// Render sản phẩm trong giỏ hàng
function renderOrderItems(items) {
  const container = document.querySelector(".order-items");
  const totalPriceElement = document.querySelector(".total-price");
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = "<p>Không có sản phẩm để thanh toán</p>";
  }

  if (totalPriceElement) {
    totalPriceElement.innerText = "0đ";
  }

  let totalPrice = 0;

  // Hàm format tiền
  const fmt = (p) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(p);

  const html = items
    .map((item) => {
      const price = Number(item.price || item.gia || 0);
      const quantity = Number(item.quantity || item.so_luong || 0);
      const img =
        item.image ||
        // Nếu KHÔNG có item.image thì kiểm tra ảnh biến thể
        (item.url_hinh_anh_bien_the
          ? // Nếu url ảnh biến thể đã là link đầy đủ (http/https)
            item.url_hinh_anh_bien_the.startsWith("http")
            ? item.url_hinh_anh_bien_the
            : // Nếu chưa phải link đầy đủ
            // Nếu có hàm getApiUrl thì dùng để build full url
            typeof getApiUrl === "function"
            ? getApiUrl(item.url_hinh_anh_bien_the)
            : // Nếu không có getApiUrl thì dùng trực tiếp
              item.url_hinh_anh_bien_the
          : // Nếu không có cả image lẫn ảnh biến thể → dùng ảnh mặc định
            "img/default.png");

      const itemTotal = price * quantity;
      totalPrice += itemTotal;

      return `
      <div class="items-list">
        <div class="img-itemsdetailsorder">
                            <img src="${img}" alt="">
                        </div>
                        <div class="item-detailsorder">
                            <p class="item-nameorder">
                                <label>Tên :</label>
                                ${item.name || item.ten_san_pham}
                            </p>
                            <p class="item-sizecolororder">
                                <label>Màu và kích cỡ :</label>
                                ${item.mau_sac ? item.mau_sac : ""} +
                                ${
                                  item.size || item.kich_co
                                    ? item.size || item.kich_co
                                    : ""
                                }
                            </p>
                            <p class="item-quantityorder">
                                <label>Số Lượng :</label>
                                ${quantity}
                            </p>
                            <p class="item-priceorder">
                                <label>Tạm tính: </label>
                                ${fmt(itemTotal)}
                            </p>
                        </div>
          </div>

      `;
    })
    .join("");

  container.innerHTML = html;
  if (totalPriceElement) {
    totalPriceElement.innerText = fmt(totalPrice);
  }
}

// Fetch thông tin user
async function fillUserInfo() {
  const token = getToken();
  if (!token || typeof getApiUrl !== "function") return;

  try {
    const res = await fetch(getApiUrl("/auth/me"), {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (data.status === "success" && data.user) {
      const u = data.user;
      // Điền thông tin vào form
      if (document.getElementById("name"))
        document.getElementById("name").value = u.name || "";
      if (document.getElementById("email"))
        document.getElementById("email").value = u.email || "";
      if (document.getElementById("phone"))
        document.getElementById("phone").value = u.phone || "";
      if (document.getElementById("address"))
        document.getElementById("address").value = u.address || "";
    }
  } catch (error) {
    console.error("Lỗi lấy thông tin user");
  }
}

//hien thi meo
function showLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = "flex"; // Dùng flex để căn giữa
}

// Hàm ẩn con mèo (Tắt Loading)
function hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = "none";
}

// Đặt hàng
document.addEventListener("DOMContentLoaded", () => {
    const orderBtn = document.querySelector(".place-order");

    orderBtn.addEventListener("click", async () => {

        const payCOD = document.getElementById("cod").checked;
        const payMoMo = document.getElementById("creditcard").checked;

        // Lấy tổng tiền
        const totalEl = document.querySelector(".total-price");
        const amountText = totalEl.innerText.replace(/[^\d]/g, "");
        const amount = Number(amountText) || 0;

        if(amount < 1000){
            alert("Số tiền phải ≥ 1000 VNĐ");
            return;
        }

        // TRƯỜNG HỢP COD
        if (payCOD) {
            console.log("Thanh toán COD - tiến hành tạo đơn hàng bình thường...");
            alert("Đặt hàng COD thành công!");
            // await fetch("/api/order", {...})
            return;
        }

        // TRƯỜNG HỢP MOMO
        if (payMoMo) {
            try {
                showLoading();
                const res = await fetch(getApiUrl("/api/payment/momo"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount })
                });

                const data = await res.json();
                console.log("MoMo Response:", data);

                if (data.payUrl) {
                    window.open(data.payUrl, '_blank');
                } else {
                    alert("Không tạo được link thanh toán MoMo");
                    hideLoading();
                }

            } catch (err) {
                console.error("Momo Error:", err);
                alert("Không kết nối được server thanh toán");
                hideLoading();
            }

            return;
        }

        alert("Vui lòng chọn phương thức thanh toán!");
    });
});

