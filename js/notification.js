/**
 * ============================================
 * NOTIFICATION SYSTEM - Hệ thống thông báo
 * ============================================
 * Sử dụng: 
 * - showNotification(type, title, message, duration)
 * - showConfirm(title, message, options)
 * ============================================
 */

// Tạo container nếu chưa có
function ensureNotificationContainer() {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Hiển thị thông báo
 * @param {string} type - Loại thông báo: 'success', 'error', 'warning', 'info'
 * @param {string} title - Tiêu đề
 * @param {string} message - Nội dung
 * @param {number} duration - Thời gian hiển thị (ms), mặc định 3000ms
 * @returns {HTMLElement} - Element của thông báo
 */
function showNotification(type = 'info', title = '', message = '', duration = 3000) {
    const container = ensureNotificationContainer();
    
    // Icon cho từng loại
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ⓘ'
    };

    // Tạo notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-content">
            ${title ? `<p class="notification-title">${title}</p>` : ''}
            ${message ? `<p class="notification-message">${message}</p>` : ''}
        </div>
        <button class="notification-close" aria-label="Đóng">×</button>
        ${duration > 0 ? '<div class="notification-progress"><div class="notification-progress-bar"></div></div>' : ''}
    `;

    // Thêm vào container
    container.appendChild(notification);

    // Xử lý nút đóng
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });

    // Progress bar
    if (duration > 0) {
        const progressBar = notification.querySelector('.notification-progress-bar');
        if (progressBar) {
            progressBar.style.width = '100%';
            
            // Animation thanh progress
            setTimeout(() => {
                progressBar.style.transition = `width ${duration}ms linear`;
                progressBar.style.width = '0%';
            }, 50);
        }

        // Tự động đóng sau duration
        setTimeout(() => {
            removeNotification(notification);
        }, duration);
    }

    return notification;
}

/**
 * Xóa thông báo với hiệu ứng
 */
function removeNotification(notification) {
    notification.classList.add('slideOut');
    setTimeout(() => {
        if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
    }, 300);
}

/**
 * Các hàm shorthand tiện lợi
 */
function showSuccess(title, message, duration = 3000) {
    return showNotification('success', title, message, duration);
}

function showError(title, message, duration = 4000) {
    return showNotification('error', title, message, duration);
}

function showWarning(title, message, duration = 3500) {
    return showNotification('warning', title, message, duration);
}

function showInfo(title, message, duration = 3000) {
    return showNotification('info', title, message, duration);
}

/**
 * Hiển thị loading notification
 * @returns {Object} - Object có method close() để đóng loading
 */
function showLoading(title = 'Đang xử lý...', message = 'Vui lòng đợi') {
    const container = ensureNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = 'notification notification-loading';
    
    notification.innerHTML = `
        <div class="notification-icon">
            <div class="spinner"></div>
        </div>
        <div class="notification-content">
            <p class="notification-title">${title}</p>
            ${message ? `<p class="notification-message">${message}</p>` : ''}
        </div>
    `;

    container.appendChild(notification);

    return {
        element: notification,
        close: () => removeNotification(notification)
    };
}

/**
 * ============================================
 * CONFIRM DIALOG - Hộp thoại xác nhận
 * ============================================
 */

/**
 * Hiển thị hộp thoại xác nhận
 * @param {string} title - Tiêu đề
 * @param {string} message - Nội dung
 * @param {Object} options - Các tùy chọn
 * @returns {Promise<boolean>} - true nếu confirm, false nếu cancel
 */
function showConfirm(title = 'Xác nhận', message = 'Bạn có chắc chắn?', options = {}) {
    return new Promise((resolve) => {
        const defaults = {
            type: 'warning', // 'warning', 'danger', 'info'
            confirmText: 'Xác nhận',
            cancelText: 'Hủy',
            confirmClass: 'confirm', // 'confirm', 'danger'
        };

        const config = { ...defaults, ...options };

        // Icon theo type
        const icons = {
            warning: '⚠',
            danger: '✕',
            info: 'ⓘ'
        };

        // Tạo overlay
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';

        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-header">
                    <div class="confirm-icon ${config.type}">
                        ${icons[config.type] || icons.warning}
                    </div>
                    <h3 class="confirm-title">${title}</h3>
                </div>
                <div class="confirm-body">
                    <p class="confirm-message">${message}</p>
                </div>
                <div class="confirm-footer">
                    <button class="confirm-btn cancel">${config.cancelText}</button>
                    <button class="confirm-btn ${config.confirmClass}">${config.confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const dialog = overlay.querySelector('.confirm-dialog');
        const cancelBtn = overlay.querySelector('.confirm-btn.cancel');
        const confirmBtn = overlay.querySelector('.confirm-btn:not(.cancel)');

        // Xử lý click cancel
        cancelBtn.addEventListener('click', () => {
            closeDialog(overlay, false);
        });

        // Xử lý click confirm
        confirmBtn.addEventListener('click', () => {
            closeDialog(overlay, true);
        });

        // Xử lý click overlay (đóng)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog(overlay, false);
            }
        });

        // Xử lý ESC key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeDialog(overlay, false);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        function closeDialog(overlay, result) {
            overlay.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => {
                if (overlay.parentElement) {
                    overlay.parentElement.removeChild(overlay);
                }
                resolve(result);
            }, 200);
        }
    });
}

/**
 * Shortcuts cho confirm dialog
 */
async function confirmDelete(message = 'Bạn có chắc chắn muốn xóa?') {
    return await showConfirm(
        'Xác nhận xóa',
        message,
        {
            type: 'danger',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            confirmClass: 'danger'
        }
    );
}

async function confirmAction(title, message) {
    return await showConfirm(title, message, {
        type: 'warning',
        confirmText: 'Đồng ý',
        cancelText: 'Hủy'
    });
}

/**
 * ============================================
 * VÍ DỤ SỬ DỤNG
 * ============================================
 * 
 * // Thông báo đơn giản
 * showSuccess('Thành công', 'Đơn hàng đã được tạo');
 * showError('Lỗi', 'Không thể kết nối đến server');
 * showWarning('Cảnh báo', 'Phiên đăng nhập sắp hết hạn');
 * showInfo('Thông tin', 'Có cập nhật mới');
 * 
 * // Loading
 * const loading = showLoading('Đang tải...', 'Vui lòng đợi');
 * // ... làm việc gì đó
 * loading.close();
 * 
 * // Confirm dialog
 * const result = await showConfirm('Xác nhận', 'Bạn có chắc chắn?');
 * if (result) {
 *     console.log('User clicked confirm');
 * }
 * 
 * // Confirm xóa
 * if (await confirmDelete('Bạn có chắc muốn xóa sản phẩm này?')) {
 *     // Xóa sản phẩm
 * }
 */

// Export các hàm để sử dụng
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.showLoading = showLoading;
window.showConfirm = showConfirm;
window.confirmDelete = confirmDelete;
window.confirmAction = confirmAction;
