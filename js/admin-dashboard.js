// ========== Admin Dashboard JavaScript ==========
// File quản lý dashboard với biểu đồ 24 giờ

// Định nghĩa mapping trạng thái từ DB sang tiếng Việt
const ORDER_STATUS_MAP = {
    'hoan_thanh': 'Hoàn tất',
    'cho_xu_ly': 'Chờ xác nhận',
    'dang_xu_ly': 'Đang xử lý',
    'dang_giao': 'Đang vận chuyển',
    'da_huy': 'Đã hủy'
};

function getToken() {
    return (
      localStorage.getItem("token") || sessionStorage.getItem("token") || ""
    );
  }

class DashboardManager {
    constructor() {
        this.chart = null;
        this.currentDate = new Date();
        this.dashboardData = null;  // Lưu dữ liệu API
        this.init();
    }

    init() {
        this.setupDatePicker();
        this.loadDashboardData();  // Gọi API 1 lần duy nhất
    }

    // Thiết lập date picker
    setupDatePicker() {
        const dateInput = document.getElementById('order-date');
        if (dateInput) {
            // Set giá trị mặc định là ngày hiện tại
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;

            // Lắng nghe sự kiện thay đổi ngày
            dateInput.addEventListener('change', (e) => {
                this.currentDate = new Date(e.target.value);
                this.loadDashboardData();  // Gọi API, sau đó tự động cập nhật UI
            });
        }
    }

    // Load dữ liệu dashboard (gọi từ API)
    loadDashboardData() {
        // Lấy ngày từ input hoặc dùng hôm nay
        const dateInput = document.getElementById('order-date');
        const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
        
        const token = getToken();
        const apiUrl = getApiUrl('/api/dashboard/stats') + `?date=${date}`;
        
        // Gọi API dashboard
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('API error');
            return response.json();
        })
        .then(response => {
            if (response.status === 'success') {
                const data = response.data;
                
                // Lưu dữ liệu vào this.dashboardData
                this.dashboardData = data;
                
                // Cập nhật UI với dữ liệu mới
                this.updateMetrics(data);
                this.updateTodayRevenue(data);
                this.createChart();
                this.renderTopProducts();
                this.renderRecentOrders();
                
                return data;
            } else {
                throw new Error(response.message || 'Lỗi tải dữ liệu');
            }
        })
        .catch(error => {
            showError('Lỗi tải dữ liệu', 'Không thể tải dữ liệu dashboard. Vui lòng thử lại');
        });
    }

    // Cập nhật các metrics
    updateMetrics(data) {
        const ordersElement = document.getElementById('total-orders');
        const completedElement = document.getElementById('completed-orders');
        const cancelledElement = document.getElementById('cancelled-orders');
        const processingElement = document.getElementById('processing-orders');
        const shippingElement = document.getElementById('shipping-orders');
        const pendingElement = document.getElementById('pending-orders');
        const customersElement = document.getElementById('total-customers');

        if (ordersElement) {
            this.animateNumber(ordersElement, 0, data.totalOrders, 1000);
        }

        if (completedElement) {
            this.animateNumber(completedElement, 0, data.completedOrders, 1000);
        }

        if (cancelledElement) {
            this.animateNumber(cancelledElement, 0, data.cancelledOrders, 1000);
        }

        if (processingElement) {
            this.animateNumber(processingElement, 0, data.processingOrders, 1000);
        }

        if (shippingElement) {
            this.animateNumber(shippingElement, 0, data.shippingOrders, 1000);
        }

        if (pendingElement) {
            this.animateNumber(pendingElement, 0, data.pendingOrders, 1000);
        }

        if (customersElement) {
            this.animateNumber(customersElement, 0, data.totalCustomers, 1000);
        }
    }

    // Cập nhật doanh thu hôm nay
    updateTodayRevenue(data) {
        const revenueElement = document.getElementById('today-revenue');
        const changeElement = document.getElementById('revenue-change');

        if (revenueElement) {
            revenueElement.textContent = this.formatCurrency(data.todayRevenue);
        }

        if (changeElement) {
            // Ưu tiên dùng giá trị từ API để tránh tự tính gây NaN
            const safeNumber = (val) => {
                const n = Number(val);
                return Number.isFinite(n) ? n : 0;
            };
            const apiPercent = safeNumber(data.revenueChange);
            const fallbackPercent = (() => {
                const today = safeNumber(data.todayRevenue);
                const yesterday = safeNumber(data.yesterdayRevenue);
                if (yesterday <= 0) return 0;
                const pct = ((today - yesterday) / yesterday) * 100;
                return Number.isFinite(pct) ? pct : 0;
            })();

            const percentChange = apiPercent || fallbackPercent;
            const changeText = percentChange >= 0 ? '+' : '';
            const changeColor = percentChange >= 0 ? '#27ae60' : '#e74c3c';
            changeElement.textContent = `${changeText}${percentChange.toFixed(1)}% so với hôm qua`;
            changeElement.style.color = changeColor;
        }
    }

    // Animation số đếm
    animateNumber(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                element.textContent = this.formatNumber(end);
                clearInterval(timer);
            } else {
                element.textContent = this.formatNumber(Math.floor(current));
            }
        }, 16);
    }

    // Format số với dấu phẩy
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Format tiền tệ VND
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Tạo biểu đồ với Chart.js (sử dụng dữ liệu đã load)
    createChart() {
        if (!this.dashboardData) return;  // Chờ loadDashboardData() hoàn tất
        
        const canvas = document.getElementById('salesChart');
        if (!canvas) return;

        // Hủy chart cũ nếu tồn tại
        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = canvas.getContext('2d');
        this._createChartWithData(ctx, this.dashboardData);
    }

    // Tạo biểu đồ thực tế với dữ liệu
    _createChartWithData(ctx, data) {
        // Gradient cho đường line
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(45, 5, 19, 0.3)');
        gradient.addColorStop(1, 'rgba(162, 88, 114, 0.05)');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
                datasets: [{
                    label: 'Doanh thu',
                    data: data.hourlyRevenue.map(item => item.revenue),
                    borderColor: '#6b1f3a',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#6b1f3a',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#6b1f3a',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#333',
                        bodyColor: '#666',
                        borderColor: '#6b1f3a',
                        borderWidth: 2,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                return `Giờ ${context[0].label}`;
                            },
                            label: (context) => {
                                return `Thu nhập: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        },
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return (value / 1000000).toFixed(1) + 'M';
                            },
                            font: {
                                size: 12
                            },
                            color: '#666'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#666'
                        },
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    }
                }
            }
        });
    }

    // Cập nhật biểu đồ (không gọi API, loadDashboardData() sẽ tự động gọi cái này)
    updateChart() {
        if (!this.chart || !this.dashboardData) return;
        
        this.chart.data.datasets[0].data = this.dashboardData.hourlyRevenue.map(item => item.revenue);
        this.chart.update('active');
    }

    // Render Top 3 sản phẩm bán chạy (dùng dữ liệu đã load)
    renderTopProducts() {
        if (!this.dashboardData) return;  // Chờ loadDashboardData() hoàn tất
        
        const data = this.dashboardData;
        const productsList = document.getElementById('top-products-list');

        if (!productsList) return;

        productsList.innerHTML = data.topProducts.map((product, index) => `
            <div class="product-item">
                <div class="product-rank">${index + 1}</div>
                <div class="product-info">
                    <p class="product-name">${product.name}</p>
                    <div class="product-stats">
                        <span class="product-sales">
                            <i class="bi bi-bag-check"></i>
                            ${product.sales} đơn
                        </span>
                        <span>•</span>
                        <span>${this.formatCurrency(product.revenue)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Render 5 đơn hàng gần nhất (dùng dữ liệu đã load)
    renderRecentOrders() {
        if (!this.dashboardData) return;  // Chờ loadDashboardData() hoàn tất
        
        const data = this.dashboardData;
        const ordersList = document.getElementById('recent-orders-list');

        if (!ordersList) return;

        ordersList.innerHTML = data.recentOrders.map(order => `
            <div class="order-item">
                <div class="order-left">
                    <p class="order-id">${order.id}</p>
                    <p class="order-customer">${order.customer}</p>
                </div>
                <div class="order-middle">
                    <p class="order-amount">${this.formatCurrency(order.amount)}</p>
                    <p class="order-date">${order.date}</p>
                </div>
                <span class="order-status ${order.status}">
                    ${this.getStatusText(order.status)}
                </span>
            </div>
        `).join('');
    }

    // Lấy text trạng thái
    getStatusText(status) {
        return ORDER_STATUS_MAP[status] || status;
    }
}

// Khởi tạo Dashboard khi DOM đã load
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});

// Export cho việc sử dụng sau này
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}
