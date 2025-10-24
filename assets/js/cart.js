/**
 * TinyStepsBD - Shopping Cart Management
 * Description: Handles cart operations, localStorage management, and cart UI updates
 */

let cartItems = [];

// Initialize Cart
function initializeCart() {
    loadCartFromStorage();
    setupCartEventListeners();
}

// Load Cart from LocalStorage
function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('tinystepsbd_cart');
        cartItems = savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
        console.error('Error loading cart from storage:', error);
        cartItems = [];
    }
}

// Save Cart to LocalStorage
function saveCartToStorage() {
    try {
        localStorage.setItem('tinystepsbd_cart', JSON.stringify(cartItems));
    } catch (error) {
        console.error('Error saving cart to storage:', error);
    }
}

// Setup Cart Event Listeners
function setupCartEventListeners() {
    // Cart icon click
    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        cartIcon.addEventListener('click', toggleCartSidebar);
    }

    // Close cart
    const closeCart = document.getElementById('closeCart');
    const cartOverlay = document.getElementById('cartOverlay');
    
    if (closeCart) closeCart.addEventListener('click', closeCartSidebar);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartSidebar);

    // Continue shopping button
    const continueShoppingBtn = document.querySelector('.continue-shopping');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', closeCartSidebar);
    }
}

// Add to Cart
function addToCart(productId, color = 'ডিফল্ট', quantity = 1) {
    // Check if product exists in allProducts (from app.js)
    const product = allProducts.find(p => p['Product ID'] === productId);
    if (!product) {
        showNotification('প্রোডাক্টটি পাওয়া যায়নি।', 'error');
        return;
    }

    // Check if product already in cart
    const existingItemIndex = cartItems.findIndex(item => 
        item.productId === productId && item.color === color
    );

    if (existingItemIndex > -1) {
        // Update quantity
        cartItems[existingItemIndex].quantity += quantity;
    } else {
        // Add new item
        cartItems.push({
            productId: productId,
            name: product.Name,
            price: parseFloat(product['Price (BDT)']) || 0,
            color: color,
            quantity: quantity,
            image: product['Main Image'] || product.Image1,
            size: product.Size || 'N/A'
        });
    }

    saveCartToStorage();
    updateCartUI();
    showNotification('প্রোডাক্টটি কার্টে যোগ করা হয়েছে!', 'success');
    
    // Open cart sidebar if not on cart page
    if (!window.location.pathname.includes('cart.html')) {
        openCartSidebar();
    }
}

// Remove from Cart
function removeFromCart(productId, color) {
    cartItems = cartItems.filter(item => 
        !(item.productId === productId && item.color === color)
    );
    
    saveCartToStorage();
    updateCartUI();
    showNotification('প্রোডাক্টটি কার্ট থেকে সরানো হয়েছে।', 'info');
}

// Update Item Quantity
function updateCartItemQuantity(productId, color, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId, color);
        return;
    }

    const item = cartItems.find(item => 
        item.productId === productId && item.color === color
    );
    
    if (item) {
        item.quantity = newQuantity;
        saveCartToStorage();
        updateCartUI();
    }
}

// Clear Cart
function clearCart() {
    cartItems = [];
    saveCartToStorage();
    updateCartUI();
    showNotification('কার্ট খালি করা হয়েছে।', 'info');
}

// Update Cart UI
function updateCartUI() {
    updateCartCount();
    updateCartSidebar();
    updateCartPage();
    updateCheckoutPage();
}

// Update Cart Count in Header
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
        element.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// Update Cart Sidebar
function updateCartSidebar() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalAmount = document.getElementById('cartTotalAmount');
    
    if (!cartItemsContainer) return;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <p>আপনার কার্টে কোন প্রোডাক্ট নেই</p>
                <button class="continue-shopping" onclick="closeCartSidebar()">কিনতে চলুন</button>
            </div>
        `;
        if (cartTotalAmount) cartTotalAmount.textContent = '০৳';
        return;
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartItemsContainer.innerHTML = cartItems.map(item => `
        <div class="cart-sidebar-item">
            <img src="${item.image}" alt="${item.name}" 
                 onerror="this.src='assets/images/placeholder.jpg'">
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>রং: ${item.color} | সাইজ: ${item.size}</p>
                <div class="item-price">${formatPrice(item.price)} x ${item.quantity}</div>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.productId}', '${item.color}')">
                &times;
            </button>
        </div>
    `).join('');

    if (cartTotalAmount) {
        cartTotalAmount.textContent = formatPrice(totalAmount);
    }
}

// Update Cart Page
function updateCartPage() {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const deliveryFee = document.getElementById('deliveryFee');
    const totalAmount = document.getElementById('totalAmount');
    
    if (!cartItemsList || !emptyCart) return;

    if (cartItems.length === 0) {
        cartItemsList.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }

    cartItemsList.style.display = 'block';
    emptyCart.style.display = 'none';

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = calculateDeliveryFee();
    const total = subtotal + delivery;

    cartItemsList.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}"
                     onerror="this.src='assets/images/placeholder.jpg'">
            </div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <p class="item-variant">রং: ${item.color} | সাইজ: ${item.size}</p>
                <p class="item-price">${formatPrice(item.price)}</p>
            </div>
            <div class="item-quantity">
                <button class="quantity-btn minus" 
                        onclick="updateCartItemQuantity('${item.productId}', '${item.color}', ${item.quantity - 1})">
                    -
                </button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn plus" 
                        onclick="updateCartItemQuantity('${item.productId}', '${item.color}', ${item.quantity + 1})">
                    +
                </button>
            </div>
            <div class="item-total">
                ${formatPrice(item.price * item.quantity)}
            </div>
            <button class="remove-item" 
                    onclick="removeFromCart('${item.productId}', '${item.color}')">
                &times;
            </button>
        </div>
    `).join('');

    if (subtotalAmount) subtotalAmount.textContent = formatPrice(subtotal);
    if (deliveryFee) deliveryFee.textContent = formatPrice(delivery);
    if (totalAmount) totalAmount.textContent = formatPrice(total);
}

// Update Checkout Page
function updateCheckoutPage() {
    const checkoutOrderItems = document.getElementById('checkoutOrderItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutDelivery = document.getElementById('checkoutDelivery');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    if (!checkoutOrderItems) return;

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = calculateDeliveryFee();
    const total = subtotal + delivery;

    checkoutOrderItems.innerHTML = cartItems.map(item => `
        <div class="checkout-item">
            <div class="checkout-item-image">
                <img src="${item.image}" alt="${item.name}"
                     onerror="this.src='assets/images/placeholder.jpg'">
            </div>
            <div class="checkout-item-details">
                <h4>${item.name}</h4>
                <p>রং: ${item.color} | সাইজ: ${item.size}</p>
                <p>পরিমাণ: ${item.quantity} x ${formatPrice(item.price)}</p>
            </div>
            <div class="checkout-item-total">
                ${formatPrice(item.price * item.quantity)}
            </div>
        </div>
    `).join('');

    if (checkoutSubtotal) checkoutSubtotal.textContent = formatPrice(subtotal);
    if (checkoutDelivery) checkoutDelivery.textContent = formatPrice(delivery);
    if (checkoutTotal) checkoutTotal.textContent = formatPrice(total);
}

// Calculate Delivery Fee
function calculateDeliveryFee(address = '') {
    const dhakaAreas = ['ঢাকা', 'Dhaka', 'DHAKA', 'মিরপুর', 'উত্তরা', 'গুলশান', 'বনানী', 'ধানমন্ডি', 'মোহাম্মদপুর', 'ফার্মগেট', 'শাহবাগ', 'যাত্রাবাড়ী', 'রামপুরা', 'বাড্ডা'];
    
    if (address) {
        const area = address.toLowerCase();
        if (dhakaAreas.some(k => area.includes(k.toLowerCase()))) {
            return 80;
        }
        return 150;
    }
    
    // Default delivery fee
    return 150;
}

// Cart Sidebar Functions
function openCartSidebar() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    
    if (cartSidebar) cartSidebar.classList.add('active');
    if (cartOverlay) cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartSidebar() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    
    if (cartSidebar) cartSidebar.classList.remove('active');
    if (cartOverlay) cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleCartSidebar() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar && cartSidebar.classList.contains('active')) {
        closeCartSidebar();
    } else {
        openCartSidebar();
    }
}

// Load Cart Page
function loadCartPage() {
    updateCartPage();
}

// Get Cart Items for Checkout
function getCartItemsForCheckout() {
    return cartItems.map(item => ({
        product_id: item.productId,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        main_image: item.image
    }));
}

// Make functions globally available
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.clearCart = clearCart;
window.openCartSidebar = openCartSidebar;
window.closeCartSidebar = closeCartSidebar;
window.toggleCartSidebar = toggleCartSidebar;
window.loadCartPage = loadCartPage;
window.getCartItemsForCheckout = getCartItemsForCheckout;