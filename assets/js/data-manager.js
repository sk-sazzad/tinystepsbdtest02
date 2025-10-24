/**
 * TinyStepsBD - Data Management
 * Description: Handles data fetching from Google Sheets API and data processing
 */

// Fetch Products from Google Apps Script API
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}?action=products`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch products');
        }
        
        return processProductData(data.data);
        
    } catch (error) {
        console.error('Error fetching products:', error);
        showNotification('প্রোডাক্ট লোড করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।', 'error');
        return [];
    }
}

// Process Product Data from API
function processProductData(products) {
    return products.map(product => {
        // Ensure all required fields have default values
        return {
            'Product ID': product['Product ID'] || '',
            'Name': product['Name'] || 'প্রোডাক্টের নাম',
            'Description': product['Description'] || 'প্রোডাক্টের বিবরণ',
            'Price (BDT)': parseFloat(product['Price (BDT)']) || 0,
            'Category': product['Category'] || 'ছেলে/মেয়ে',
            'Size': product['Size'] || '০-২ বছর',
            'Color': product['Color'] || 'লাল, নীল',
            'Drive Link': product['Drive Link'] || '',
            'Image Folder': product['Image Folder'] || '',
            'Main Image': product['Main Image'] || product['Image1'] || '',
            'Image1': product['Image1'] || '',
            'Image2': product['Image2'] || '',
            'Image3': product['Image3'] || '',
            'Image4': product['Image4'] || '',
            'Image5': product['Image5'] || '',
            'Image6': product['Image6'] || ''
        };
    }).filter(product => product['Product ID']); // Remove products without ID
}

// Fetch Single Product by ID
async function fetchProductById(productId) {
    try {
        const response = await fetch(`${API_URL}?action=product&id=${encodeURIComponent(productId)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Product not found');
        }
        
        return processProductData([data.data])[0];
        
    } catch (error) {
        console.error('Error fetching product:', error);
        showNotification('প্রোডাক্ট লোড করতে সমস্যা হচ্ছে।', 'error');
        return null;
    }
}

// Fetch Orders from API (for admin/order tracking)
async function fetchOrders() {
    try {
        const response = await fetch(`${API_URL}?action=orders`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch orders');
        }
        
        return data.data;
        
    } catch (error) {
        console.error('Error fetching orders:', error);
        showNotification('অর্ডার লোড করতে সমস্যা হচ্ছে।', 'error');
        return [];
    }
}

// Search Products
function searchProducts(products, searchTerm) {
    if (!searchTerm) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
        (product.Name && product.Name.toLowerCase().includes(term)) ||
        (product.Description && product.Description.toLowerCase().includes(term)) ||
        (product.Category && product.Category.toLowerCase().includes(term)) ||
        (product.Color && product.Color.toLowerCase().includes(term))
    );
}

// Filter Products by Category
function filterProductsByCategory(products, category) {
    if (!category || category === 'all') return products;
    
    return products.filter(product => 
        product.Category && product.Category.toLowerCase().includes(category.toLowerCase())
    );
}

// Filter Products by Age
function filterProductsByAge(products, ageRange) {
    if (!ageRange || ageRange === 'all') return products;
    
    return products.filter(product => 
        product.Size && product.Size.includes(ageRange)
    );
}

// Sort Products
function sortProducts(products, sortBy) {
    const sortedProducts = [...products];
    
    switch(sortBy) {
        case 'price-low':
            return sortedProducts.sort((a, b) => (a['Price (BDT)'] || 0) - (b['Price (BDT)'] || 0));
        case 'price-high':
            return sortedProducts.sort((a, b) => (b['Price (BDT)'] || 0) - (a['Price (BDT)'] || 0));
        case 'name':
            return sortedProducts.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
        case 'newest':
        default:
            return sortedProducts;
    }
}

// Get Product Images Array
function getProductImages(product) {
    const images = [];
    
    // Add main image first
    if (product['Main Image']) {
        images.push(product['Main Image']);
    }
    
    // Add additional images
    for (let i = 1; i <= 6; i++) {
        const imageKey = `Image${i}`;
        if (product[imageKey] && !images.includes(product[imageKey])) {
            images.push(product[imageKey]);
        }
    }
    
    // If no images found, add placeholder
    if (images.length === 0) {
        images.push('assets/images/placeholder.jpg');
    }
    
    return images;
}

// Get Product Colors Array
function getProductColors(product) {
    if (!product.Color) return ['ডিফল্ট'];
    
    return product.Color.split(',').map(color => color.trim()).filter(color => color);
}

// Validate Product Data
function validateProductData(product) {
    const errors = [];
    
    if (!product['Product ID']) errors.push('Product ID is required');
    if (!product['Name']) errors.push('Product name is required');
    if (!product['Price (BDT)'] || isNaN(product['Price (BDT)'])) errors.push('Valid price is required');
    if (!product['Main Image'] && !product['Image1']) errors.push('At least one image is required');
    
    return errors;
}

// Cache Management
const productCache = {
    data: null,
    timestamp: null,
    duration: 5 * 60 * 1000, // 5 minutes
    
    get() {
        if (this.data && this.timestamp && (Date.now() - this.timestamp) < this.duration) {
            return this.data;
        }
        return null;
    },
    
    set(products) {
        this.data = products;
        this.timestamp = Date.now();
    },
    
    clear() {
        this.data = null;
        this.timestamp = null;
    }
};

// Enhanced fetch products with cache
async function fetchProductsWithCache() {
    const cached = productCache.get();
    if (cached) {
        return cached;
    }
    
    const products = await fetchProducts();
    productCache.set(products);
    return products;
}

// Make functions globally available
window.fetchProducts = fetchProducts;
window.fetchProductById = fetchProductById;
window.fetchOrders = fetchOrders;
window.searchProducts = searchProducts;
window.filterProductsByCategory = filterProductsByCategory;
window.filterProductsByAge = filterProductsByAge;
window.sortProducts = sortProducts;
window.getProductImages = getProductImages;
window.getProductColors = getProductColors;
window.fetchProductsWithCache = fetchProductsWithCache;