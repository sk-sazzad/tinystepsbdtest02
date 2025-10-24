/**
 * TinyStepsBD - Main Application JavaScript
 * Author: TinyStepsBD
 * Description: Main app initialization, component loading, and global functions
 */

// Global Variables
const API_URL = 'https://script.google.com/macros/s/AKfycbyW3ZHdsQI2ohP6Fk3CAHhsYp4n_YY3BC9cJDedRqSqMMeL4a4BswE-DHbDuYChJlwM/exec';
let allProducts = [];
let currentProduct = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    loadComponents();
    initializeCart();
    setupEventListeners();
    loadInitialData();
}

// Load Header and Footer Components
function loadComponents() {
    loadComponent('header', 'components/header.html');
    loadComponent('footer', 'components/footer.html');
}

// Load Individual Component
function loadComponent(elementId, componentPath) {
    const element = document.getElementById(elementId);
    if (!element) return;

    fetch(componentPath)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            element.innerHTML = html;
            // Re-initialize cart for header after loading
            if (elementId === 'header') {
                initializeCart();
            }
        })
        .catch(error => {
            console.error('Error loading component:', error);
            element.innerHTML = '<p>Component loading failed.</p>';
        });
}

// Initialize Cart System
function initializeCart() {
    updateCartCount();
    setupCartEventListeners();
}

// Setup Global Event Listeners
function setupEventListeners() {
    // Search functionality
    const searchButton = document.getElementById('searchButton');
    const productSearch = document.getElementById('productSearch');
    
    if (searchButton && productSearch) {
        searchButton.addEventListener('click', handleSearch);
        productSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSearch();
        });
    }

    // Filter functionality
    const categoryFilter = document.getElementById('categoryFilter');
    const ageFilter = document.getElementById('ageFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (ageFilter) ageFilter.addEventListener('change', applyFilters);
    if (sortFilter) sortFilter.addEventListener('change', applyFilters);

    // WhatsApp subscribe forms
    const subscribeForms = document.querySelectorAll('.subscribe-form');
    subscribeForms.forEach(form => {
        form.addEventListener('submit', handleWhatsAppSubscribe);
    });
}

// Load Initial Data Based on Page
function loadInitialData() {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'index.html':
        case '':
            loadFeaturedProducts();
            break;
        case 'shop.html':
            loadAllProducts();
            break;
        case 'product.html':
            loadProductDetails();
            break;
        case 'cart.html':
            loadCartPage();
            break;
        case 'checkout.html':
            loadCheckoutPage();
            break;
        case 'orders.html':
            loadOrdersPage();
            break;
    }
}

// Load Featured Products for Homepage
function loadFeaturedProducts() {
    fetchProducts()
        .then(products => {
            const featuredContainer = document.getElementById('featuredProducts');
            if (!featuredContainer) return;

            // Get first 6 products as featured
            const featuredProducts = products.slice(0, 6);
            displayProducts(featuredProducts, 'featuredProducts');
        })
        .catch(error => {
            console.error('Error loading featured products:', error);
        });
}

// Load All Products for Shop Page
function loadAllProducts() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noProducts = document.getElementById('noProducts');
    
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (noProducts) noProducts.style.display = 'none';

    fetchProducts()
        .then(products => {
            allProducts = products;
            applyFilters();
        })
        .catch(error => {
            console.error('Error loading products:', error);
            if (noProducts) {
                noProducts.style.display = 'block';
                noProducts.innerHTML = '<p>প্রোডাক্ট লোড করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।</p>';
            }
        })
        .finally(() => {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
        });
}

// Apply Filters to Products
function applyFilters() {
    if (allProducts.length === 0) return;

    let filteredProducts = [...allProducts];
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && categoryFilter.value !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
            product.Category && product.Category.toLowerCase().includes(categoryFilter.value.toLowerCase())
        );
    }
    
    // Age filter
    const ageFilter = document.getElementById('ageFilter');
    if (ageFilter && ageFilter.value !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
            product.Size && product.Size.includes(ageFilter.value)
        );
    }
    
    // Search filter
    const searchInput = document.getElementById('productSearch');
    if (searchInput && searchInput.value.trim() !== '') {
        const searchTerm = searchInput.value.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
            (product.Name && product.Name.toLowerCase().includes(searchTerm)) ||
            (product.Description && product.Description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Sort products
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        switch(sortFilter.value) {
            case 'price-low':
                filteredProducts.sort((a, b) => (parseFloat(a['Price (BDT)']) || 0) - (parseFloat(b['Price (BDT)']) || 0));
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => (parseFloat(b['Price (BDT)']) || 0) - (parseFloat(a['Price (BDT)']) || 0));
                break;
            case 'name':
                filteredProducts.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
                break;
            case 'newest':
            default:
                // Keep original order (newest first as per API)
                break;
        }
    }
    
    displayProducts(filteredProducts, 'allProducts');
    
    // Show no products message if empty
    const noProducts = document.getElementById('noProducts');
    if (noProducts) {
        noProducts.style.display = filteredProducts.length === 0 ? 'block' : 'none';
    }
}

// Handle Search Functionality
function handleSearch() {
    applyFilters();
}

// Display Products in Grid
function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p class="no-products">কোন প্রোডাক্ট পাওয়া যায়নি।</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product['Product ID']}">
            <div class="product-image">
                <img src="${product['Main Image'] || product.Image1}" 
                     alt="${product.Name}" 
                     class="main-product-img" 
                     loading="lazy"
                     onerror="this.src='assets/images/placeholder.jpg'">
                <div class="product-badge">নতুন</div>
                <button class="quick-view-btn" onclick="openQuickView('${product['Product ID']}')">
                    দ্রুত দেখুন
                </button>
            </div>
            
            <div class="product-info">
                <h3 class="product-name">${product.Name || 'প্রোডাক্টের নাম'}</h3>
                <p class="product-category">${product.Category || 'ছেলে/মেয়ে'} • ${product.Size || '০-২ বছর'}</p>
                
                <div class="product-colors">
                    <span class="color-label">রং:</span>
                    <div class="color-options">
                        ${product.Color ? product.Color.split(',').slice(0,3).map(color => 
                            `<span class="color-dot" style="background-color: ${getColorCode(color.trim())}" 
                                  data-color="${color.trim()}"></span>`
                        ).join('') : ''}
                    </div>
                </div>
                
                <div class="product-sizes">
                    <span class="size-label">সাইজ:</span>
                    <span class="size-range">${product.Size || '২০-৩০'}</span>
                </div>
                
                <div class="product-price">
                    <span class="current-price">${formatPrice(product['Price (BDT)'])}</span>
                </div>
                
                <div class="product-actions">
                    <button class="add-to-cart-btn" onclick="addToCart('${product['Product ID']}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.2 16.5H17M17 13V16.5M9 19.5C9 20.3 8.3 21 7.5 21C6.7 21 6 20.3 6 19.5C6 18.7 6.7 18 7.5 18C8.3 18 9 18.7 9 19.5ZM18 19.5C18 20.3 17.3 21 16.5 21C15.7 21 15 20.3 15 19.5C15 18.7 15.7 18 16.5 18C17.3 18 18 18.7 18 19.5Z"/>
                        </svg>
                        কার্টে যোগ করুন
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Open Quick View Modal
function openQuickView(productId) {
    const product = allProducts.find(p => p['Product ID'] === productId);
    if (!product) return;

    currentProduct = product;
    
    // This function will be implemented in product.js
    if (typeof openProductModal === 'function') {
        openProductModal(product);
    } else {
        // Fallback: redirect to product page
        window.location.href = `product.html?id=${productId}`;
    }
}

// Handle WhatsApp Subscription
function handleWhatsAppSubscribe(event) {
    event.preventDefault();
    
    const form = event.target;
    const phoneInput = form.querySelector('.phone-input');
    const phoneNumber = phoneInput.value.trim();
    
    if (!phoneNumber) {
        showNotification('দয়া করে আপনার মোবাইল নম্বর লিখুন।', 'error');
        return;
    }
    
    // Basic phone number validation for Bangladesh
    const phoneRegex = /^(?:\+88|01)?(?:\d{11}|\d{13})$/;
    if (!phoneRegex.test(phoneNumber)) {
        showNotification('দয়া করে সঠিক মোবাইল নম্বর লিখুন।', 'error');
        return;
    }
    
    // Format phone number for WhatsApp
    let formattedNumber = phoneNumber;
    if (phoneNumber.startsWith('01')) {
        formattedNumber = '88' + phoneNumber;
    } else if (phoneNumber.startsWith('+88')) {
        formattedNumber = phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('88')) {
        formattedNumber = '88' + phoneNumber;
    }
    
    // Create WhatsApp message
    const message = "হ্যালো TinyStepsBD, আমি নতুন প্রোডাক্ট এবং অফার সম্পর্কে আপডেট পেতে চাই।";
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Show success message
    showNotification('হোয়াটসঅ্যাপ ওপেন হয়েছে। মেসেজ সেন্ড করুন।', 'success');
    
    // Reset form
    form.reset();
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Utility function to get color code
function getColorCode(colorName) {
    const colorMap = {
        'লাল': '#ff4444',
        'নীল': '#4444ff',
        'গোলাপি': '#ff44ff',
        'সাদা': '#ffffff',
        'কালো': '#000000',
        'হলুদ': '#ffff44',
        'সবুজ': '#44ff44',
        'বাদামী': '#a52a2a',
        'ধূসর': '#808080',
        'কমলা': '#ffa500'
    };
    
    return colorMap[colorName] || '#cccccc';
}

// Make functions globally available
window.openQuickView = openQuickView;
window.handleSearch = handleSearch;
window.applyFilters = applyFilters;
window.handleWhatsAppSubscribe = handleWhatsAppSubscribe;
window.showNotification = showNotification;