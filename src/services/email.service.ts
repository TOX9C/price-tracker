import { Resend } from 'resend';

// Initialize Resend client (lazy initialization)
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface PriceDropEmailData {
  userEmail: string;
  userName?: string;
  itemName: string;
  storeName: string;
  oldPrice: number;
  newPrice: number;
  percentDrop: number;
  itemUrl?: string;
}

export interface WelcomeEmailData {
  userEmail: string;
  userName?: string;
}

/**
 * Send price drop notification email
 */
export async function sendPriceDropEmail(data: PriceDropEmailData): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.log('[Email] Resend not configured, skipping email');
    return false;
  }

  const savings = data.oldPrice - data.newPrice;

  try {
    const result = await client.emails.send({
      from: process.env.EMAIL_FROM || 'PriceHawk <notifications@pricehawk.app>',
      to: data.userEmail,
      subject: `Price Drop Alert: ${data.itemName} is now $${data.newPrice.toFixed(2)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Price Drop Alert</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e7e5e4;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
                🔔 Price Drop Alert!
              </h1>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #1c1917; font-size: 16px; margin: 0 0 20px;">
                ${data.userName ? `Hi ${data.userName},` : 'Hello,'}
              </p>

              <p style="color: #57534e; font-size: 16px; margin: 0 0 25px;">
                Great news! The price for <strong style="color: #1c1917;">${data.itemName}</strong> has dropped at ${data.storeName}.
              </p>

              <!-- Price Card -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px;">
                <div style="color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  NEW PRICE
                </div>
                <div style="color: #d97706; font-size: 42px; font-weight: bold; margin-bottom: 8px;">
                  $${data.newPrice.toFixed(2)}
                </div>
                <div style="color: #78716c; font-size: 14px;">
                  <span style="text-decoration: line-through;">$${data.oldPrice.toFixed(2)}</span>
                  <span style="color: #22c55e; font-weight: 600; margin-left: 10px;">
                    Save $${savings.toFixed(2)} (${data.percentDrop.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <!-- CTA Button -->
              ${data.itemUrl ? `
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="${data.itemUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  View Product →
                </a>
              </div>
              ` : ''}

              <p style="color: #78716c; font-size: 14px; margin: 0;">
                We'll keep tracking this item and let you know when the price drops again.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f5f5f4; padding: 20px; text-align: center; border-top: 1px solid #e7e5e4;">
              <p style="color: #78716c; font-size: 12px; margin: 0;">
                You're receiving this email because you're tracking prices with PriceHawk.
              </p>
              <p style="color: #a8a29e; font-size: 12px; margin: 10px 0 0;">
                <a href="${process.env.FRONTEND_URL || 'https://pricehawk.app'}/settings" style="color: #78716c; text-decoration: underline;">
                  Manage notification preferences
                </a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Sent price drop email to ${data.userEmail}, ID: ${result.data?.id}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send price drop email:', error);
    return false;
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.log('[Email] Resend not configured, skipping welcome email');
    return false;
  }

  try {
    await client.emails.send({
      from: process.env.EMAIL_FROM || 'PriceHawk <notifications@pricehawk.app>',
      to: data.userEmail,
      subject: 'Welcome to PriceHawk! Start saving money today',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to PriceHawk</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e7e5e4;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">💰</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Welcome to PriceHawk!
              </h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px; text-align: center;">
              <p style="color: #1c1917; font-size: 18px; margin: 0 0 25px;">
                ${data.userName ? `Hi ${data.userName}!` : 'Hello!'}
              </p>

              <p style="color: #57534e; font-size: 16px; margin: 0 0 30px;">
                You're all set up! Now you can start tracking prices and be the first to know when they drop.
              </p>

              <!-- Features -->
              <div style="text-align: left; margin-bottom: 30px;">
                <div style="margin-bottom: 15px; padding: 15px; background-color: #f5f5f4; border-radius: 8px;">
                  <span style="font-size: 20px; margin-right: 10px;">📦</span>
                  <span style="color: #1c1917; font-weight: 600;">Add items</span>
                  <span style="color: #57534e;"> - Paste any product URL to start tracking</span>
                </div>
                <div style="margin-bottom: 15px; padding: 15px; background-color: #f5f5f4; border-radius: 8px;">
                  <span style="font-size: 20px; margin-right: 10px;">🔔</span>
                  <span style="color: #1c1917; font-weight: 600;">Get notified</span>
                  <span style="color: #57534e;"> - Receive alerts when prices drop</span>
                </div>
                <div style="padding: 15px; background-color: #f5f5f4; border-radius: 8px;">
                  <span style="font-size: 20px; margin-right: 10px;">📊</span>
                  <span style="color: #1c1917; font-weight: 600;">Compare prices</span>
                  <span style="color: #57534e;"> - Track across multiple stores</span>
                </div>
              </div>

              <!-- CTA -->
              <a href="${process.env.FRONTEND_URL || 'https://pricehawk.app'}/dashboard" style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Start Tracking →
              </a>
            </div>

            <!-- Footer -->
            <div style="background-color: #f5f5f4; padding: 20px; text-align: center; border-top: 1px solid #e7e5e4;">
              <p style="color: #78716c; font-size: 12px; margin: 0;">
                Happy saving!<br>The PriceHawk Team
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Sent welcome email to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
