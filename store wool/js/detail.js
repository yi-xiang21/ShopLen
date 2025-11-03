// Detail Page JavaScript
let currentProduct = null;
let allProducts = [];

// Get product ID from URL parameters
function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load product data from JSON file
async function loadProduct() {
    const productId = getProductId();
    
    if (!productId) {
        showError('Product ID not found');
        return;
    }

    try {
        // Fetch all products from JSON file
        const response = await fetch('api/api.json');
        const products = await response.json();
        allProducts = products;
        
        // Find the specific product
        currentProduct = products.find(product => product.id === productId);
        
        if (!currentProduct) {
            showError('Product not found');
            return;
        }

        // Display product information
        displayProduct();
        
        // Load related products
        loadRelatedProducts();
        
    } catch (error) {
        console.error('Error loading product:', error);
        showError('Failed to load product information');
    }
}

// Display product information
function displayProduct() {
    if (!currentProduct) return;

    // Update breadcrumb
    document.getElementById('product-name').textContent = currentProduct.name;
    
    // Update main product image
    document.getElementById('main-product-image').src = currentProduct.images.main;
    document.getElementById('main-product-image').alt = currentProduct.name;
    
    // Update thumbnail images
    const thumbnails = ['thumb1', 'thumb2', 'thumb3', 'thumb4'];
    thumbnails.forEach((thumbId, index) => {
        const thumbnailElement = document.getElementById(thumbId);
        if (currentProduct.images.thumbnails[index]) {
            thumbnailElement.src = currentProduct.images.thumbnails[index];
            thumbnailElement.alt = currentProduct.name;
            thumbnailElement.style.display = 'block';
        } else {
            thumbnailElement.style.display = 'none';
        }
    });
    
    // Update product title
    document.getElementById('product-title').textContent = currentProduct.name;
    
    // Update product price
    const currentPrice = currentProduct.cost;
    const originalPrice = currentProduct.originalCost || (currentPrice * 1.15);
    
    document.getElementById('product-price').textContent = `$${currentPrice.toFixed(2)}`;
    document.getElementById('original-price').textContent = `$${originalPrice.toFixed(2)}`;
    
    // Show/hide discount badge
    const discountBadge = document.getElementById('discount-badge');
    if (originalPrice > currentPrice) {
        const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        discountBadge.textContent = `Save ${discountPercent}%`;
        discountBadge.style.display = 'inline-block';
    } else {
        discountBadge.style.display = 'none';
    }
    
    // Update product description
    document.getElementById('product-description').textContent = currentProduct.description;
    document.getElementById('detailed-description').textContent = currentProduct.detailedDescription || currentProduct.description;
    
    // Update specifications based on product tags
    updateSpecifications();
    
    // Update product features based on tags
    updateProductFeatures();
    
    // Update page title
    document.title = `${currentProduct.name} - Peace Chill`;
}

// Update product specifications
function updateSpecifications() {
    if (!currentProduct) return;
    
    const specs = currentProduct.specifications || {};
    
    // Update specification values
    document.getElementById('spec-material').textContent = specs.material || '-';
    document.getElementById('spec-weight').textContent = specs.weight || '-';
    document.getElementById('spec-length').textContent = specs.length || '-';
    document.getElementById('spec-care').textContent = specs.care || '-';
}

// Update product features
function updateProductFeatures() {
    if (!currentProduct) return;
    
    const features = currentProduct.features || ['Premium quality material', 'Soft and comfortable'];
    const featuresList = document.getElementById('product-features');
    
    // Update features list
    featuresList.innerHTML = features.map(feature => `<li>${feature}</li>`).join('');
}

// Load related products
function loadRelatedProducts() {
    if (!currentProduct || !allProducts.length) return;
    
    const relatedProducts = getRelatedProducts();
    const relatedGrid = document.getElementById('related-products');
    
    if (relatedProducts.length === 0) {
        relatedGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No related products found</p>';
        return;
    }
    
    relatedGrid.innerHTML = relatedProducts.map(product => `
        <div class="related-item" onclick="goToProduct('${product.id}')">
            <img src="${product.images.main}" alt="${product.name}">
            <div class="related-item-info">
                <div class="related-item-title">${product.name}</div>
                <div class="related-item-price">$${product.cost.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

// Get related products based on tags
function getRelatedProducts() {
    if (!currentProduct) return [];
    
    const currentTags = currentProduct.tags || [];
    const related = allProducts.filter(product => 
        product.id !== currentProduct.id && 
        product.tags && 
        product.tags.some(tag => currentTags.includes(tag))
    );
    
    // If no related products by tags, return random products
    if (related.length === 0) {
        return allProducts
            .filter(product => product.id !== currentProduct.id)
            .slice(0, 4);
    }
    
    // Return up to 4 related products
    return related.slice(0, 4);
}

// Navigate to product detail
function goToProduct(productId) {
    window.location.href = `detail.html?id=${productId}`;
}

// Quantity change function
function changeQuantity(delta) {
    const quantityInput = document.getElementById('quantity');
    let currentQty = parseInt(quantityInput.value) || 1;
    let newQty = currentQty + delta;
    
    // Ensure quantity is between 1 and 99
    newQty = Math.max(1, Math.min(99, newQty));
    
    quantityInput.value = newQty;
}

// Tab switching functionality
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Color option selection
function initColorOptions() {
    if (!currentProduct || !currentProduct.colors) return;
    
    const colorContainer = document.querySelector('.color-options');
    colorContainer.innerHTML = '';
    
    currentProduct.colors.forEach(color => {
        const colorOption = document.createElement('button');
        colorOption.className = `color-option ${color.available ? '' : 'disabled'}`;
        colorOption.setAttribute('data-color', color.id);
        colorOption.style.backgroundColor = color.hex;
        colorOption.title = color.name;
        
        if (!color.available) {
            colorOption.style.opacity = '0.5';
            colorOption.style.cursor = 'not-allowed';
        } else {
            colorOption.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                colorOption.classList.add('active');
                
                // Update main image if color has specific image
                if (color.image) {
                    document.getElementById('main-product-image').src = color.image;
                }
            });
        }
        
        colorContainer.appendChild(colorOption);
    });
    
    // Set first available color as active
    const firstAvailable = currentProduct.colors.find(color => color.available);
    if (firstAvailable) {
        const firstOption = colorContainer.querySelector(`[data-color="${firstAvailable.id}"]`);
        if (firstOption) firstOption.classList.add('active');
    }
}

// Size option selection
function initSizeOptions() {
    if (!currentProduct || !currentProduct.sizes) return;
    
    const sizeContainer = document.querySelector('.size-options');
    sizeContainer.innerHTML = '';
    
    currentProduct.sizes.forEach(size => {
        const sizeOption = document.createElement('button');
        sizeOption.className = `size-option ${size.available ? '' : 'disabled'}`;
        sizeOption.textContent = size.name;
        sizeOption.setAttribute('data-size', size.id);
        
        if (!size.available) {
            sizeOption.style.opacity = '0.5';
            sizeOption.style.cursor = 'not-allowed';
        } else {
            sizeOption.addEventListener('click', () => {
                document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('active'));
                sizeOption.classList.add('active');
                
                // Update price if size has different price
                if (size.price !== currentProduct.cost) {
                    document.getElementById('product-price').textContent = `$${size.price.toFixed(2)}`;
                }
            });
        }
        
        sizeContainer.appendChild(sizeOption);
    });
    
    // Set first available size as active
    const firstAvailable = currentProduct.sizes.find(size => size.available);
    if (firstAvailable) {
        const firstOption = sizeContainer.querySelector(`[data-size="${firstAvailable.id}"]`);
        if (firstOption) firstOption.classList.add('active');
    }
}

// Thumbnail image switching
function initThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail-images img');
    const mainImage = document.getElementById('main-product-image');
    
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            // Remove active class from all thumbnails
            thumbnails.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked thumbnail
            thumb.classList.add('active');
            
            // Update main image
            mainImage.src = thumb.src;
            mainImage.alt = thumb.alt;
        });
    });
}

// Add to cart functionality
function initAddToCart() {
    const addToCartBtn = document.querySelector('.btn-add-cart');
    
    addToCartBtn.addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        
        // Here you would typically add to cart logic
        console.log(`Adding ${quantity} of ${currentProduct.name} to cart`);
        
        // Show success message
        showMessage('Product added to cart!', 'success');
    });
}

// Buy now functionality
function initBuyNow() {
    const buyNowBtn = document.querySelector('.btn-buy-now');
    
    buyNowBtn.addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        
        // Here you would typically redirect to checkout
        console.log(`Buying ${quantity} of ${currentProduct.name} now`);
        
        // For now, just show a message
        showMessage('Redirecting to checkout...', 'info');
    });
}

// Wishlist functionality
function initWishlist() {
    const wishlistBtn = document.querySelector('.btn-wishlist');
    
    wishlistBtn.addEventListener('click', () => {
        // Toggle wishlist state
        wishlistBtn.classList.toggle('active');
        
        if (wishlistBtn.classList.contains('active')) {
            wishlistBtn.innerHTML = '<i class="bi bi-heart-fill"></i>';
            showMessage('Added to wishlist!', 'success');
        } else {
            wishlistBtn.innerHTML = '<i class="bi bi-heart"></i>';
            showMessage('Removed from wishlist', 'info');
        }
    });
}

// Show message function
function showMessage(message, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    // Style the message
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            messageEl.style.backgroundColor = '#4caf50';
            break;
        case 'error':
            messageEl.style.backgroundColor = '#f44336';
            break;
        case 'warning':
            messageEl.style.backgroundColor = '#ff9800';
            break;
        default:
            messageEl.style.backgroundColor = '#2196f3';
    }
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 3000);
}

// Show error function
function showError(message) {
    const detailContainer = document.getElementById('detail');
    detailContainer.innerHTML = `
        <div style="text-align: center; padding: 50px 20px;">
            <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: #f44336; margin-bottom: 20px;"></i>
            <h2 style="color: #7a294e; margin-bottom: 10px;">Oops!</h2>
            <p style="color: #666; margin-bottom: 30px;">${message}</p>
            <a href="shop.html" style="background: linear-gradient(135deg, #7a294e, #9c27b0); color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: 600;">Back to Shop</a>
        </div>
    `;
}

// Add CSS animations for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadProduct();
    initTabs();
    initColorOptions();
    initSizeOptions();
    initThumbnails();
    initAddToCart();
    initBuyNow();
    initWishlist();
}); 