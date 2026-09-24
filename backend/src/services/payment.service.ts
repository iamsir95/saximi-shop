import crypto from 'crypto';

export type PaymentMethod = 'ZALOPAY' | 'VIETQR' | 'COD';

export interface SepayWebhookPayload {
  id?: string | number;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string;
  code?: string;
  content?: string;
  transferType?: string;
  transferAmount?: string | number;
  accumulated?: string | number;
  referenceCode?: string;
  description?: string;
}

export interface SepayPaymentMatch {
  orderId: number;
  amount: number;
  referenceCode?: string;
  transferType?: string;
  rawContent: string;
}

export interface PaymentRuntimeConfig {
  publicSiteUrl?: string;
  vietQrBankId?: string;
  vietQrAccountNo?: string;
  vietQrAccountName?: string;
  sepayWebhookEnabled?: boolean;
  sepayWebhookApiKey?: string;
}

export class PaymentService {
  private static ZALOPAY_APP_ID = process.env.ZALOPAY_APP_ID || '2553';
  private static ZALOPAY_KEY1 = process.env.ZALOPAY_KEY1 || 'sdngBkc91uhJgFvoSYguhldn11';

  private static getConfig(config: PaymentRuntimeConfig = {}) {
    return {
      bankId: config.vietQrBankId || process.env.VIETQR_BANK_ID || process.env.BANK_ID || 'MB',
      accountNo: config.vietQrAccountNo || process.env.VIETQR_ACCOUNT_NO || process.env.BANK_ACCOUNT_NO || '0908889999',
      accountName: config.vietQrAccountName || process.env.VIETQR_ACCOUNT_NAME || process.env.BANK_ACCOUNT_NAME || 'SAXIMI SHOP',
      publicSiteUrl: config.publicSiteUrl || process.env.PUBLIC_SITE_URL || 'https://hpn.saximi.com.vn',
      sepayWebhookEnabled: config.sepayWebhookEnabled ?? true,
      sepayWebhookApiKey: config.sepayWebhookApiKey || process.env.SEPAY_WEBHOOK_API_KEY || process.env.SEPAY_WEBHOOK_SECRET || '',
    };
  }

  public static getBankInfo(config?: PaymentRuntimeConfig) {
    const runtimeConfig = this.getConfig(config);
    return {
      bankId: runtimeConfig.bankId,
      bankName: runtimeConfig.bankId === 'MB' ? 'MBBank' : runtimeConfig.bankId,
      accountNo: runtimeConfig.accountNo,
      accountName: runtimeConfig.accountName,
    };
  }

  public static getTransferContent(orderId: number): string {
    return `SAXIMI ORDER ${orderId}`;
  }

  /**
   * Generate Dynamic VietQR Image URL (Napas247 Standard)
   */
  public static generateVietQRUrl(orderId: number, amount: number, config?: PaymentRuntimeConfig): string {
    const runtimeConfig = this.getConfig(config);
    const addInfo = this.getTransferContent(orderId);
    const encodedInfo = encodeURIComponent(addInfo);
    const encodedName = encodeURIComponent(runtimeConfig.accountName);
    return `https://img.vietqr.io/image/${runtimeConfig.bankId}-${runtimeConfig.accountNo}-compact2.png?amount=${amount}&addInfo=${encodedInfo}&accountName=${encodedName}`;
  }

  public static getSepayWebhookUrl(config?: PaymentRuntimeConfig): string {
    const siteUrl = this.getConfig(config).publicSiteUrl.replace(/\/+$/, '');
    return `${siteUrl}/api/payment/sepay/webhook`;
  }

  public static isSepayWebhookConfigured(config?: PaymentRuntimeConfig): boolean {
    const runtimeConfig = this.getConfig(config);
    return runtimeConfig.sepayWebhookEnabled && Boolean(runtimeConfig.sepayWebhookApiKey);
  }

  public static verifySepayWebhookAuth(authHeader?: string | string[], apiKeyHeader?: string | string[], config?: PaymentRuntimeConfig): boolean {
    const runtimeConfig = this.getConfig(config);
    if (!runtimeConfig.sepayWebhookEnabled || !runtimeConfig.sepayWebhookApiKey) return false;

    const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const apiKeyValue = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    const received = String(apiKeyValue || headerValue || '')
      .replace(/^(Apikey|Bearer)\s+/i, '')
      .trim();

    if (!received) return false;

    const expectedBuffer = Buffer.from(runtimeConfig.sepayWebhookApiKey);
    const receivedBuffer = Buffer.from(received);
    return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  private static parseMoney(value?: string | number): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    return Number(String(value || '').replace(/[^\d.-]/g, '')) || 0;
  }

  public static parseSepayWebhookPayload(payload: SepayWebhookPayload): SepayPaymentMatch | null {
    const rawContent = [payload.code, payload.content, payload.description]
      .filter(Boolean)
      .join(' ')
      .trim();

    const orderMatch =
      rawContent.match(/\b(?:SAXIMI|ZAUI)\s*(?:ORDER|DH|DONHANG)?\s*#?(\d+)\b/i) ||
      rawContent.match(/\b(?:ORDER|DH)\s*#?(\d+)\b/i);

    if (!orderMatch) return null;

    return {
      orderId: Number(orderMatch[1]),
      amount: this.parseMoney(payload.transferAmount),
      referenceCode: payload.referenceCode || String(payload.id || ''),
      transferType: payload.transferType,
      rawContent,
    };
  }

  /**
   * Create ZaloPay Payment Order Token
   */
  public static createZaloPayToken(orderId: number, amount: number): { zpTransToken: string; orderUrl: string } {
    const appTransId = `${new Date().getFullYear() % 100}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}_${orderId}`;
    
    console.log(`💳 [ZaloPay SDK] Creating ZaloPay Order Token for Order #${orderId} Amount: ${amount} VND`);

    return {
      zpTransToken: `zalo_token_${appTransId}_demo`,
      orderUrl: `https://qcgateway.zalopay.vn/openinapp?order=zalo_token_${appTransId}_demo`,
    };
  }
}
