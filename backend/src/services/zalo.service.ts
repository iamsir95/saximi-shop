import crypto from 'crypto';

/**
 * Zalo OpenAPI Integration Service
 * Decodes Phone Token & Location Token via HMAC-SHA256 & Zalo Server OpenAPI
 */
export class ZaloService {
  private static APP_SECRET = process.env.ZALO_APP_SECRET || '';

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

    if (this.APP_SECRET) {
      const response = await fetch('https://graph.zalo.me/v2.0/me/info', {
        method: 'GET',
        headers: {
          access_token: token,
          secret_key: this.APP_SECRET,
        },
      });
      const data = await response.json().catch(() => ({} as any));

      if (!response.ok || data.error || data.error_name) {
        throw new Error(data.message || data.error_message || data.error_name || 'Không giải mã được số điện thoại Zalo');
      }

      const phone =
        data?.data?.number ||
        data?.data?.phone ||
        data?.phone ||
        data?.user_phone ||
        data?.number ||
        '';
      const normalizedPhone = String(phone).replace(/\D/g, '').replace(/^84(?=\d{8,10}$)/, '0');
      if (!/^0\d{9}$/.test(normalizedPhone)) {
        throw new Error('Zalo không trả về số điện thoại hợp lệ');
      }

      return {
        phone: normalizedPhone,
        user: data?.data?.user || data?.data || data,
      };
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Server chưa cấu hình ZALO_APP_SECRET để giải mã số điện thoại');
    }

    // Development fallback for local simulator only.
    return {
      phone: '0912345678',
      user: {
        id: 'zalo-user-1001',
        name: 'Nguyễn Văn A',
      },
    };
  }
}
