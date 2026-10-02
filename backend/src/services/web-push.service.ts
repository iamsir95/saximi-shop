import webpush, { PushSubscription } from 'web-push';
import { Database, WebPushSubscriptionRecord } from '../db.js';
import { Logger } from './logger.service.js';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

export class WebPushService {
  private static configured = false;

  private static configure() {
    if (this.configured) return;

    const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
    const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      Logger.warn('Web push is disabled because WEB_PUSH_PUBLIC_KEY or WEB_PUSH_PRIVATE_KEY is missing.');
      return;
    }

    webpush.setVapidDetails(
      process.env.WEB_PUSH_SUBJECT || 'mailto:admin@saximi.com.vn',
      publicKey,
      privateKey
    );
    this.configured = true;
  }

  public static isEnabled() {
    return Boolean(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY);
  }

  private static async send(subscription: WebPushSubscriptionRecord, payload: PushPayload) {
    this.configure();
    if (!this.configured) {
      Logger.warn('Skipped web push send because VAPID is not configured.');
      return false;
    }

    try {
      await webpush.sendNotification(subscription.subscription as PushSubscription, JSON.stringify(payload));
      return true;
    } catch (error: any) {
      const statusCode = Number(error?.statusCode || error?.status);
      if ([404, 410].includes(statusCode)) {
        Database.deleteWebPushSubscription(subscription.endpoint);
      }
      Logger.error(`Failed to send web push to ${subscription.endpoint}`, error);
      return false;
    }
  }

  public static async sendToAdmins(payload: PushPayload) {
    const subscriptions = Database.getWebPushSubscriptions().filter((item) => item.audience === 'ADMIN');
    if (subscriptions.length === 0) {
      Logger.warn(`Skipped admin web push "${payload.title}" because no admin devices are subscribed.`);
      return { sent: 0, total: 0 };
    }

    const results = await Promise.all(subscriptions.map((subscription) => this.send(subscription, payload)));
    return {
      sent: results.filter(Boolean).length,
      total: subscriptions.length,
    };
  }

  public static async notifyAdminTest(message?: string) {
    return this.sendToAdmins({
      title: 'Kiểm tra thông báo Saximi',
      body: message || 'Backend đã gửi thành công thông báo đẩy đến thiết bị admin.',
      url: '/admin',
      icon: '/icon.png',
      badge: '/icon.png',
    });
  }

  public static async notifyAdminOtp(phone: string, otp: string) {
    return this.sendToAdmins({
      title: 'OTP đăng nhập mới',
      body: `Khách ${phone} vừa yêu cầu OTP. Mã: ${otp}`,
      url: '/admin?tab=otp-outbox',
      icon: '/icon.png',
      badge: '/icon.png',
    });
  }

  public static async notifyAdminLogin(username: string, ip?: string) {
    return this.sendToAdmins({
      title: 'Admin vừa đăng nhập',
      body: `${username || 'Admin'} đã đăng nhập${ip ? ` từ ${ip}` : ''}.`,
      url: '/admin',
      icon: '/icon.png',
      badge: '/icon.png',
    });
  }

  public static async notifyAdminNewOrder(order: { id: number; total: number; delivery?: { name?: string; phone?: string } }) {
    const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total || 0);
    const customer = order.delivery?.name || order.delivery?.phone || 'Khách hàng';
    return this.sendToAdmins({
      title: `Đơn hàng mới #${order.id}`,
      body: `${customer} vừa đặt đơn ${amount}.`,
      url: '/admin?tab=orders',
      icon: '/icon.png',
      badge: '/icon.png',
    });
  }

  public static async notifyAdminFormSubmission(submission: { id: number; formTitle: string; customerName?: string; customerPhone?: string }) {
    const customer = submission.customerName || submission.customerPhone || 'Khách hàng';
    return this.sendToAdmins({
      title: 'Có phản hồi form mới',
      body: `${customer} vừa gửi "${submission.formTitle}".`,
      url: '/admin?tab=forms',
      icon: '/icon.png',
      badge: '/icon.png',
    });
  }
}
