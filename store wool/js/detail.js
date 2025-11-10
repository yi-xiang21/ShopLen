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
    
    // Update page title
    document.title = `${currentProduct.name} - Peace Chill`;
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

document.addEventListener('DOMContentLoaded', () => {
    loadProduct();
    initTabs();;
}); 