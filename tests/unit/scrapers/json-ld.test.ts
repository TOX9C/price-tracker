import { extractJsonLd } from '../../../src/scrapers/extractors/json-ld.js';

describe('JSON-LD Extractor', () => {
  it('should extract price from valid JSON-LD', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Test Product",
            "offers": {
              "@type": "Offer",
              "price": "99.99",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            }
          }
          </script>
        </head>
        <body></body>
      </html>
    `;

    const result = extractJsonLd(html);

    expect(result).not.toBeNull();
    expect(result!.price).toBe(99.99);
    expect(result!.currency).toBe('USD');
    expect(result!.name).toBe('Test Product');
    expect(result!.availability).toBe('in_stock');
  });

  it('should return null when no JSON-LD found', () => {
    const html = '<html><body>No JSON-LD here</body></html>';
    const result = extractJsonLd(html);

    expect(result).toBeNull();
  });

  it('should handle multiple JSON-LD scripts and find Product', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {"@type": "Organization", "name": "Test Store"}
          </script>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Found Product",
            "offers": {
              "@type": "Offer",
              "price": "49.99",
              "priceCurrency": "USD"
            }
          }
          </script>
        </head>
      </html>
    `;

    const result = extractJsonLd(html);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Found Product');
    expect(result!.price).toBe(49.99);
  });

  it('should parse European price format', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Product",
        "offers": {
          "@type": "Offer",
          "price": "99,99",
          "priceCurrency": "EUR"
        }
      }
      </script>
    `;

    const result = extractJsonLd(html);

    expect(result).not.toBeNull();
    expect(result!.price).toBe(99.99);
  });

  it('should handle malformed JSON-LD', () => {
    const html = `
      <script type="application/ld+json">
      { invalid json here
      </script>
    `;

    const result = extractJsonLd(html);
    expect(result).toBeNull();
  });

  it('should handle empty price', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Product",
        "offers": { "@type": "Offer", "price": "" }
      }
      </script>
    `;

    const result = extractJsonLd(html);
    expect(result).not.toBeNull();
    expect(result!.price).toBeNull();
  });

  it('should handle outOfStock availability', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Product",
        "offers": {
          "@type": "Offer",
          "price": "99.99",
          "availability": "https://schema.org/OutOfStock"
        }
      }
      </script>
    `;

    const result = extractJsonLd(html);
    expect(result!.availability).toBe('out_of_stock');
  });
});
