import { extractWithSelectors, getSupportedSites } from '../../../src/scrapers/extractors/selectors.js';

describe('Site Selectors Extractor', () => {
  describe('Amazon', () => {
    it('should extract price from Amazon HTML', () => {
      const html = `
        <div class="a-price">
          <span class="a-offscreen">$1,299.99</span>
        </div>
      `;
      const url = 'https://www.amazon.com/dp/B0test';

      const result = extractWithSelectors(html, url);

      expect(result).not.toBeNull();
      expect(result!.price).toBe(1299.99);
      expect(result!.confidence).toBe('medium');
    });
  });

  describe('Best Buy', () => {
    it('should extract price from Best Buy HTML', () => {
      const html = `
        <div data-testid="customer-price">
          <span>$599.99</span>
        </div>
      `;
      const url = 'https://www.bestbuy.com/site/test/12345';

      const result = extractWithSelectors(html, url);

      expect(result).not.toBeNull();
      expect(result!.price).toBe(599.99);
    });
  });

  describe('Newegg', () => {
    it('should extract price from Newegg HTML', () => {
      const html = `
        <li class="price-current">
          <strong>$ 449.</strong><sup>99</sup>
        </li>
      `;
      const url = 'https://www.newegg.com/p/12345';

      const result = extractWithSelectors(html, url);

      expect(result).not.toBeNull();
      expect(result!.price).toBe(449.99);
    });
  });

  describe('Walmart', () => {
    it('should extract price from Walmart HTML', () => {
      const html = `
        <div data-testid="price-wrap">
          <span data-testid="price">$29.98</span>
        </div>
      `;
      const url = 'https://www.walmart.com/ip/test/12345';

      const result = extractWithSelectors(html, url);

      expect(result).not.toBeNull();
      expect(result!.price).toBe(29.98);
    });
  });

  describe('Unsupported sites', () => {
    it('should return null for unsupported store', () => {
      const html = '<div>$99.99</div>';
      const url = 'https://www.unsupported-store.com/product/123';

      const result = extractWithSelectors(html, url);

      expect(result).toBeNull();
    });
  });

  describe('getSupportedSites', () => {
    it('should return list of supported domains', () => {
      const sites = getSupportedSites();

      expect(sites.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid URL gracefully', () => {
      const html = '<div class="a-price"><span>$99.99</span></div>';
      const result = extractWithSelectors(html, 'not-a-valid-url');

      expect(result).toBeNull();
    });

    it('should handle empty HTML', () => {
      const result = extractWithSelectors('', 'https://amazon.com/dp/test');
      expect(result).toBeNull();
    });
  });
});
