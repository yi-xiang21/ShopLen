// Handle MoMo callback khi redirect từ MoMo payment gateway
document.addEventListener("DOMContentLoaded", async function() {
    // Lấy URL query parameters
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    const resultCode = params.get('resultCode');
    const transId = params.get('transId');
    const message = params.get('message');
    
    console.log("🔍 MoMo Callback Parameters:");
    console.log("  orderId:", orderId);
    console.log("  resultCode:", resultCode);
    console.log("  transId:", transId);
    console.log("  message:", message);
    
    // Nếu không có orderId, không phải callback từ MoMo
    if (!orderId || !resultCode) {
        console.log("❓ Không phải callback từ MoMo");
        return;
    }
    
    // Gọi backend API để xử lý
    try {
        console.log("📡 Gọi API /api/payment/momo/callback...");
        
        const response = await fetch(
            `${getApiUrl('/api/payment/momo/callback')}?orderId=${orderId}&resultCode=${resultCode}&transId=${transId}&message=${encodeURIComponent(message || '')}`
        );
        
        const result = await response.json();
        console.log("📥 API Response:", result);
        
        if (resultCode === '0') {
            // Thanh toán thành công
            console.log("✅ Thanh toán thành công!");
            alert("✅ Thanh toán MoMo thành công! Mã đơn: " + orderId);
            // Xóa query params từ URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Thanh toán thất bại
            console.log("❌ Thanh toán thất bại:", message);
            alert("❌ Thanh toán MoMo thất bại: " + message);
            // Xóa query params từ URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
    } catch (error) {
        console.error("❌ Lỗi gọi API:", error);
        alert("Lỗi xử lý thanh toán: " + error.message);
    }
});

// Hàm getApiUrl nếu chưa tồn tại
if (typeof getApiUrl === 'undefined') {
    function getApiUrl(endpoint) {
        const API_BASE_URL = 'http://localhost:3000';
        return API_BASE_URL + endpoint;
    }
}
