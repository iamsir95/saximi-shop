import crypto from 'crypto';
import { Logger } from './logger.service.js';

type OtpDeliveryChannel = 'zalo-oa-manual' | 'development';
type OtpDeliveryStatus = 'pending_manual' | 'sent';
type OtpOutboxStatus = 'pending' | 'sent' | 'expired';

interface OtpRecord {
  phone: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

export interface OtpOutboxItem {
  id: string;
  phone: string;
  message: string;
  zaloOaUrl: string;
  status: OtpOutboxStatus;
  createdAt: string;
  expiresAt: string;
  sentAt?: string;
}

interface RequestOtpResult {
  phone: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
  delivery: {
    channel: OtpDeliveryChannel;
    status: OtpDeliveryStatus;
    message: string;
    zaloOaUrl?: string;
    outboxId?: string;
  };
  demoOtp?: string;
}

export class OtpError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

export class OtpService {
  private static records = new Map<string, OtpRecord>();
  private static sendHistory = new Map<string, number[]>();
  private static outbox = new Map<string, OtpOutboxItem>();

  private static ttlSeconds = Number(process.env.OTP_TTL_SECONDS || 300);
  private static resendCooldownSeconds = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
  private static maxSendsPerHour = Number(process.env.OTP_MAX_SENDS_PER_HOUR || 5);
  private static maxVerifyAttempts = Number(process.env.OTP_MAX_VERIFY_ATTEMPTS || 5);
  private static secret = process.env.OTP_SECRET || process.env.JWT_SECRET || 'saximi-otp-secret';
  private static zaloOaUrl = process.env.ZALO_OA_DASHBOARD_URL || 'https://oa.zalo.me/manage/dashboard#';

  private static now() {
    return Date.now();
  }

  private static isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  private static hashOtp(phone: string, otp: string) {
    return crypto
      .createHmac('sha256', this.secret)
      .update(`${phone}:${otp}`)
      .digest('hex');
  }

  private static generateOtp() {
    if (!this.isProduction()) return '123456';
    return String(crypto.randomInt(100000, 1000000));
  }

  private static cleanup(phone?: string) {
    const now = this.now();

    if (phone) {
      const record = this.records.get(phone);
      if (record && record.expiresAt <= now) this.records.delete(phone);
    } else {
      this.records.forEach((record, key) => {
        if (record.expiresAt <= now) this.records.delete(key);
      });
    }

    const oneHourAgo = now - 60 * 60 * 1000;
    const phones = phone ? [phone] : [...this.sendHistory.keys()];
    phones.forEach((item) => {
      const recentSends = (this.sendHistory.get(item) || []).filter((time) => time > oneHourAgo);
      this.sendHistory.set(item, recentSends);
    });

    this.outbox.forEach((item, id) => {
      if (new Date(item.expiresAt).getTime() <= now && item.status === 'pending') {
        this.outbox.set(id, { ...item, status: 'expired' });
      }
    });
  }

  private static registerSend(phone: string) {
    const history = this.sendHistory.get(phone) || [];
    history.push(this.now());
    this.sendHistory.set(phone, history);
  }

  private static assertCanSend(phone: string) {
    this.cleanup(phone);
    const existing = this.records.get(phone);
    const now = this.now();

    if (existing && now - existing.createdAt < this.resendCooldownSeconds * 1000) {
      const waitSeconds = Math.ceil((this.resendCooldownSeconds * 1000 - (now - existing.createdAt)) / 1000);
      throw new OtpError(`Vui lòng chờ ${waitSeconds} giây trước khi gửi lại OTP`, 429);
    }

    const recentSends = this.sendHistory.get(phone) || [];
    if (recentSends.length >= this.maxSendsPerHour) {
      throw new OtpError('Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau.', 429);
    }
  }

  private static createOutboxItem(phone: string, message: string, expiresAt: number): OtpOutboxItem {
    const item: OtpOutboxItem = {
      id: crypto.randomUUID(),
      phone,
      message,
      zaloOaUrl: this.zaloOaUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
    };
    this.outbox.set(item.id, item);
    return item;
  }

  public static requestOtp(phone: string): RequestOtpResult {
    this.assertCanSend(phone);

    const otp = this.generateOtp();
    const now = this.now();
    const expiresAt = now + this.ttlSeconds * 1000;
    this.records.set(phone, {
      phone,
      otpHash: this.hashOtp(phone, otp),
      expiresAt,
      attempts: 0,
      createdAt: now,
    });
    this.registerSend(phone);

    const message = `Mã OTP Saximi Shop của bạn là ${otp}. Mã có hiệu lực trong ${Math.round(this.ttlSeconds / 60)} phút. Không chia sẻ mã này cho bất kỳ ai.`;
    const outboxItem = this.createOutboxItem(phone, message, expiresAt);

    Logger.info(`🔐 [OTP] Generated for ${phone} and added to Zalo OA outbox`);
    return {
      phone,
      expiresInSeconds: this.ttlSeconds,
      resendAfterSeconds: this.resendCooldownSeconds,
      delivery: {
        channel: this.isProduction() ? 'zalo-oa-manual' : 'development',
        status: this.isProduction() ? 'pending_manual' : 'sent',
        message: this.isProduction()
          ? 'Mã OTP đã được tạo. Nhân viên sẽ gửi mã qua Zalo OA.'
          : 'Mã OTP đã được tạo.',
        zaloOaUrl: this.zaloOaUrl,
        outboxId: outboxItem.id,
      },
      demoOtp: this.isProduction() ? undefined : otp,
    };
  }

  public static verifyOtp(phone: string, otp: string) {
    this.cleanup(phone);
    const record = this.records.get(phone);
    if (!record) {
      throw new OtpError('Mã OTP đã hết hạn hoặc chưa được gửi');
    }

    if (record.attempts >= this.maxVerifyAttempts) {
      this.records.delete(phone);
      throw new OtpError('Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới.', 429);
    }

    const expected = Buffer.from(record.otpHash);
    const actual = Buffer.from(this.hashOtp(phone, otp));
    const matched = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

    if (!matched) {
      record.attempts += 1;
      const remainingAttempts = Math.max(0, this.maxVerifyAttempts - record.attempts);
      if (remainingAttempts === 0) {
        this.records.delete(phone);
        throw new OtpError('Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới.', 429);
      }
      throw new OtpError(`Mã OTP không đúng. Bạn còn ${remainingAttempts} lần thử.`);
    }

    this.records.delete(phone);
    return true;
  }

  public static getOutbox(): OtpOutboxItem[] {
    this.cleanup();
    return [...this.outbox.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public static markOutboxSent(id: string): OtpOutboxItem | null {
    this.cleanup();
    const item = this.outbox.get(id);
    if (!item) return null;
    const updated: OtpOutboxItem = {
      ...item,
      status: item.status === 'expired' ? 'expired' : 'sent',
      sentAt: item.status === 'expired' ? item.sentAt : new Date().toISOString(),
    };
    this.outbox.set(id, updated);
    return updated;
  }

  public static deleteOutboxItem(id: string): boolean {
    return this.outbox.delete(id);
  }
}
