import crypto from 'crypto';

/**
 * Zalo OpenAPI Integration Service
 * Decodes Phone Token & Location Token via HMAC-SHA256 & Zalo Server OpenAPI
 */
export class ZaloService {
  private static APP_SECRET = process.env.ZALO_APP_SECRET || 'zalo-app-secret-key-demo';

  /**
   * Verify HMAC Signature from Zalo Webhooks / Requests
   */
  public static verifySignature(dataStr: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', this.APP_SECRET);
    hmac.update(dataStr);
    const expectedSignature = hmac.digest('hex');
    return expectedSignature === signature;
  }

  /**
   * Decode Zalo Phone Token via Zalo OpenAPI
   * In Production: Calls https://graph.zalo.me/v2.0/me/info with secretkey & token
   */
  public static async decodePhoneToken(token: string): Promise<{ phone: string; user?: any }> {
    if (!token) {
      throw new Error('Token số điện thoại không hợp lệ');
    }

    console.log(`🔒 [Zalo OpenAPI] Decoding phone token: ${token.substring(0, 10)}...`);

    // Simulated decode output (Replace with axios/fetch to graph.zalo.me in Production)
    return {
      phone: '0912345678',
      user: {
        id: 'zalo-user-1001',
        name: 'Nguyễn Văn A',
      },
    };
  }
}
