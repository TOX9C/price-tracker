// Content script - runs on ALL e-commerce pages
// Dynamically extracts product information from any page

(function() {
  'use strict';

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProduct') {
      const product = detectProduct();
      console.log('PriceHawk detected:', product);
      sendResponse({ product });
    }
    return true;
  });

  // Main product detection function
  function detectProduct() {
    const url = window.location.href;
    const store = detectStore(url);

    // Start with generic extraction (works on most sites)
    let product = extractGeneric();

    // Override with store-specific extraction if available
    // Store-specific usually has better accuracy for known sites
    const storeExtractors = {
      'AMAZON': extractAmazon,
      'WALMART': extractWalmart,
      'TARGET': extractTarget,
      'BESTBUY': extractBestBuy,
      'EBAY': extractEbay,
      'COSTCO': extractCostco,
      'GAMESTOP': extractGameStop,
      'NEWEGG': extractNewegg,
      'BH': extractBH
    };

    if (storeExtractors[store]) {
      const storeProduct = storeExtractors[store]();
      // Only use store-specific if it found something better
      if (storeProduct.name && (!product.name || storeProduct.name.length > 3)) {
        product = storeProduct;
      }
    }

    product.store = store;
    product.url = url;
    return product;
  }

  // Detect store from URL
  function detectStore(url) {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('amazon') || hostname.includes('amzn.')) return 'AMAZON';
    if (hostname.includes('walmart')) return 'WALMART';
    if (hostname.includes('target')) return 'TARGET';
    if (hostname.includes('bestbuy')) return 'BESTBUY';
    if (hostname.includes('ebay')) return 'EBAY';
    if (hostname.includes('costco')) return 'COSTCO';
    if (hostname.includes('gamestop')) return 'GAMESTOP';
    if (hostname.includes('newegg')) return 'NEWEGG';
    if (hostname.includes('bhphotovideo')) return 'BH';
    return 'OTHER';
  }

  // Extract price from text - handles various formats
  function parsePrice(text) {
    if (!text) return null;

    // Try to extract price with currency symbol
    const patterns = [
      /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,  // $1,234.56 or 1,234.56
      /(\d+(?:\.\d{2}))/,                          // 123.45
      /\$\s*(\d+)/                                  // $123
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (price > 0 && price < 100000) {  // Reasonable price range
          return price;
        }
      }
    }
    return null;
  }

  // ============================================
  // GENERIC EXTRACTION - Works on most sites
  // ============================================
  function extractGeneric() {
    const product = {
      url: window.location.href,
      store: 'OTHER',
      name: null,
      price: null,
      imageUrl: null,
      available: true
    };

    // Try JSON-LD structured data first (many sites use this)
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        // Handle both single object and array
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Product' || item?.mainEntity?.['@type'] === 'Product') {
            const pData = item['@type'] === 'Product' ? item : item.mainEntity;
            if (pData.name) product.name = pData.name;
            if (pData.offers?.price) product.price = parseFloat(pData.offers.price);
            if (pData.offers?.priceSpecification?.price) {
              product.price = parseFloat(pData.offers.priceSpecification.price);
            }
            if (pData.image) {
              product.imageUrl = Array.isArray(pData.image) ? pData.image[0] : pData.image;
            }
            if (product.name) break;
          }
        }
      } catch (e) {}
    }

    // Open Graph meta tags
    if (!product.name) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) product.name = ogTitle.getAttribute('content');
    }

    if (!product.imageUrl) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) product.imageUrl = ogImage.getAttribute('content');
    }

    // Schema.org microdata
    if (!product.name) {
      const nameEl = document.querySelector('[itemprop="name"]') ||
                     document.querySelector('[itemprop="name"] span');
      if (nameEl) product.name = nameEl.textContent.trim();
    }

    if (!product.price) {
      const priceEl = document.querySelector('[itemprop="price"]');
      if (priceEl) {
        product.price = parsePrice(priceEl.textContent) ||
                        parseFloat(priceEl.getAttribute('content'));
      }
    }

    // Common title selectors
    if (!product.name) {
      const titleSelectors = [
        'h1.product-title',
        'h1.product-name',
        '.product-title h1',
        '#product-title',
        '.product-name',
        'h1'
      ];
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent.trim().length > 2) {
          product.name = el.textContent.trim();
          break;
        }
      }
    }

    // Common price selectors
    if (!product.price) {
      const priceSelectors = [
        '.price .amount',
        '.price-amount',
        '.product-price',
        '.sale-price',
        '.current-price',
        '.price',
        '[data-price]',
        '[data-product-price]'
      ];
      for (const sel of priceSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const price = parsePrice(el.textContent);
          if (price) {
            product.price = price;
            break;
          }
        }
      }
    }

    // Common image selectors
    if (!product.imageUrl) {
      const imgSelectors = [
        '[itemprop="image"]',
        '.product-image img',
        '.main-image img',
        '#main-image img',
        '.gallery-image img',
        'img.product-image',
        'picture img'
      ];
      for (const sel of imgSelectors) {
        const el = document.querySelector(sel);
        if (el && el.src && !el.src.includes('data:image')) {
          product.imageUrl = el.src;
          break;
        }
      }
    }

    return product;
  }

  // ============================================
  // SITE-SPECIFIC EXTRACTORS
  // ============================================

  // Amazon
  function extractAmazon() {
    const product = {
      url: window.location.href,
      store: 'AMAZON',
      name: null,
      price: null,
      imageUrl: null,
      available: true
    };

    // Title
    const titleEl = document.querySelector('#productTitle') ||
                    document.querySelector('#title span') ||
                    document.querySelector('h1.a-size-large');
    if (titleEl) product.name = titleEl.textContent.trim();

    // Price - Amazon has many variations
    const priceSelectors = [
      '.a-price .a-offscreen',
      '.priceToPay .a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
      '.reinventPricePriceToPayMargin .a-price .a-offscreen'
    ];
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        product.price = parsePrice(el.textContent);
        if (product.price) break;
      }
    }

    // Image
    const imgEl = document.querySelector('#landingImage') ||
                  document.querySelector('#imgBlkFront') ||
                  document.querySelector('.main-image');
    if (imgEl) {
      product.imageUrl = imgEl.src || imgEl.dataset.oldHires;
    }

    return product;
  }

  // Best Buy - updated for current layout
  function extractBestBuy() {
    const product = {
      url: window.location.href,
      store: 'BESTBUY',
      name: null,
      price: null,
      imageUrl: null,
      available: true
    };

    // Title - updated selectors
    const nameEl = document.querySelector('h1.sku-title') ||
                   document.querySelector('[data-testid="product-title"]') ||
                   document.querySelector('.sku-title');
    if (nameEl) product.name = nameEl.textContent.trim();

    // Price - updated for current Best Buy layout
    // Best Buy often shows price in accessibility span
    let priceEl = document.querySelector('.priceView-customer-price .sr-only') ||
                  document.querySelector('[data-testid="price-block-customer-price"]') ||
                  document.querySelector('[data-testid="customer-price"] .sr-only');

    if (priceEl) {
      product.price = parsePrice(priceEl.textContent);
    }

    if (!product.price) {
      // Try the visible price element
      priceEl = document.querySelector('.priceView-customer-price span[aria-hidden]') ||
                document.querySelector('[data-testid="customer-price"]');
      if (priceEl) product.price = parsePrice(priceEl.textContent);
    }

    if (!product.price) {
      // Fallback to itemprop
      priceEl = document.querySelector('[itemprop="price"]');
      if (priceEl) {
        product.price = parsePrice(priceEl.textContent) ||
                        parseFloat(priceEl.getAttribute('content') || '0');
      }
    }

    // Image
    const imgEl = document.querySelector('.primary-image') ||
                  document.querySelector('[data-testid="primary-image"] img') ||
                  document.querySelector('.gallery-image img');
    if (imgEl) product.imageUrl = imgEl.src;

    return product;
  }

  // eBay - fixed image selector
  function extractEbay() {
    const product = {
      url: window.location.href,
      store: 'EBAY',
      name: null,
      price: null,
      imageUrl: null,
      available: true
    };

    // Title
    const nameEl = document.querySelector('.x-item-title__mainTitle') ||
                   document.querySelector('h1.it-ttl') ||
                   document.querySelector('[itemprop="name"]');
    if (nameEl) product.name = nameEl.textContent.trim();

    // Price
    const priceEl = document.querySelector('.x-price-primary .ux-textspans') ||
                    document.querySelector('[itemprop="price"]') ||
                    document.querySelector('.x-price-primary');
    if (priceEl) {
      product.price = parsePrice(priceEl.textContent);
    }

    // Fallback for price
    if (!product.price) {
      const priceMeta = document.querySelector('[itemprop="price"][content]');
      if (priceMeta) product.price = parseFloat(priceMeta.getAttribute('content'));
    }

    // Image - fixed to get the main product image
    const imgEl = document.querySelector('#icImg') ||
                  document.querySelector('.ux-image-carousel img') ||
                  document.querySelector('[itemprop="image"]');
    if (imgEl) product.imageUrl = imgEl.src;

    return product;
  }

  // Walmart
  function extractWalmart() {
    const product = {
      url: window.location.href,
      store: 'WALMART',
      name: null,
      price: null,
      imageUrl: null,
      available: true
    };

    const nameEl = document.querySelector('[data-automation-id="product-title"]') ||
                   document.querySelector('h1');
    if (nameEl) product.name = nameEl.textContent.trim();

    const priceEl = document.querySelector('[data-automation-id="current-price"]');
    if (priceEl) product.price = parsePrice(priceEl.textContent);

    const imgEl = document.querySelector('[data-automation-id="product-image"] img') ||
                  document.querySelector('main img');
    if (imgEl) product.imageUrl = imgEl.src;

    return product;
  }

  // Target
  function extractTarget() {
    const product = {
      url: window.location.href,
      store: 'TARGET',
      name: null,
      price: null,
      imageUrl: null,
      available: true
    };

    // Target uses React, try data-testid selectors
    const nameEl = document.querySelector('[data-test="product-title"]') ||
                   document.querySelector('h1');
    if (nameEl) product.name = nameEl.textContent.trim();

    const priceEl = document.querySelector('[data-test="product-price"]');
    if (priceEl) product.price = parsePrice(priceEl.textContent);

    const imgEl = document.querySelector('[data-test="product-image"] img') ||
                  document.querySelector('main img');
    if (imgEl) product.imageUrl = imgEl.src;

    return product;
  }

  // Costco
  function extractCostco() {
    const product = {
      url: window.location.href,
      store: 'COSTCO',
      name: null,
      price: null,
      imageUrl: null,
      available: true
    };

    const nameEl = document.querySelector('[itemprop="name"]') ||
                   document.querySelector('h1');
    if (nameEl) product.name = nameEl.textContent.trim();

    const priceEl = document.querySelector('[itemprop="price"]');
    if (priceEl) product.price = parsePrice(priceEl.textContent);

    const imgEl = document.querySelector('[itemprop="image"]');
    if (imgEl) product.imageUrl = imgEl.src;

    return product;
  }

  // GameStop
  function extractGameStop() {
    const product = {
      url: window.location.href,
      store: 'GAMESTOP',
      name: null,
      price: null,
      imageUrl: null,
      available: true
    };

    const nameEl = document.querySelector('h1') ||
                   document.querySelector('.product-title');
    if (nameEl) product.name = nameEl.textContent.trim();

    const priceEl = document.querySelector('.price');
    if (priceEl) product.price = parsePrice(priceEl.textContent);

    const imgEl = document.querySelector('.product-IMAGE img') ||
                  document.querySelector('main img');
    if (imgEl) product.imageUrl = imgEl.src;

    return product;
  }

  // Newegg
  function extractNewegg() {
    const product = {
      url: window.location.href,
      store: 'NEWEGG',
      name: null,
      price: null,
      imageUrl: null,
      available: true
    };

    const nameEl = document.querySelector('.product-title') ||
                   document.querySelector('h1');
    if (nameEl) product.name = nameEl.textContent.trim();

    const priceEl = document.querySelector('.price-current') ||
                    document.querySelector('[itemprop="price"]');
    if (priceEl) product.price = parsePrice(priceEl.textContent);

    const imgEl = document.querySelector('.product-view-img') ||
                  document.querySelector('[itemprop="image"]');
    if (imgEl) product.imageUrl = imgEl.src;

    return product;
  }

  // B&H Photo
  function extractBH() {
    const product = {
      url: window.location.href,
      store: 'BH',
      name: null,
      price: null,
      imageUrl: null,
      available: true
    };

    const nameEl = document.querySelector('h1[data-selenium="product-title"]') ||
                   document.querySelector('h1');
    if (nameEl) product.name = nameEl.textContent.trim();

    const priceEl = document.querySelector('[data-selenium="product-price"]');
    if (priceEl) product.price = parsePrice(priceEl.textContent);

    const imgEl = document.querySelector('.product-image img');
    if (imgEl) product.imageUrl = imgEl.src;

    return product;
  }

  // Log initialization
  console.log('PriceHawk: Content script loaded for', window.location.hostname);
})();
