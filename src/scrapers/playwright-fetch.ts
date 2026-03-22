import { chromium, Browser } from 'playwright';
import { FetchResult } from './fetch.js';

let browser: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browser) return browser;

  if (browserPromise) return browserPromise;

  browserPromise = chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  browser = await browserPromise;
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    browserPromise = null;
  }
}

export async function fetchWithPlaywright(
  url: string,
  options: { timeout?: number } = {}
): Promise<FetchResult> {
  const timeout = options.timeout ?? 30000;
  const browser = await getBrowser();

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    let statusCode = 200;

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    if (response) {
      statusCode = response.status();
    }

    // Wait for price elements to load
    await page.waitForTimeout(2000);

    // Scroll to trigger lazy-loaded content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(1000);

    // Check for CAPTCHA
    const captchaDetected = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('captcha') ||
             text.includes('robot') ||
             text.includes('verify you are human') ||
             document.querySelector('iframe[src*="captcha"]') !== null ||
             document.querySelector('#captchachallenge') !== null;
    });

    let html = await page.content();

    if (captchaDetected) {
      html = `<!-- CAPTCHA_DETECTED -->\n${html}`;
    }

    const headers: Record<string, string> = {};
    if (response) {
      const responseHeaders = response.headers();
      Object.entries(responseHeaders).forEach(([key, value]) => {
        headers[key] = value;
      });
    }

    return { html, statusCode, headers };
  } finally {
    await page.close();
    await context.close();
  }
}

export async function isPlaywrightAvailable(): Promise<boolean> {
  try {
    await getBrowser();
    return true;
  } catch {
    return false;
  }
}
