import type { Invoice, ShareOptions } from "../types";

/**
 * Generates a shareable link for an invoice
 */
export async function generateShareableLink(
  invoice: Invoice,
  options?: ShareOptions
): Promise<string> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Generate a unique public ID if not already present
  const publicId = invoice.publicId || generatePublicId();
  
  // Build query parameters based on options
  const params = new URLSearchParams();
  
  if (options?.expiresIn && options.expiresIn !== 'never') {
    const expiryDate = calculateExpiryDate(options.expiresIn);
    params.set('expires', expiryDate.toISOString());
  }
  
  if (options?.requireEmail) {
    params.set('verify', 'email');
  }
  
  if (options?.allowDownload === false) {
    params.set('download', 'false');
  }
  
  // Construct the shareable URL
  const queryString = params.toString();
  const url = `${baseUrl}/shared/invoice/${publicId}${queryString ? `?${queryString}` : ''}`;
  
  return url;
}

/**
 * Generates a short shareable link using a URL shortener service
 */
export async function generateShortLink(longUrl: string): Promise<string> {
  // This would integrate with a URL shortening service
  // For now, return the original URL
  return longUrl;
}

/**
 * Validates if a shareable link is still valid
 */
export function isLinkValid(expiryDate?: string): boolean {
  if (!expiryDate) return true;
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  
  return expiry > now;
}

/**
 * Generates a unique public ID for sharing
 */
function generatePublicId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `inv_${timestamp}_${randomStr}`;
}

/**
 * Calculates expiry date based on duration
 */
function calculateExpiryDate(duration: '24h' | '7d' | '30d'): Date {
  const now = new Date();
  
  switch (duration) {
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Generates a QR code for the invoice link
 */
export async function generateQRCode(url: string): Promise<string> {
  // This would integrate with a QR code library
  // For now, return a placeholder
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">QR Code</text></svg>`;
}