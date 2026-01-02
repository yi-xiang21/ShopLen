// Handle MoMo callback khi redirect từ MoMo payment gateway
document.addEventListener("DOMContentLoaded", async function() {
    // Lấy URL query parameters
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    const resultCode = params.get('resultCode');
    const transId = params.get('transId');
    const message = params.get('message');
    
    // Nếu không có orderId, không phải callback từ MoMo
    if (!orderId || !resultCode) {
        return;
    }
    
    // Gọi backend API để xử lý
    try {
        
        const response = await fetch(
            `${getApiUrl('/api/payment/momo/callback')}?orderId=${orderId}&resultCode=${resultCode}&transId=${transId}&message=${encodeURIComponent(message || '')}`
        );
        
        const result = await response.json();
        
        if (resultCode === '0') {
            // Thanh toán thành công
            alert("✅ Thanh toán MoMo thành công! Mã đơn: " + orderId);
            // Xóa query params từ URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Thanh toán thất bại
            alert("❌ Thanh toán MoMo thất bại: " + message);
            // Xóa query params từ URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
    } catch (error) {
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
