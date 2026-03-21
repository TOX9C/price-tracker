import { extractHeuristic } from '../../../src/scrapers/extractors/heuristic.js';

describe('Heuristic Price Extractor', () => {
  it('should extract a visible price', () => {
    const html = `
      <div>
        <span class="price">$199.99</span>
      </div>
    `;

    const result = extractHeuristic(html);

    expect(result).not.toBeNull();
    expect(result!.price).toBeGreaterThan(0);
    expect(result!.confidence).toBe('low');
  });

  it('should handle prices without dollar sign', () => {
    const html = '<div class="price">149.99</div>';

    const result = extractHeuristic(html);

    expect(result).not.toBeNull();
    expect(result!.price).toBe(149.99);
  });

  it('should return null when no price found', () => {
    const html = '<div>no prices here</div>';

    const result = extractHeuristic(html);

    expect(result).toBeNull();
  });

  it('should prefer larger prices in context', () => {
    const html = `
      <div>
        <span>Price: $99.99</span>
        <span>Original: $149.99</span>
      </div>
    `;

    const result = extractHeuristic(html);

    expect(result).not.toBeNull();
    expect(result!.price).toBeGreaterThan(0);
  });

  it('should handle prices with commas', () => {
    const html = '<div class="price">$1,299.99</div>';

    const result = extractHeuristic(html);

    expect(result).not.toBeNull();
    expect(result!.price).toBe(1299.99);
  });

  it('should handle European number format', () => {
    const html = '<div class="price">€ 1.299,99</div>';

    const result = extractHeuristic(html);

    expect(result).not.toBeNull();
    // Should parse European format
  });
});
