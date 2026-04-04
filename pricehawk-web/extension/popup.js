// API endpoint - change to production URL when deployed
const API_URL = 'http://localhost:3000';

// DOM elements
const loadingEl = document.getElementById('loading');
const productInfoEl = document.getElementById('productInfo');
const noProductEl = document.getElementById('noProduct');
const errorEl = document.getElementById('errorMessage');
const successEl = document.getElementById('successMessage');
const trackButton = document.getElementById('trackButton');
const productNameEl = document.getElementById('productName');
const productPriceEl = document.getElementById('productPrice');
const productStoreEl = document.getElementById('productStore');
const productImageEl = document.getElementById('productImage');
const manualPriceSection = document.getElementById('manualPriceSection');
const manualPriceInput = document.getElementById('manualPriceInput');
const existingProductSelect = document.getElementById('existingProductSelect');

let currentProduct = null;
let currentTab = null;
let userProducts = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Request product data from content script
  detectProduct();
  fetchUserProducts();
});

// Fetch user products for dropdown
async function fetchUserProducts() {
  try {
    const response = await fetch(`${API_URL}/api/products`);
    if (response.ok) {
      const data = await response.json();
      userProducts = data.products || [];

      // Populate dropdown
      userProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        existingProductSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Failed to fetch user products for dropdown', error);
  }
}

// Detect product on current page
async function detectProduct() {
  loadingEl.classList.remove('hidden');
  noProductEl.classList.add('hidden');

  try {
    // Try to get product data from content script
    const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'getProduct' });

    if (response && response.product) {
      currentProduct = response.product;
      showProduct(response.product);
    } else {
      showNoProduct();
    }
  } catch (error) {
    // Content script not loaded or no product detected
    showNoProduct();
  }
}

// Show detected product
function showProduct(product) {
  loadingEl.classList.add('hidden');
  productInfoEl.classList.add('detected');
  noProductEl.classList.add('hidden');

  productNameEl.textContent = product.name || 'Unknown Product';

  if (product.price) {
    productPriceEl.textContent = `$${product.price.toFixed(2)}`;
    manualPriceSection.classList.remove('show');
  } else {
    productPriceEl.textContent = 'Price not detected';
    manualPriceSection.classList.add('show');
  }

  if (product.store) {
    productStoreEl.textContent = `From: ${getStoreName(product.store)}`;
  }

  if (product.imageUrl) {
    productImageEl.src = product.imageUrl;
    productImageEl.classList.remove('hidden');
  } else {
    productImageEl.classList.add('hidden');
  }

  trackButton.disabled = false;
}

// Show no product state
function showNoProduct() {
  loadingEl.classList.add('hidden');
  productInfoEl.classList.remove('detected');
  noProductEl.classList.add('show');
  trackButton.disabled = true;
}

// Show error
function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.add('show');
  setTimeout(() => {
    errorEl.classList.remove('show');
  }, 5000);
}

// Show success
function showSuccess() {
  productInfoEl.style.display = 'none';
  successEl.classList.add('show');
}

// Get store display name
function getStoreName(store) {
  const names = {
    'AMAZON': 'Amazon',
    'WALMART': 'Walmart',
    'TARGET': 'Target',
    'BESTBUY': 'Best Buy',
    'EBAY': 'eBay',
    'COSTCO': 'Costco',
    'GAMESTOP': 'GameStop',
    'NEWEGG': 'Newegg',
    'BH': 'B&H Photo',
    'OTHER': 'Unknown Store'
  };
  return names[store] || store;
}

// Track button click
trackButton.addEventListener('click', async () => {
  if (!currentProduct) return;

  trackButton.disabled = true;
  trackButton.textContent = 'Adding...';

  // Use manual price if entered and no price detected
  if (!currentProduct.price && manualPriceInput.value) {
    currentProduct.price = parseFloat(manualPriceInput.value);
  }

  try {
    const requestBody = {
        url: currentProduct.url,
        name: currentProduct.name,
        price: currentProduct.price,
        imageUrl: currentProduct.imageUrl,
        store: currentProduct.store
    };

    if (existingProductSelect.value) {
        requestBody.productId = existingProductSelect.value;
    }

    const response = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409 && data.product) {
        // Product already tracked
        showSuccess();
      } else {
        showError(data.error || 'Failed to add product');
        trackButton.disabled = false;
        trackButton.textContent = 'Track This Product';
      }
    } else {
      showSuccess();
    }
  } catch (error) {
    showError('Failed to connect to PriceHawk. Is the server running?');
    trackButton.disabled = false;
    trackButton.textContent = 'Track This Product';
  }
});

// Refresh button (click on header)
document.querySelector('.header').addEventListener('click', () => {
  location.reload();
});
