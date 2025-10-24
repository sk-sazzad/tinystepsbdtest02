/**
 * TinyStepsBD - Product Management
 * Description: Handles product details, images, variants, and product page functionality
 */

let currentProduct = null;
let currentImageIndex = 0;
let selectedColor = '';

// Load Product Details Page
function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        showNotification('প্রোডাক্ট আইডি পাওয়া যায়নি।', 'error');
        window.location.href = 'shop.html';
        return;
    }
    
    loadProductData(productId);
}

// Load Product Data
async function loadProductData(productId) {
    try {
        const product = await fetchProductById(productId);
        
        if (!product) {
            showNotification('প্রোডাক্টটি পাওয়া যায়নি।', 'error');
            window.location.href = 'shop.html';
            return;
        }
        
        currentProduct = product;
        displayProductDetails(product);
        loadRelatedProducts(product);
        
    } catch (error) {
        console.error('Error loading product data:', error);
        showNotification('প্রোডাক্ট লোড করতে সমস্যা হচ্ছে।', 'error');
    }
}

// Display Product Details
function displayProductDetails(product) {
    // Update page title
    document.title = `${product.Name} - TinyStepsBD`;
    
    // Update product images
    displayProductImages(product);
    
    // Update product info
    updateProductInfo(product);
    
    // Update color options
    updateColorOptions(product);
    
    // Setup event listeners
    setupProductPageEventListeners();
}

// Display Product Images
function displayProductImages(product) {
    const mainImage = document.getElementById('productMainImage');
    const thumbnailsContainer = document.getElementById('productThumbnails');
    
    if (!mainImage || !thumbnailsContainer) return;
    
    const images = getProductImages(product);
    
    // Set main image
    mainImage.src = images[0];
    mainImage.alt = product.Name;
    mainImage.onerror = function() {
        this.src = 'assets/images/placeholder.jpg';
    };
    
    // Create thumbnails
    thumbnailsContainer.innerHTML = images.map((image, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" 
             onclick="changeMainImage(${index})">
            <img src="${image}" 
                 alt="${product.Name} - Image ${index + 1}"
                 onerror="this.src='assets/images/placeholder.jpg'">
        </div>
    `).join('');
}

// Update Product Information
function updateProductInfo(product) {
    const elements = {
        'productName': product.Name,
        'productId': product['Product ID'],
        'productCategory': product.Category,
        'productCurrentPrice': formatPrice(product['Price (BDT)']),
        'productDescription': product.Description || 'প্রোডাক্টের বিস্তারিত বিবরণ',
        'sizeRange': product.Size || 'N/A'
    };
    
    Object.keys(elements).forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = elements[elementId];
        }
    });
}

// Update Color Options
function updateColorOptions(product) {
    const colorOptionsContainer = document.getElementById('colorOptions');
    if (!colorOptionsContainer) return;
    
    const colors = getProductColors(product);
    selectedColor = colors[0]; // Set default color
    
    colorOptionsContainer.innerHTML = colors.map(color => `
        <div class="color-option ${color === selectedColor ? 'selected' : ''}" 
             data-color="${color}"
             onclick="selectColor('${color}')">
            <span class="color-dot" style="background-color: ${getColorCode(color)}"></span>
            <span class="color-name">${color}</span>
        </div>
    `).join('');
}

// Setup Product Page Event Listeners
function setupProductPageEventListeners() {
    // Quantity selector
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    const quantityInput = document.querySelector('.quantity-input');
    
    if (minusBtn && plusBtn && quantityInput) {
        minusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
        
        plusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue < 10) {
                quantityInput.value = currentValue + 1;
            }
        });
        
        quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value) || 1;
            if (value < 1) value = 1;
            if (value > 10) value = 10;
            this.value = value;
        });
    }
    
    // Add to cart button
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCartFromProductPage);
    }
    
    // Buy now button
    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', buyNowFromProductPage);
    }
}

// Change Main Image
function changeMainImage(index) {
    const images = getProductImages(currentProduct);
    if (index < 0 || index >= images.length) return;
    
    const mainImage = document.getElementById('productMainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (mainImage) {
        mainImage.src = images[index];
    }
    
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
    
    currentImageIndex = index;
}

// Select Color
function selectColor(color) {
    selectedColor = color;
    
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.classList.toggle('selected', option.dataset.color === color);
    });
}

// Add to Cart from Product Page
function addToCartFromProductPage() {
    if (!currentProduct) return;
    
    const quantityInput = document.querySelector('.quantity-input');
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    
    addToCart(currentProduct['Product ID'], selectedColor, quantity);
}

// Buy Now from Product Page
function buyNowFromProductPage() {
    if (!currentProduct) return;
    
    const quantityInput = document.querySelector('.quantity-input');
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    
    // Add to cart first
    addToCart(currentProduct['Product ID'], selectedColor, quantity);
    
    // Redirect to checkout
    window.location.href = 'checkout.html';
}

// Load Related Products
function loadRelatedProducts(product) {
    const relatedContainer = document.getElementById('relatedProducts');
    if (!relatedContainer) return;
    
    // Get products from same category
    const relatedProducts = allProducts.filter(p => 
        p['Product ID'] !== product['Product ID'] && 
        p.Category === product.Category
    ).slice(0, 4); // Show max 4 related products
    
    if (relatedProducts.length === 0) {
        relatedContainer.innerHTML = '<p>সম্পর্কিত কোন প্রোডাক্ট নেই</p>';
        return;
    }
    
    displayProducts(relatedProducts, 'relatedProducts');
}

// Quick View Modal Functions
function openProductModal(product) {
    currentProduct = product;
    const modal = document.getElementById('quickViewModal');
    
    if (!modal) return;
    
    // Update modal content
    updateModalContent(product);
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Setup modal event listeners
    setupModalEventListeners();
}

function closeProductModal() {
    const modal = document.getElementById('quickViewModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function updateModalContent(product) {
    // Update modal images
    const modalMainImage = document.getElementById('modalMainImage');
    const modalThumbnails = document.getElementById('modalThumbnails');
    
    if (modalMainImage && modalThumbnails) {
        const images = getProductImages(product);
        modalMainImage.src = images[0];
        modalMainImage.alt = product.Name;
        
        modalThumbnails.innerHTML = images.map((image, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" 
                 onclick="changeModalImage(${index})">
                <img src="${image}" 
                     alt="${product.Name} - Image ${index + 1}"
                     onerror="this.src='assets/images/placeholder.jpg'">
            </div>
        `).join('');
    }
    
    // Update modal product info
    const modalElements = {
        'modalProductName': product.Name,
        'modalProductId': product['Product ID'],
        'modalCategory': product.Category,
        'modalCurrentPrice': formatPrice(product['Price (BDT)']),
        'modalDescription': product.Description || 'প্রোডাক্টের বিস্তারিত বিবরণ',
        'modalSizeRange': product.Size || 'N/A'
    };
    
    Object.keys(modalElements).forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = modalElements[elementId];
        }
    });
    
    // Update modal color options
    const modalColorOptions = document.getElementById('modalColorOptions');
    if (modalColorOptions) {
        const colors = getProductColors(product);
        selectedColor = colors[0];
        
        modalColorOptions.innerHTML = colors.map(color => `
            <div class="color-option ${color === selectedColor ? 'selected' : ''}" 
                 data-color="${color}"
                 onclick="selectModalColor('${color}')">
                <span class="color-dot" style="background-color: ${getColorCode(color)}"></span>
                <span class="color-name">${color}</span>
            </div>
        `).join('');
    }
}

function setupModalEventListeners() {
    // Close modal
    const closeModal = document.getElementById('closeQuickView');
    const modalOverlay = document.getElementById('modalOverlay');
    
    if (closeModal) closeModal.addEventListener('click', closeProductModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeProductModal);
    
    // Modal quantity selector
    const modalMinus = document.querySelector('.modal .quantity-btn.minus');
    const modalPlus = document.querySelector('.modal .quantity-btn.plus');
    const modalQuantity = document.querySelector('.modal .quantity-input');
    
    if (modalMinus && modalPlus && modalQuantity) {
        modalMinus.addEventListener('click', () => {
            const currentValue = parseInt(modalQuantity.value) || 1;
            if (currentValue > 1) {
                modalQuantity.value = currentValue - 1;
            }
        });
        
        modalPlus.addEventListener('click', () => {
            const currentValue = parseInt(modalQuantity.value) || 1;
            if (currentValue < 10) {
                modalQuantity.value = currentValue + 1;
            }
        });
    }
    
    // Modal add to cart
    const modalAddToCart = document.getElementById('modalAddToCart');
    if (modalAddToCart) {
        modalAddToCart.addEventListener('click', addToCartFromModal);
    }
    
    // Modal buy now
    const modalBuyNow = document.getElementById('modalBuyNow');
    if (modalBuyNow) {
        modalBuyNow.addEventListener('click', buyNowFromModal);
    }
}

function changeModalImage(index) {
    const images = getProductImages(currentProduct);
    if (index < 0 || index >= images.length) return;
    
    const modalMainImage = document.getElementById('modalMainImage');
    const modalThumbnails = document.querySelectorAll('.modal .thumbnail');
    
    if (modalMainImage) {
        modalMainImage.src = images[index];
    }
    
    modalThumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

function selectModalColor(color) {
    selectedColor = color;
    
    const modalColorOptions = document.querySelectorAll('.modal .color-option');
    modalColorOptions.forEach(option => {
        option.classList.toggle('selected', option.dataset.color === color);
    });
}

function addToCartFromModal() {
    if (!currentProduct) return;
    
    const modalQuantity = document.querySelector('.modal .quantity-input');
    const quantity = modalQuantity ? parseInt(modalQuantity.value) || 1 : 1;
    
    addToCart(currentProduct['Product ID'], selectedColor, quantity);
    closeProductModal();
}

function buyNowFromModal() {
    if (!currentProduct) return;
    
    const modalQuantity = document.querySelector('.modal .quantity-input');
    const quantity = modalQuantity ? parseInt(modalQuantity.value) || 1 : 1;
    
    // Add to cart first
    addToCart(currentProduct['Product ID'], selectedColor, quantity);
    
    // Close modal and redirect to checkout
    closeProductModal();
    window.location.href = 'checkout.html';
}

// Make functions globally available
window.loadProductDetails = loadProductDetails;
window.changeMainImage = changeMainImage;
window.selectColor = selectColor;
window.addToCartFromProductPage = addToCartFromProductPage;
window.buyNowFromProductPage = buyNowFromProductPage;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.changeModalImage = changeModalImage;
window.selectModalColor = selectModalColor;
window.addToCartFromModal = addToCartFromModal;
window.buyNowFromModal = buyNowFromModal;