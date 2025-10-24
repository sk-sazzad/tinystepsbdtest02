/**
 * TinyStepsBD - Utility Functions
 * Description: Common utility functions used across the application
 */

// Format Price in Bangladeshi Taka
function formatPrice(price) {
    const numPrice = parseFloat(price) || 0;
    return new Intl.NumberFormat('bn-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numPrice);
}

// Format Date
function formatDate(date, format = 'dd MMM yyyy') {
    const d = new Date(date);
    const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    };
    
    return d.toLocaleDateString('bn-BD', options);
}

// Format Phone Number
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 13 && cleaned.startsWith('8801')) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{3})(\d{3})/, '+$1 $2-$3-$4');
    } else if (cleaned.length === 10 && cleaned.startsWith('1')) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3');
    }
    
    return phone;
}

// Validate Email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate Bangladeshi Phone Number
function isValidBangladeshiPhone(phone) {
    const phoneRegex = /^(?:\+88|01)?(?:\d{11}|\d{13})$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Debounce Function
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle Function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Generate Unique ID
function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}${randomStr}`.toUpperCase();
}

// Sanitize HTML
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Escape Regex Characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get URL Parameters
function getUrlParams() {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    
    return params;
}

// Update URL Parameters
function updateUrlParams(params) {
    const url = new URL(window.location);
    
    Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, params[key]);
        }
    });
    
    window.history.replaceState({}, '', url.toString());
}

// Copy to Clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
}

// Local Storage Helpers
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Session Storage Helpers
const session = {
    set(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to sessionStorage:', error);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from sessionStorage:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from sessionStorage:', error);
            return false;
        }
    },
    
    clear() {
        try {
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing sessionStorage:', error);
            return false;
        }
    }
};

// DOM Helpers
const dom = {
    // Show element
    show(selector) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) element.style.display = '';
        return element;
    },
    
    // Hide element
    hide(selector) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) element.style.display = 'none';
        return element;
    },
    
    // Toggle element visibility
    toggle(selector) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) {
            element.style.display = element.style.display === 'none' ? '' : 'none';
        }
        return element;
    },
    
    // Add class
    addClass(selector, className) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) element.classList.add(className);
        return element;
    },
    
    // Remove class
    removeClass(selector, className) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) element.classList.remove(className);
        return element;
    },
    
    // Toggle class
    toggleClass(selector, className) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) element.classList.toggle(className);
        return element;
    },
    
    // Get computed style
    getStyle(selector, property) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        return element ? window.getComputedStyle(element).getPropertyValue(property) : null;
    }
};

// Number Helpers
const numbers = {
    // Format number with commas
    formatWithCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Round to decimal places
    round(num, decimals = 2) {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },
    
    // Generate random number in range
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Check if number is within range
    inRange(num, min, max) {
        return num >= min && num <= max;
    }
};

// String Helpers
const strings = {
    // Capitalize first letter
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    // Truncate string
    truncate(str, length, suffix = '...') {
        return str.length > length ? str.substring(0, length) + suffix : str;
    },
    
    // Remove diacritics
    removeDiacritics(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },
    
    // Convert to slug
    toSlug(str) {
        return str
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }
};

// Array Helpers
const arrays = {
    // Remove duplicates
    unique(arr) {
        return [...new Set(arr)];
    },
    
    // Shuffle array
    shuffle(arr) {
        return arr.sort(() => Math.random() - 0.5);
    },
    
    // Chunk array
    chunk(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    },
    
    // Flatten array
    flatten(arr) {
        return arr.reduce((flat, next) => flat.concat(Array.isArray(next) ? arrays.flatten(next) : next), []);
    }
};

// Object Helpers
const objects = {
    // Deep clone object
    clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // Merge objects
    merge(...objects) {
        return objects.reduce((merged, obj) => ({ ...merged, ...obj }), {});
    },
    
    // Check if object is empty
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },
    
    // Pick properties from object
    pick(obj, keys) {
        return keys.reduce((result, key) => {
            if (obj.hasOwnProperty(key)) {
                result[key] = obj[key];
            }
            return result;
        }, {});
    }
};

// Export utilities to global scope
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.formatPhoneNumber = formatPhoneNumber;
window.isValidEmail = isValidEmail;
window.isValidBangladeshiPhone = isValidBangladeshiPhone;
window.debounce = debounce;
window.throttle = throttle;
window.generateId = generateId;
window.sanitizeHTML = sanitizeHTML;
window.escapeRegex = escapeRegex;
window.getUrlParams = getUrlParams;
window.updateUrlParams = updateUrlParams;
window.copyToClipboard = copyToClipboard;
window.storage = storage;
window.session = session;
window.dom = dom;
window.numbers = numbers;
window.strings = strings;
window.arrays = arrays;
window.objects = objects;