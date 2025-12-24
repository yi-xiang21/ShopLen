// Cấu hình API URL
// Thay đổi URL này thành URL của backend server khi deploy
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000',
    
    // Production - Thay đổi thành URL backend thực tế
    // BASE_URL: 'https://your-backend-domain.com',
    
    // Endpoints
    ENDPOINTS: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout'
    }
  };
  
  // Helper function để lấy full API URL
  function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
  }