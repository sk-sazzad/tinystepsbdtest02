/**
 * TinyStepsBD - Checkout Process
 * Description: Handles checkout form validation, order submission, and payment processing
 */

// Initialize Checkout Page
function loadCheckoutPage() {
    updateCheckoutPage();
    setupCheckoutForm();
    setupDeliveryAreaCalculation();
}

// Setup Checkout Form
function setupCheckoutForm() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    
    // Real-time form validation
    const formInputs = checkoutForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Setup Delivery Area Calculation
function setupDeliveryAreaCalculation() {
    const deliveryArea = document.getElementById('deliveryArea');
    if (deliveryArea) {
        deliveryArea.addEventListener('change', updateDeliveryFee);
    }
}

// Update Delivery Fee Based on Area
function updateDeliveryFee() {
    const deliveryArea = document.getElementById('deliveryArea');
    const checkoutDelivery = document.getElementById('checkoutDelivery');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    if (!deliveryArea || !checkoutDelivery || !checkoutTotal) return;

    const deliveryFee = deliveryArea.value === 'inside_dhaka' ? 80 : 150;
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + deliveryFee;

    checkoutDelivery.textContent = formatPrice(deliveryFee);
    checkoutTotal.textContent = formatPrice(total);
}

// Handle Checkout Form Submission
function handleCheckoutSubmit(event) {
    event.preventDefault();
    
    if (!validateCheckoutForm()) {
        showNotification('দয়া করে সব প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন।', 'error');
        return;
    }

    if (cartItems.length === 0) {
        showNotification('আপনার কার্টে কোন প্রোডাক্ট নেই।', 'error');
        return;
    }

    processOrder();
}

// Validate Checkout Form
function validateCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    let isValid = true;

    // Required fields
    const requiredFields = ['customerName', 'customerPhone', 'deliveryArea', 'customerAddress'];
    
    requiredFields.forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field || !field.value.trim()) {
            markFieldError(field, 'এই ঘরটি পূরণ করা বাধ্যতামূলক');
            isValid = false;
        }
    });

    // Phone number validation
    const phoneField = form.querySelector('[name="customerPhone"]');
    if (phoneField && phoneField.value.trim()) {
        const phoneRegex = /^(?:\+88|01)?(?:\d{11}|\d{13})$/;
        if (!phoneRegex.test(phoneField.value.trim())) {
            markFieldError(phoneField, 'সঠিক মোবাইল নম্বর লিখুন');
            isValid = false;
        }
    }

    // Email validation (optional)
    const emailField = form.querySelector('[name="customerEmail"]');
    if (emailField && emailField.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value.trim())) {
            markFieldError(emailField, 'সঠিক ইমেইল ঠিকানা লিখুন');
            isValid = false;
        }
    }

    return isValid;
}

// Validate Individual Field
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    clearFieldError(field);

    if (field.hasAttribute('required') && !value) {
        markFieldError(field, 'এই ঘরটি পূরণ করা বাধ্যতামূলক');
        return;
    }

    switch(field.type) {
        case 'tel':
            if (value && !/^(?:\+88|01)?(?:\d{11}|\d{13})$/.test(value)) {
                markFieldError(field, 'সঠিক মোবাইল নম্বর লিখুন');
            }
            break;
        case 'email':
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                markFieldError(field, 'সঠিক ইমেইল ঠিকানা লিখুন');
            }
            break;
    }
}

// Mark Field with Error
function markFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: #f44336;
        font-size: 12px;
        margin-top: 5px;
    `;
    
    field.parentNode.appendChild(errorElement);
}

// Clear Field Error
function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('error');
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Process Order Submission
async function processOrder() {
    const form = document.getElementById('checkoutForm');
    const submitButton = document.getElementById('placeOrderBtn');
    
    if (!form || !submitButton) return;

    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = 'প্রসেস হচ্ছে...';

    try {
        // Prepare order data
        const orderData = {
            customer_name: form.customerName.value.trim(),
            phone: form.customerPhone.value.trim(),
            customer_email: form.customerEmail.value.trim() || '',
            address: form.customerAddress.value.trim(),
            delivery_area: form.deliveryArea.value,
            products: getCartItemsForCheckout(),
            payment_method: form.paymentMethod.value,
            special_notes: form.specialNotes.value.trim() || ''
        };

        // Submit order to Google Apps Script
        const response = await submitOrderToAPI(orderData);
        
        if (response.success) {
            // Order successful
            handleOrderSuccess(response.data);
        } else {
            throw new Error(response.error || 'অর্ডার সাবমিট করতে সমস্যা হচ্ছে।');
        }

    } catch (error) {
        console.error('Order submission error:', error);
        showNotification(`অর্ডার সাবমিট করতে সমস্যা: ${error.message}`, 'error');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'অর্ডার কনফার্ম করুন';
    }
}

// Submit Order to Google Apps Script API
async function submitOrderToAPI(orderData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return await response.json();
}

// Handle Successful Order
function handleOrderSuccess(orderResponse) {
    // Store order details for success page
    const orderDetails = {
        orderId: orderResponse.order_id,
        totalAmount: orderResponse.total_amount,
        deliveryFee: orderResponse.delivery_fee,
        itemsCount: orderResponse.items_count,
        customerName: document.getElementById('customerName').value.trim()
    };
    
    localStorage.setItem('tinystepsbd_last_order', JSON.stringify(orderDetails));
    
    // Clear cart
    clearCart();
    
    // Redirect to success page
    window.location.href = 'success.html';
}

// Load Checkout Data
function loadCheckoutData() {
    updateCheckoutPage();
}

// Make functions globally available
window.loadCheckoutPage = loadCheckoutPage;
window.validateField = validateField;
window.clearFieldError = clearFieldError;