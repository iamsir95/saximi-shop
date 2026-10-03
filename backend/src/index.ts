import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Database } from './db.js';
import { CacheService } from './services/cache.service.js';
import { ZaloService } from './services/zalo.service.js';
import { Logger } from './services/logger.service.js';
import { PaymentService, PaymentMethod } from './services/payment.service.js';
import { OtpError, OtpService } from './services/otp.service.js';
import { WebPushService } from './services/web-push.service.js';
import { mountPostRoutes } from './post-routes.js';
import { mountUploads } from './uploads.js';

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'zaui-market-secret-key-2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const publicApi = express.Router();
const DEFAULT_JWT_SECRET = 'zaui-market-secret-key-2026';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const adminLoginAttempts = new Map<string, { count: number; firstAttemptAt: number; blockedUntil?: number }>();

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error('JWT_SECRET must be set to a strong value in production.');
  }
  if (!process.env.ADMIN_PASSWORD || ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD must be changed in production.');
  }
}

function normalizePhone(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.replace(/^84(?=\d{8,10}$)/, '0');
}

function isValidVietnamPhone(phone: string) {
  return /^0\d{9}$/.test(phone);
}

function isValidLoginPin(pin: string) {
  return /^\d{4,6}$/.test(pin);
}

function createCustomerAuthResponse(user: ReturnType<typeof Database.upsertPhoneUser>, req: Request) {
  const session = Database.createAuthSession({
    role: 'CUSTOMER',
    subjectId: user.id,
    phone: user.phone,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  const token = jwt.sign({ sub: user.id, phone: user.phone, role: 'CUSTOMER', sid: session.id }, JWT_SECRET);
  return { token, user, session };
}

function wantsCompactView(req: Request) {
  const view = String(req.query.view || req.query.mode || '').toLowerCase();
  const platform = String(req.query.platform || req.headers['x-client-platform'] || '').toLowerCase();
  return view === 'compact' || view === 'mobile' || platform === 'mobile' || platform === 'zalo-mini-app';
}

function setPublicMobileCache(res: Response, ttlSeconds = 300) {
  res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
}

function toCompactProduct(product: any) {
  const giftPrograms = Array.isArray(product.giftPrograms)
    ? product.giftPrograms
        .filter((program: any) => program?.isActive !== false)
        .map((program: any) => ({
          id: program.id,
          title: program.title,
          badgeLabel: program.badgeLabel,
          giftProductId: program.giftProductId,
          minQuantity: program.minQuantity,
          giftQuantity: program.giftQuantity,
          isActive: program.isActive,
          showOnProductPage: program.showOnProductPage,
          startsAt: program.startsAt,
          endsAt: program.endsAt,
        }))
    : undefined;

  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    image: product.image || product.images?.[0]?.url || '/icon.png',
    promoDescription: product.promoDescription,
    promotionLabels: product.promotionLabels,
    giftPrograms,
    stockQuantity: product.stockQuantity,
    minStockLevel: product.minStockLevel,
    soldQuantity: product.soldQuantity,
    isFlashSale: product.isFlashSale,
    isRecommended: product.isRecommended,
    enableVariants: product.enableVariants,
    variants: Array.isArray(product.variants)
      ? product.variants
          .filter((variant: any) => variant?.isActive !== false)
          .map((variant: any) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price,
            originalPrice: variant.originalPrice,
            stockQuantity: variant.stockQuantity,
            imageUrl: variant.imageUrl,
            isActive: variant.isActive,
          }))
      : undefined,
  };
}

function getZaloCallbackPayload(req: Request) {
  return {
    method: req.method,
    query: req.query,
    body: req.body || {},
    receivedAt: new Date().toISOString(),
  };
}

function getZaloEventName(req: Request) {
  const payload = req.body || {};
  return (
    payload.event_name ||
    payload.eventName ||
    payload.event ||
    payload.type ||
    req.query.event_name ||
    req.query.event ||
    'unknown'
  );
}

function sendZaloCallbackOk(req: Request, res: Response, callbackType: string) {
  Logger.info(`💬 [Zalo ${callbackType}] ${req.method} event: ${getZaloEventName(req)}`);
  res.json({
    success: true,
    provider: 'zalo',
    callbackType,
    received: true,
    data: getZaloCallbackPayload(req),
  });
}

function assertAdminLoginAllowed(key: string) {
  const now = Date.now();
  const record = adminLoginAttempts.get(key);
  if (!record) return;
  if (record.blockedUntil && record.blockedUntil > now) {
    const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    throw new Error(`Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${waitSeconds} giây.`);
  }
  if (record.blockedUntil && record.blockedUntil <= now) {
    adminLoginAttempts.delete(key);
  }
}

function registerAdminLoginFailure(key: string) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const existing = adminLoginAttempts.get(key);
  const record = existing && now - existing.firstAttemptAt < windowMs
    ? existing
    : { count: 0, firstAttemptAt: now };
  record.count += 1;
  if (record.count >= 8) {
    record.blockedUntil = now + windowMs;
  }
  adminLoginAttempts.set(key, record);
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=()');
  next();
});
app.use(cors());
app.use('/api/admin/uploads', express.json({ limit: '8mb' }));
app.use('/api/admin/posts', express.json({ limit: '256kb' }));
app.use(['/user/avatar', '/api/user/avatar'], express.json({ limit: '256kb' }));
app.use(express.json());

// Initialize Database
Database.init();

// Middleware Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  Logger.info(`${req.method} ${req.url}`);
  next();
});

// Admin Auth Middleware with RBAC
const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (typeof decoded === 'string' || decoded.role !== 'SUPER_ADMIN') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const session = Database.getAuthSession(String(decoded.sid || ''));
    if (!session || session.role !== 'SUPER_ADMIN' || session.subjectId !== String(decoded.username || 'admin')) {
      return res.status(401).json({ message: 'Phiên đăng nhập đã bị đăng xuất khỏi thiết bị này.' });
    }
    Database.touchAuthSession(session.id);
    (req as any).admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

function authenticateCustomer(req: Request): jwt.JwtPayload | null {
  try {
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    const decoded = jwt.verify(token || '', JWT_SECRET) as jwt.JwtPayload;
    if (typeof decoded === 'string' || decoded.role !== 'CUSTOMER') return null;
    const session = Database.getAuthSession(String(decoded.sid || ''));
    if (!session || session.role !== 'CUSTOMER' || session.subjectId !== String(decoded.sub || '')) return null;
    Database.touchAuthSession(session.id);
    return decoded;
  } catch {
    return null;
  }
}

function canAccessOrder(req: Request, order: ReturnType<typeof Database.getOrderById>) {
  if (!order) return false;
  const providedToken = String(req.headers['x-order-access-token'] || req.query.accessToken || '');
  if (Database.verifyOrderAccessToken(order, providedToken)) {
    return true;
  }

  const identity = authenticateCustomer(req);
  if (!identity) return false;
  const identityPhone = normalizePhone(String(identity.phone || ''));
  const orderPhone = normalizePhone(String(order.delivery?.phone || ''));
  return Boolean(identityPhone && orderPhone && identityPhone === orderPhone);
}

mountPostRoutes(app, authenticateAdmin, () => Database.getSettings().publicSiteUrl, undefined, () => Database.getCoupons(), () => Database.getProducts());
mountUploads(app, authenticateAdmin, (url, title) => {
  Database.addMediaAsset({ url, title, sourceType: 'MANUAL', purpose: 'GENERAL', tags: ['upload'], isActive: true });
  CacheService.invalidate('media-library');
});

/* ==========================================================================
   PUBLIC MINI APP APIs
   ========================================================================== */

publicApi.get('/banners', async (req: Request, res: Response) => {
  const banners = await CacheService.getOrSet('banners:all', 300, async () => {
    return Database.getBanners();
  });
  setPublicMobileCache(res, 300);
  res.json(banners);
});

publicApi.get('/categories', async (req: Request, res: Response) => {
  const categories = await CacheService.getOrSet('categories:all', 300, async () => {
    return Database.getCategories();
  });
  setPublicMobileCache(res, 300);
  res.json(categories);
});

publicApi.get('/media-library', async (req: Request, res: Response) => {
  const { purpose, sourceType, tag, q } = req.query;
  const key = `media-library:${purpose || 'all'}:${sourceType || 'all'}:${tag || 'all'}:${q || ''}`;
  const media = await CacheService.getOrSet(key, 300, async () => {
    return Database.getMediaLibrary({
      purpose: purpose as string | undefined,
      sourceType: sourceType as string | undefined,
      tag: tag as string | undefined,
      q: q as string | undefined,
      activeOnly: true,
    });
  });
  setPublicMobileCache(res, 300);
  res.json(media);
});

publicApi.get('/products', async (req: Request, res: Response) => {
  const compact = wantsCompactView(req);
  const products = await CacheService.getOrSet(`products:${compact ? 'compact' : 'all'}`, 300, async () => {
    const data = Database.getProducts();
    return compact ? data.map(toCompactProduct) : data;
  });
  setPublicMobileCache(res, 180);
  res.setHeader('X-Saximi-View', compact ? 'compact' : 'full');
  res.json(products);
});

publicApi.get('/products/:id/gallery', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const gallery = await CacheService.getOrSet(`products:${id}:gallery`, 300, async () => {
    return Database.getProductImageGallery(id);
  });
  if (!gallery) {
    return res.status(404).json({ message: 'Product gallery not found' });
  }
  setPublicMobileCache(res, 300);
  res.json(gallery);
});

publicApi.get('/products/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const product = await CacheService.getOrSet(`products:${id}`, 300, async () => {
    return Database.getProductById(id);
  });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  setPublicMobileCache(res, 180);
  res.json(product);
});

publicApi.get('/stations', async (req: Request, res: Response) => {
  const referrerId = typeof req.query.referrerId === 'string' ? req.query.referrerId : undefined;
  const stations = await CacheService.getOrSet(`stations:${referrerId || 'public'}`, 600, async () => {
    return Database.getPickupStations(referrerId);
  });
  setPublicMobileCache(res, 600);
  res.json(stations);
});

publicApi.get('/coupons', (req: Request, res: Response) => {
  setPublicMobileCache(res, 120);
  res.json(Database.getCoupons().filter((c) => c.isActive));
});

publicApi.get('/settings', (_req: Request, res: Response) => {
  const settings = Database.getSettings();
  setPublicMobileCache(res, 300);
  res.json({
    shopName: settings.shopName,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    brandColor: settings.brandColor,
    hotline: settings.hotline,
    supportEmail: settings.supportEmail,
    businessAddress: settings.businessAddress,
    publicSiteUrl: settings.publicSiteUrl,
    zaloOaUrl: settings.zaloOaUrl,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
  });
});

publicApi.get('/forms', (req: Request, res: Response) => {
  const placement = typeof req.query.placement === 'string' ? req.query.placement : undefined;
  res.json(Database.getDynamicForms({ activeOnly: true, placement: placement as any }));
});

publicApi.post('/forms/:id/submissions', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const submission = Database.submitDynamicForm(id, req.body || {});
    if (!submission) return res.status(404).json({ message: 'Form không tồn tại hoặc đã tắt.' });
    WebPushService.notifyAdminFormSubmission(submission)
      .then(({ sent, total }) => {
        if (total > 0) Logger.info(`🔔 [Admin Push] Form submission notification sent to ${sent}/${total} admin devices`);
      })
      .catch((pushError) => Logger.error('Failed to notify admin form submission by web push', pushError));
    res.status(201).json({ success: true, submission });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể gửi form.' });
  }
});

publicApi.get('/affiliate/portal', (req: Request, res: Response) => {
  res.json(Database.getAffiliatePortalSummary());
});

publicApi.post('/affiliate/register', (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!isValidVietnamPhone(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    const profile = Database.registerAffiliateFromCustomer({
      name: req.body.name,
      phone,
      address: req.body.address,
      note: req.body.note,
    });
    CacheService.invalidate('stations');

    Logger.info(`🤝 [Affiliate Register] ${profile.name} (${profile.phone}) registered as ${profile.levelName}`);
    res.status(201).json({
      profile,
      message: 'Đã tạo khu vực đại lý. Bạn có thể bắt đầu chia sẻ link giới thiệu.',
    });
  } catch (error: any) {
    Logger.error('Failed to register affiliate', error);
    res.status(400).json({
      message: error?.message || 'Không thể đăng ký đại lý',
    });
  }
});

publicApi.post('/auth/request-otp', (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!isValidVietnamPhone(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    const result = OtpService.requestOtp(phone);
    const latestOutboxItem = OtpService.getOutbox().find((item) => item.id === result.delivery.outboxId);
    if (latestOutboxItem?.otpPreview) {
      WebPushService.notifyAdminOtp(phone, latestOutboxItem.otpPreview)
        .then(({ sent, total }) => {
          if (total > 0) Logger.info(`🔔 [Admin Push] OTP notification sent to ${sent}/${total} admin devices`);
        })
        .catch((pushError) => Logger.error('Failed to notify admin OTP by web push', pushError));
    }
    res.json({
      ...result,
      message: result.delivery.message,
    });
  } catch (error) {
    if (error instanceof OtpError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    Logger.error('Failed to request OTP', error);
    res.status(500).json({ message: 'Không thể tạo OTP. Vui lòng thử lại sau.' });
  }
});

publicApi.post('/auth/pin-status', (req: Request, res: Response) => {
  const phone = normalizePhone(req.body.phone);
  if (!isValidVietnamPhone(phone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
  }

  const user = Database.findUserByPhone(phone);
  res.json({
    phone,
    hasPin: Boolean(user?.pinHash),
  });
});

publicApi.post('/auth/verify-otp', (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || '').trim();
    const name = typeof req.body.name === 'string' ? req.body.name : undefined;
    const email = typeof req.body.email === 'string' ? req.body.email : undefined;

    if (!isValidVietnamPhone(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Mã OTP cần có 6 chữ số' });
    }

    OtpService.verifyOtp(phone, otp);
    const user = Database.upsertPhoneUser({ phone, name, email });
    const auth = createCustomerAuthResponse(user, req);

    Logger.info(`✅ [Auth] User ${user.phone} logged in`);
    res.json(auth);
  } catch (error) {
    if (error instanceof OtpError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    Logger.error('Failed to verify OTP', error);
    res.status(500).json({ message: 'Không thể xác minh OTP. Vui lòng thử lại sau.' });
  }
});

publicApi.post('/auth/login-pin', (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const pin = String(req.body.pin || '').trim();

    if (!isValidVietnamPhone(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }
    if (!isValidLoginPin(pin)) {
      return res.status(400).json({ message: 'Mã PIN cần có 4-6 chữ số' });
    }

    const user = Database.verifyUserPin(phone, pin);
    if (!user) {
      return res.status(401).json({ message: 'Số điện thoại hoặc mã PIN không đúng' });
    }

    const auth = createCustomerAuthResponse(user, req);
    Logger.info(`✅ [Auth PIN] User ${user.phone} logged in`);
    res.json(auth);
  } catch (error) {
    Logger.error('Failed to login with PIN', error);
    res.status(500).json({ message: 'Không thể đăng nhập bằng PIN. Vui lòng thử lại sau.' });
  }
});

publicApi.post('/auth/set-pin', (req: Request, res: Response) => {
  const identity = authenticateCustomer(req);
  if (!identity) return res.status(401).json({ message: 'Vui lòng đăng nhập để thiết lập mã PIN.' });

  const pin = String(req.body.pin || '').trim();
  if (!isValidLoginPin(pin)) {
    return res.status(400).json({ message: 'Mã PIN cần có 4-6 chữ số' });
  }

  const user = Database.setUserPin(String(identity.sub || ''), pin);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
  res.json({ user, message: 'Đã thiết lập mã PIN đăng nhập.' });
});

publicApi.post('/auth/zalo-login', async (req: Request, res: Response) => {
  let phone = normalizePhone(req.body.phone);
  const phoneToken = typeof req.body.phoneToken === 'string' ? req.body.phoneToken : '';
  const zaloUserId = typeof req.body.zaloUserId === 'string' ? req.body.zaloUserId : undefined;
  const name = typeof req.body.name === 'string' ? req.body.name : undefined;
  const avatar = typeof req.body.avatar === 'string' ? req.body.avatar : undefined;

  if (!zaloUserId) {
    return res.status(400).json({ message: 'Thiếu Zalo user id' });
  }

  try {
    if (phoneToken) {
      const decoded = await ZaloService.decodePhoneToken(phoneToken);
      phone = normalizePhone(decoded.phone);
    } else if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ message: 'Thiếu token xác thực số điện thoại Zalo.' });
    }

    if (!isValidVietnamPhone(phone)) {
      return res.status(400).json({ message: 'Cần số điện thoại hợp lệ để tự đăng nhập Zalo Mini App' });
    }
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Không xác minh được số điện thoại Zalo.' });
  }

  const user = Database.upsertPhoneUser({
    id: zaloUserId,
    phone,
    name,
    avatar,
  });
  const session = Database.createAuthSession({
    role: 'CUSTOMER',
    subjectId: user.id,
    phone: user.phone,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  const token = jwt.sign({ sub: user.id, phone: user.phone, role: 'CUSTOMER', provider: 'zalo', sid: session.id }, JWT_SECRET);

  Logger.info(`✅ [Zalo Auth] User ${user.phone} logged in from Mini App`);
  res.json({ token, user, session });
});

publicApi.get('/web-push/config', (_req: Request, res: Response) => {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY || '';
  res.json({
    enabled: Boolean(publicKey),
    publicKey,
  });
});

publicApi.post('/web-push/subscribe', (req: Request, res: Response) => {
  try {
    const { subscription, userId, userName, userPhone, userAgent, platform } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: 'Missing push subscription endpoint' });
    }

    const record = Database.upsertWebPushSubscription({
      subscription,
      audience: 'CUSTOMER',
      userId,
      userName,
      userPhone,
      userAgent,
      platform,
    });

    Logger.info(`🔔 [Web Push] Registered browser subscription #${record.id}`);
    res.status(201).json({
      id: record.id,
      endpoint: record.endpoint,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    Logger.error('Failed to register web push subscription', error);
    res.status(400).json({ message: 'Failed to register web push subscription', error: String(error) });
  }
});

publicApi.get('/orders', (req: Request, res: Response) => {
  const status = req.query.status as string;
  const identity = authenticateCustomer(req);
  if (!identity) return res.status(401).json({ message: 'Vui lòng đăng nhập để xem danh sách đơn hàng.' });
  const phone = normalizePhone(String(identity.phone || ''));
  res.json(Database.getOrders(status, phone));
});

publicApi.post('/orders', (req: Request, res: Response) => {
  try {
    const { items, delivery, total, note, couponCode, referrerId, paymentMethod = 'COD' } = req.body;
    const deliveryPhone = normalizePhone(delivery?.phone || '');

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Đơn hàng cần có ít nhất một sản phẩm' });
    }

    if (!String(delivery?.name || '').trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập tên người nhận' });
    }

    if (!isValidVietnamPhone(deliveryPhone)) {
      return res.status(400).json({ message: 'Số điện thoại nhận hàng không hợp lệ' });
    }

    if (!String(delivery?.address || '').trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập địa chỉ hoặc điểm nhận hàng' });
    }

    // Map frontend items {id, name, price, quantity} → OrderItem {product, quantity}
    const mappedItems = (items || []).map((item: any) => ({
      product: {
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image || '',
        categoryId: item.categoryId || 0,
      },
      quantity: item.quantity,
    }));

    const newOrder = Database.createOrder({
      items: mappedItems,
      delivery: { ...delivery, phone: deliveryPhone },
      total: total || 0,
      note,
      couponCode,
      referrerId,
      paymentMethod,
    });

    let paymentDetails: any = { paymentMethod };
    if (paymentMethod === 'VIETQR') {
      const paymentConfig = Database.getPaymentConfig();
      const bankInfo = PaymentService.getBankInfo(paymentConfig);
      paymentDetails.vietQrUrl = PaymentService.generateVietQRUrl(newOrder.id, newOrder.total, paymentConfig);
      paymentDetails.accountNo = bankInfo.accountNo;
      paymentDetails.bankName = bankInfo.bankName;
      paymentDetails.accountName = bankInfo.accountName;
      paymentDetails.transferContent = PaymentService.getTransferContent(newOrder.id);
      paymentDetails.provider = 'SEPAY';
      paymentDetails.sepayWebhookUrl = PaymentService.getSepayWebhookUrl(paymentConfig);
    } else if (paymentMethod === 'ZALOPAY') {
      const zaloPayRes = PaymentService.createZaloPayToken(newOrder.id, newOrder.total);
      paymentDetails.zpTransToken = zaloPayRes.zpTransToken;
      paymentDetails.orderUrl = zaloPayRes.orderUrl;
    }

    Logger.info(`🛒 [New Order] Created #${newOrder.id} Total: ${newOrder.total} VND (Method: ${paymentMethod})`);
    WebPushService.notifyAdminNewOrder(newOrder)
      .then(({ sent, total }) => {
        if (total > 0) Logger.info(`🔔 [Admin Push] New order notification sent to ${sent}/${total} admin devices`);
      })
      .catch((pushError) => Logger.error('Failed to notify admin new order by web push', pushError));
    res.status(201).json({ ...newOrder, paymentDetails });
  } catch (error) {
    Logger.error('Failed to create order', error);
    res.status(400).json({ message: 'Failed to create order', error: String(error) });
  }
});


// Generate VietQR / ZaloPay Payment Info
publicApi.get('/payment/details/:orderId', (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  const order = Database.getOrderById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!canAccessOrder(req, order)) return res.status(403).json({ message: 'Bạn không có quyền xem thông tin thanh toán đơn này.' });

  const paymentConfig = Database.getPaymentConfig();
  const bankInfo = PaymentService.getBankInfo(paymentConfig);
  const vietQrUrl = PaymentService.generateVietQRUrl(order.id, order.total, paymentConfig);
  const zaloPayRes = PaymentService.createZaloPayToken(order.id, order.total);

  res.json({
    orderId: order.id,
    amount: order.total,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod || 'COD',
    vietQrUrl,
    bankName: bankInfo.bankName,
    accountNo: bankInfo.accountNo,
    accountName: bankInfo.accountName,
    transferContent: PaymentService.getTransferContent(order.id),
    provider: 'SEPAY',
    sepayWebhookUrl: PaymentService.getSepayWebhookUrl(paymentConfig),
    sepayWebhookConfigured: PaymentService.isSepayWebhookConfigured(paymentConfig),
    zaloPayToken: zaloPayRes.zpTransToken,
  });
});

publicApi.post('/payment/sepay/webhook', (req: Request, res: Response) => {
  const paymentConfig = Database.getPaymentConfig();
  if (!PaymentService.verifySepayWebhookAuth(req.headers.authorization, req.headers['x-sepay-api-key'], paymentConfig)) {
    return res.status(401).json({ success: false, message: 'Invalid SePay webhook API key' });
  }

  const payload = Array.isArray(req.body) ? req.body[0] : req.body;
  const paymentMatch = PaymentService.parseSepayWebhookPayload(payload || {});
  if (!paymentMatch) {
    return res.status(400).json({ success: false, message: 'Cannot match order code from transaction content' });
  }

  const transferType = String(paymentMatch.transferType || '').toLowerCase();
  if (transferType && !['in', 'credit', 'deposit'].includes(transferType)) {
    return res.json({ success: true, ignored: true, message: 'Outgoing transaction ignored' });
  }

  const order = Database.getOrderById(paymentMatch.orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: `Order #${paymentMatch.orderId} not found` });
  }

  if (paymentMatch.amount < order.total) {
    Logger.warn(`⚠️ [SePay] Amount mismatch for order #${order.id}. Received ${paymentMatch.amount}, expected ${order.total}`);
    return res.status(422).json({
      success: false,
      message: 'Transfer amount is lower than order total',
      orderId: order.id,
      receivedAmount: paymentMatch.amount,
      expectedAmount: order.total,
    });
  }

  const updatedOrder = Database.confirmOrderPayment(order.id, {
    provider: 'SEPAY',
    reference: paymentMatch.referenceCode,
    amount: paymentMatch.amount,
  });

  Logger.info(`💳 [SePay] Confirmed payment for order #${order.id} via transaction ${paymentMatch.referenceCode || 'N/A'}`);
  res.json({
    success: true,
    orderId: updatedOrder?.id,
    paymentStatus: updatedOrder?.paymentStatus,
    referenceCode: paymentMatch.referenceCode,
  });
});

publicApi.get('/zalo/webhook', (_req: Request, res: Response) => {
  res.json({
    success: true,
    provider: 'zalo',
    message: 'Zalo webhook endpoint is ready',
  });
});

publicApi.post('/zalo/webhook', (req: Request, res: Response) => {
  sendZaloCallbackOk(req, res, 'webhook');
});

publicApi.get('/zalo/status', (_req: Request, res: Response) => {
  const settings = Database.getSettings();
  const siteUrl = settings.publicSiteUrl.replace(/\/+$/, '') || 'https://hpn.saximi.com.vn';
  res.json({
    success: true,
    provider: 'zalo',
    status: 'ready',
    callbacks: {
      webhook: `${siteUrl}/api/zalo/webhook`,
      callback: `${siteUrl}/api/zalo/callback`,
      oauth: `${siteUrl}/api/zalo/oauth/callback`,
      miniapp: `${siteUrl}/api/zalo/miniapp/callback`,
      oa: `${siteUrl}/api/zalo/oa/callback`,
    },
  });
});

publicApi.get('/zalo/callback', (req: Request, res: Response) => {
  sendZaloCallbackOk(req, res, 'general-callback');
});

publicApi.post('/zalo/callback', (req: Request, res: Response) => {
  sendZaloCallbackOk(req, res, 'general-callback');
});

publicApi.get('/zalo/oauth/callback', (req: Request, res: Response) => {
  sendZaloCallbackOk(req, res, 'oauth-callback');
});

publicApi.post('/zalo/oauth/callback', (req: Request, res: Response) => {
  sendZaloCallbackOk(req, res, 'oauth-callback');
});

publicApi.get('/zalo/miniapp/callback', (req: Request, res: Response) => {
  sendZaloCallbackOk(req, res, 'miniapp-callback');
});

publicApi.post('/zalo/miniapp/callback', (req: Request, res: Response) => {
  sendZaloCallbackOk(req, res, 'miniapp-callback');
});

publicApi.get('/zalo/oa/callback', (req: Request, res: Response) => {
  sendZaloCallbackOk(req, res, 'oa-callback');
});

publicApi.post('/zalo/oa/callback', (req: Request, res: Response) => {
  sendZaloCallbackOk(req, res, 'oa-callback');
});

publicApi.get('/payment/status/:orderId', (req: Request, res: Response) => {
  const orderId = parseInt(req.params.orderId);
  const order = Database.checkAndUpdatePaymentStatus(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!canAccessOrder(req, order)) return res.status(403).json({ message: 'Bạn không có quyền xem trạng thái thanh toán đơn này.' });

  res.json({
    orderId: order.id,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod || 'COD',
    checkedAt: new Date().toISOString(),
    paymentProvider: order.paymentProvider,
    paymentReference: order.paymentReference,
    autoCheckEnabled: PaymentService.isSepayWebhookConfigured(Database.getPaymentConfig()) && (order.paymentMethod || 'COD') !== 'COD' && order.paymentStatus === 'pending',
    provider: 'SEPAY',
  });
});

publicApi.get('/orders/:id', (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const order = Database.checkAndUpdatePaymentStatus(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!canAccessOrder(req, order)) return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này.' });
  res.json(order);
});

publicApi.get('/orders/:id/tracking', (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const tracking = Database.getOrderTracking(orderId);
  if (!tracking) return res.status(404).json({ message: 'Order not found' });
  if (!canAccessOrder(req, tracking.order)) return res.status(403).json({ message: 'Bạn không có quyền theo dõi đơn hàng này.' });
  res.json(tracking);
});

publicApi.get('/user/addresses', (req: Request, res: Response) => {
  const identity = authenticateCustomer(req);
  if (!identity) return res.status(401).json({ message: 'Vui lòng đăng nhập để xem sổ địa chỉ.' });
  const phone = normalizePhone(String(identity.phone || ''));
  res.json(Database.getUserAddresses(phone));
});

publicApi.post('/user/addresses', (req: Request, res: Response) => {
  const identity = authenticateCustomer(req);
  if (!identity) return res.status(401).json({ message: 'Vui lòng đăng nhập để lưu địa chỉ.' });
  const phone = normalizePhone(String(identity.phone || ''));
  if (!isValidVietnamPhone(phone)) return res.status(400).json({ message: 'Số điện thoại tài khoản không hợp lệ' });
  const address = Database.upsertUserAddress(phone, {
    ...(req.body.address || req.body),
    phone,
  });
  res.status(201).json(address);
});

publicApi.put('/user/addresses/:id', (req: Request, res: Response) => {
  const identity = authenticateCustomer(req);
  if (!identity) return res.status(401).json({ message: 'Vui lòng đăng nhập để sửa địa chỉ.' });
  const phone = normalizePhone(String(identity.phone || ''));
  if (!isValidVietnamPhone(phone)) return res.status(400).json({ message: 'Số điện thoại tài khoản không hợp lệ' });
  const address = Database.upsertUserAddress(phone, { ...(req.body.address || req.body), id: req.params.id, phone });
  res.json(address);
});

publicApi.delete('/user/addresses/:id', (req: Request, res: Response) => {
  const identity = authenticateCustomer(req);
  if (!identity) return res.status(401).json({ message: 'Vui lòng đăng nhập để xóa địa chỉ.' });
  const phone = normalizePhone(String(identity.phone || ''));
  if (!isValidVietnamPhone(phone)) return res.status(400).json({ message: 'Số điện thoại tài khoản không hợp lệ' });
  const ok = Database.deleteUserAddress(phone, req.params.id);
  if (!ok) return res.status(404).json({ message: 'Address not found' });
  res.json({ success: true });
});

publicApi.put('/user/avatar', (req: Request, res: Response) => {
  const identity = authenticateCustomer(req);
  if (!identity) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập lại để đổi ảnh đại diện.' });
  }
  const user = Database.findUserByPhone(String(identity.phone || ''));
  if (!user || user.id !== identity.sub) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
  const avatar = req.body.avatar;
  if (typeof avatar !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar)) {
    return res.status(400).json({ message: 'Ảnh đại diện không hợp lệ.' });
  }
  const bytes = Buffer.from(avatar.split(',')[1], 'base64');
  if (bytes.length > 180 * 1024 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return res.status(400).json({ message: 'Ảnh không hợp lệ hoặc vượt quá dung lượng cho phép.' });
  }
  Database.updateUser(user.id, { avatar });
  res.json({ avatar });
});

publicApi.get('/auth/sessions', (req: Request, res: Response) => {
  const identity = authenticateCustomer(req);
  if (!identity) return res.status(401).json({ message: 'Vui lòng đăng nhập lại.' });
  const currentSessionId = String(identity.sid || '');
  const sessions = Database.listAuthSessions({
    role: 'CUSTOMER',
    subjectId: String(identity.sub || ''),
    activeOnly: true,
  }).map((session) => ({
    ...session,
    isCurrent: session.id === currentSessionId,
  }));
  res.json(sessions);
});

publicApi.delete('/auth/sessions/:id', (req: Request, res: Response) => {
  const identity = authenticateCustomer(req);
  if (!identity) return res.status(401).json({ message: 'Vui lòng đăng nhập lại.' });
  const revoked = Database.revokeAuthSession(req.params.id, {
    role: 'CUSTOMER',
    subjectId: String(identity.sub || ''),
  });
  if (!revoked) return res.status(404).json({ message: 'Không tìm thấy thiết bị đăng nhập.' });
  res.json({ success: true, revokedId: revoked.id });
});

publicApi.put('/user/profile', (req: Request, res: Response) => {
  const identity = authenticateCustomer(req);
  if (!identity) return res.status(401).json({ message: 'Vui lòng đăng nhập để cập nhật hồ sơ.' });
  const phone = normalizePhone(String(identity.phone || ''));
  if (!isValidVietnamPhone(phone)) {
    return res.status(400).json({ message: 'Số điện thoại tài khoản không hợp lệ' });
  }

  const existing = Database.findUserByPhone(phone);
  if (existing && existing.id !== identity.sub) {
    return res.status(403).json({ message: 'Bạn không có quyền cập nhật hồ sơ này.' });
  }
  const user = existing
    ? Database.updateUser(existing.id, {
        name: req.body.name,
        phone,
        email: req.body.email,
        avatar: existing.avatar,
        address: req.body.address,
      })
    : Database.upsertPhoneUser({
        phone,
        name: req.body.name,
        email: req.body.email,
        avatar: req.body.avatar,
        address: req.body.address,
      });

  res.json(user);
});

// Zalo Phone Token Decode
publicApi.post('/user/decode-phone', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const decoded = await ZaloService.decodePhoneToken(token);
    res.json(decoded);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Decode phone failed' });
  }
});

/* ==========================================================================
   ADMIN DASHBOARD APIs
   ========================================================================== */

app.use('/', publicApi);
app.use('/api', publicApi);

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const loginKey = `${req.ip}:${String(username || '').toLowerCase()}`;
  try {
    assertAdminLoginAllowed(loginKey);
  } catch (error: any) {
    return res.status(429).json({ message: error.message || 'Vui lòng thử lại sau.' });
  }
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    adminLoginAttempts.delete(loginKey);
    const session = Database.createAuthSession({
      role: 'SUPER_ADMIN',
      subjectId: username,
      username,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    const token = jwt.sign({ username, role: 'SUPER_ADMIN', sid: session.id }, JWT_SECRET);
    Logger.info(`🔑 [Admin Auth] Admin logged in: ${username}`);
    Database.logAction('admin', 'SUPER_ADMIN', 'ADMIN_LOGIN', 'Đăng nhập trang quản trị thành công', undefined, req.ip);
    WebPushService.notifyAdminLogin(username, req.ip)
      .then(({ sent, total }) => {
        if (total > 0) Logger.info(`🔔 [Admin Push] Admin login notification sent to ${sent}/${total} admin devices`);
      })
      .catch((pushError) => Logger.error('Failed to notify admin login by web push', pushError));
    return res.json({ token, user: { username, name: 'System Admin', role: 'SUPER_ADMIN' }, session });
  }
  registerAdminLoginFailure(loginKey);
  return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
});

app.get('/api/admin/stats', authenticateAdmin, (req: Request, res: Response) => {
  const orders = Database.getOrders();
  const products = Database.getProducts();
  const categories = Database.getCategories();
  const users = Database.getUsers();
  const affiliates = Database.getAffiliates();
  const consignment = Database.getConsignmentStocks();

  const totalRevenue = orders
    .filter((o) => o.status === 'completed' || o.paymentStatus === 'success')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const totalDebt = consignment.reduce((sum, c) => sum + c.debtAmount, 0);

  const lowStockCount = products.filter((p) => (p.stockQuantity ?? 0) <= (p.minStockLevel ?? 15)).length;
  const pendingOtpCount = OtpService.getOutbox().filter((item) => item.status === 'pending').length;

  res.json({
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    shippingOrders: orders.filter((o) => o.status === 'shipping').length,
    completedOrders: orders.filter((o) => o.status === 'completed').length,
    totalProducts: products.length,
    totalCategories: categories.length,
    totalUsers: users.length,
    totalAffiliates: affiliates.length,
    totalConsignmentDebt: totalDebt,
    lowStockCount,
    pendingOtpCount,
  });
});

app.get('/api/admin/otp-outbox', authenticateAdmin, (_req: Request, res: Response) => {
  res.json(OtpService.getOutbox());
});

app.get('/api/admin/auth-sessions', authenticateAdmin, (req: Request, res: Response) => {
  const admin = (req as any).admin || {};
  const currentSessionId = String(admin.sid || '');
  const sessions = Database.listAuthSessions({
    role: 'SUPER_ADMIN',
    subjectId: String(admin.username || 'admin'),
    activeOnly: true,
  }).map((session) => ({
    ...session,
    isCurrent: session.id === currentSessionId,
  }));
  res.json(sessions);
});

app.delete('/api/admin/auth-sessions/:id', authenticateAdmin, (req: Request, res: Response) => {
  const admin = (req as any).admin || {};
  const revoked = Database.revokeAuthSession(req.params.id, {
    role: 'SUPER_ADMIN',
    subjectId: String(admin.username || 'admin'),
  });
  if (!revoked) return res.status(404).json({ message: 'Không tìm thấy thiết bị đăng nhập.' });
  res.json({ success: true, revokedId: revoked.id });
});

app.get('/api/admin/web-push/config', authenticateAdmin, (_req: Request, res: Response) => {
  const subscriptions = Database.getWebPushSubscriptions().filter((item) => item.audience === 'ADMIN');
  res.json({
    enabled: WebPushService.isEnabled(),
    publicKey: process.env.WEB_PUSH_PUBLIC_KEY || '',
    devices: subscriptions.length,
  });
});

app.post('/api/admin/web-push/subscribe', authenticateAdmin, (req: Request, res: Response) => {
  try {
    if (!WebPushService.isEnabled()) {
      return res.status(400).json({ message: 'Máy chủ chưa cấu hình VAPID để gửi thông báo đẩy.' });
    }

    const subscription = req.body.subscription;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: 'Thiếu thông tin thiết bị nhận thông báo.' });
    }

    const admin = (req as any).admin || {};
    const record = Database.upsertWebPushSubscription({
      subscription,
      audience: 'ADMIN',
      userId: admin.username || 'admin',
      userName: admin.username || 'Admin',
      userPhone: '',
      userAgent: req.body.userAgent,
      platform: req.body.platform,
    });

    Logger.info(`🔔 [Admin Push] Registered admin browser subscription #${record.id}`);
    res.status(201).json({ id: record.id, endpoint: record.endpoint, enabled: true });
  } catch (error) {
    Logger.error('Failed to register admin web push subscription', error);
    res.status(400).json({ message: 'Không thể bật thông báo đẩy cho admin.' });
  }
});

app.post('/api/admin/web-push/test', authenticateAdmin, async (req: Request, res: Response) => {
  if (!WebPushService.isEnabled()) {
    return res.status(400).json({ message: 'Máy chủ chưa cấu hình VAPID để gửi thông báo đẩy.' });
  }

  const result = await WebPushService.notifyAdminTest(
    typeof req.body?.message === 'string' ? req.body.message : undefined
  );
  if (result.total === 0) {
    return res.status(400).json({ message: 'Chưa có thiết bị admin nào đăng ký nhận thông báo đẩy.' });
  }
  res.json({
    success: result.sent > 0,
    ...result,
  });
});

app.patch('/api/admin/otp-outbox/:id/sent', authenticateAdmin, (req: Request, res: Response) => {
  const item = OtpService.markOutboxSent(req.params.id);
  if (!item) return res.status(404).json({ message: 'Không tìm thấy OTP trong hàng chờ' });
  res.json(item);
});

app.delete('/api/admin/otp-outbox/:id', authenticateAdmin, (req: Request, res: Response) => {
  const deleted = OtpService.deleteOutboxItem(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Không tìm thấy OTP trong hàng chờ' });
  res.json({ message: 'Đã xóa OTP khỏi hàng chờ' });
});

// Audit Logs Endpoint
app.get('/api/admin/audit-logs', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getAuditLogs());
});

// Admin Media Library
app.get('/api/admin/media-library', authenticateAdmin, (req: Request, res: Response) => {
  const { purpose, sourceType, tag, q, activeOnly } = req.query;
  res.json(Database.getMediaLibrary({
    purpose: purpose as string | undefined,
    sourceType: sourceType as string | undefined,
    tag: tag as string | undefined,
    q: q as string | undefined,
    activeOnly: activeOnly === 'true',
  }));
});

app.post('/api/admin/media-library', authenticateAdmin, (req: Request, res: Response) => {
  if (!req.body?.url) {
    return res.status(400).json({ message: 'URL hình ảnh là bắt buộc' });
  }
  const asset = Database.addMediaAsset({
    url: req.body.url,
    title: req.body.title || 'Ảnh thư viện',
    altText: req.body.altText,
    sourceType: req.body.sourceType || 'MANUAL',
    sourceId: req.body.sourceId,
    purpose: req.body.purpose || 'GENERAL',
    tags: Array.isArray(req.body.tags)
      ? req.body.tags
      : String(req.body.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    isActive: req.body.isActive ?? true,
  });
  CacheService.invalidate('media-library');
  res.status(201).json(asset);
});

app.put('/api/admin/media-library/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updated = Database.updateMediaAsset(id, req.body);
  if (!updated) return res.status(404).json({ message: 'Media asset not found' });
  CacheService.invalidate('media-library');
  res.json(updated);
});

app.delete('/api/admin/media-library/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const success = Database.deleteMediaAsset(id);
  if (!success) return res.status(404).json({ message: 'Media asset not found' });
  CacheService.invalidate('media-library');
  res.json({ message: 'Media asset deleted successfully' });
});

// Financial Settlements Endpoints
app.get('/api/admin/settlements', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getSettlements());
});

app.post('/api/admin/settlements', authenticateAdmin, (req: Request, res: Response) => {
  const { presidentId, amount, paymentMethod, referenceCode } = req.body;
  const settlement = Database.createSettlement(presidentId, amount, paymentMethod, referenceCode);
  res.status(201).json(settlement);
});

app.put('/api/admin/settlements/:id', authenticateAdmin, (req: Request, res: Response) => {
  const settlement = Database.updateSettlement(parseInt(req.params.id), req.body);
  if (!settlement) return res.status(404).json({ message: 'Settlement not found' });
  res.json(settlement);
});

app.delete('/api/admin/settlements/:id', authenticateAdmin, (req: Request, res: Response) => {
  const ok = Database.deleteSettlement(parseInt(req.params.id));
  if (!ok) return res.status(404).json({ message: 'Settlement not found' });
  res.json({ success: true });
});

// Admin Product CRUD
app.get('/api/admin/products', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getProducts());
});

app.post('/api/admin/products', authenticateAdmin, (req: Request, res: Response) => {
  const productData = req.body;
  const newProduct = Database.addProduct(productData);
  CacheService.invalidate('products');
  CacheService.invalidate('media-library');
  Logger.info(`📦 [Admin Product] Created: ${newProduct.name}`);
  res.status(201).json(newProduct);
});

app.put('/api/admin/products/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updated = Database.updateProduct(id, req.body);
  if (!updated) return res.status(404).json({ message: 'Product not found' });
  CacheService.invalidate('products');
  CacheService.invalidate('media-library');
  Logger.info(`📦 [Admin Product] Updated: #${id}`);
  res.json(updated);
});

app.delete('/api/admin/products/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const success = Database.deleteProduct(id);
  if (!success) return res.status(404).json({ message: 'Product not found' });
  CacheService.invalidate('products');
  Logger.info(`📦 [Admin Product] Deleted: #${id}`);
  res.json({ message: 'Product deleted successfully' });
});

// Admin Category CRUD
app.get('/api/admin/categories', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getCategories());
});

app.post('/api/admin/categories', authenticateAdmin, (req: Request, res: Response) => {
  const categoryData = req.body;
  const newCategory = Database.addCategory(categoryData);
  CacheService.invalidate('categories');
  CacheService.invalidate('media-library');
  Logger.info(`📁 [Admin Category] Created: ${newCategory.name}`);
  res.status(201).json(newCategory);
});

app.put('/api/admin/categories/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updated = Database.updateCategory(id, req.body);
  if (!updated) return res.status(404).json({ message: 'Category not found' });
  CacheService.invalidate('categories');
  CacheService.invalidate('media-library');
  Logger.info(`📁 [Admin Category] Updated: #${id}`);
  res.json(updated);
});

app.delete('/api/admin/categories/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const success = Database.deleteCategory(id);
  if (!success) return res.status(404).json({ message: 'Category not found' });
  CacheService.invalidate('categories');
  Logger.info(`📁 [Admin Category] Deleted: #${id}`);
  res.json({ message: 'Category deleted successfully' });
});

// Admin Banner CRUD
app.get('/api/admin/banners', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getBannerItems());
});

app.post('/api/admin/banners', authenticateAdmin, (req: Request, res: Response) => {
  const newBanner = Database.addBanner(req.body);
  CacheService.invalidate('banners');
  CacheService.invalidate('media-library');
  res.status(201).json(newBanner);
});

app.patch('/api/admin/banners/reorder', authenticateAdmin, (req: Request, res: Response) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((id: unknown) => Number(id)).filter(Number.isFinite) : [];
  const banners = Database.reorderBanners(ids);
  CacheService.invalidate('banners');
  res.json(banners);
});

app.put('/api/admin/banners/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updated = Database.updateBanner(id, req.body);
  if (!updated) return res.status(404).json({ message: 'Banner not found' });
  CacheService.invalidate('banners');
  CacheService.invalidate('media-library');
  res.json(updated);
});

app.delete('/api/admin/banners/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  Database.deleteBanner(id);
  CacheService.invalidate('banners');
  res.json({ message: 'Banner deleted' });
});

// Admin Station CRUD
app.get('/api/admin/stations', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getStations());
});

app.post('/api/admin/stations', authenticateAdmin, (req: Request, res: Response) => {
  const newStation = Database.addStation(req.body);
  CacheService.invalidate('stations');
  CacheService.invalidate('media-library');
  res.status(201).json(newStation);
});

app.put('/api/admin/stations/:id', authenticateAdmin, (req: Request, res: Response) => {
  const station = Database.updateStation(parseInt(req.params.id), req.body);
  if (!station) return res.status(404).json({ message: 'Station not found' });
  CacheService.invalidate('stations');
  CacheService.invalidate('media-library');
  res.json(station);
});

app.delete('/api/admin/stations/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const ok = Database.deleteStation(id);
  if (!ok) return res.status(404).json({ message: 'Station not found' });
  CacheService.invalidate('stations');
  res.json({ success: true });
});

// Admin Coupon CRUD
app.get('/api/admin/coupons', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getCoupons());
});

app.post('/api/admin/coupons', authenticateAdmin, (req: Request, res: Response) => {
  const newCoupon = Database.addCoupon(req.body);
  res.status(201).json(newCoupon);
});

app.delete('/api/admin/coupons/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  Database.deleteCoupon(id);
  res.json({ message: 'Coupon deleted' });
});

// Admin Affiliates (Chi hội trưởng & Chủ tịch hội)
app.get('/api/admin/affiliates', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getAffiliates());
});

app.post('/api/admin/affiliates', authenticateAdmin, (req: Request, res: Response) => {
  const profile = Database.upsertAffiliate(req.body);
  CacheService.invalidate('stations');
  res.status(201).json(profile);
});

app.put('/api/admin/affiliates/:userId', authenticateAdmin, (req: Request, res: Response) => {
  const profile = Database.upsertAffiliate({ ...req.body, userId: req.params.userId });
  CacheService.invalidate('stations');
  res.json(profile);
});

app.patch('/api/admin/affiliates/:userId/commission', authenticateAdmin, (req: Request, res: Response) => {
  const profile = Database.assignAffiliateCommission(req.params.userId, req.body);
  if (!profile) return res.status(404).json({ message: 'Affiliate not found' });
  res.json(profile);
});

app.delete('/api/admin/affiliates/:userId', authenticateAdmin, (req: Request, res: Response) => {
  try {
    const ok = Database.deleteAffiliate(req.params.userId);
    if (!ok) return res.status(404).json({ message: 'Affiliate not found' });
    CacheService.invalidate('stations');
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Cannot delete affiliate' });
  }
});

// Admin Consignment Stock (Hàng gối đầu)
app.get('/api/admin/consignments', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getConsignmentStocks());
});

app.post('/api/admin/consignments/allocate', authenticateAdmin, (req: Request, res: Response) => {
  const { presidentId, productId, quantity } = req.body;
  const newStock = Database.allocateConsignment(presidentId, productId, quantity);
  res.status(201).json(newStock);
});

app.put('/api/admin/consignments/:id', authenticateAdmin, (req: Request, res: Response) => {
  const stock = Database.updateConsignment(parseInt(req.params.id), req.body);
  if (!stock) return res.status(404).json({ message: 'Consignment not found' });
  res.json(stock);
});

app.delete('/api/admin/consignments/:id', authenticateAdmin, (req: Request, res: Response) => {
  const ok = Database.deleteConsignment(parseInt(req.params.id));
  if (!ok) return res.status(404).json({ message: 'Consignment not found' });
  res.json({ success: true });
});

// Admin In-house Logistics / Deliveries
app.get('/api/admin/deliveries', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getDeliveries());
});

app.post('/api/admin/deliveries/assign', authenticateAdmin, (req: Request, res: Response) => {
  const { orderId, driverName, driverPhone, vehicleNumber } = req.body;
  const delivery = Database.assignDelivery(orderId, driverName, driverPhone, vehicleNumber);
  res.status(201).json(delivery);
});

app.patch('/api/admin/deliveries/:id/status', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, proofImage } = req.body;
  const updated = Database.updateDeliveryStatus(id, status, proofImage);
  if (!updated) return res.status(404).json({ message: 'Delivery not found' });
  res.json(updated);
});

app.put('/api/admin/deliveries/:id', authenticateAdmin, (req: Request, res: Response) => {
  const delivery = Database.updateDelivery(parseInt(req.params.id), req.body);
  if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
  res.json(delivery);
});

app.delete('/api/admin/deliveries/:id', authenticateAdmin, (req: Request, res: Response) => {
  const ok = Database.deleteDelivery(parseInt(req.params.id));
  if (!ok) return res.status(404).json({ message: 'Delivery not found' });
  res.json({ success: true });
});

// Admin Commissions Ledger
app.get('/api/admin/commissions', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getCommissions());
});

// Admin Orders
app.get('/api/admin/orders', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getOrders());
});

app.patch('/api/admin/orders/:id/status', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, paymentStatus } = req.body;
  const updated = Database.updateOrderStatus(id, status, paymentStatus);
  if (!updated) return res.status(404).json({ message: 'Order not found' });
  Logger.info(`🚚 [Admin Order] Updated #${id} Status: ${status}`);
  res.json(updated);
});

app.delete('/api/admin/orders/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const success = Database.deleteOrder(id);
  if (!success) return res.status(404).json({ message: 'Order not found' });
  Logger.info(`🗑️ [Admin Order] Deleted #${id}`);
  res.json({ success: true, message: 'Order deleted successfully' });
});

// Admin Users
app.get('/api/admin/users', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getUsers());
});

app.put('/api/admin/users/:id', authenticateAdmin, (req: Request, res: Response) => {
  const user = Database.updateUser(req.params.id, req.body);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

app.delete('/api/admin/users/:id', authenticateAdmin, (req: Request, res: Response) => {
  const ok = Database.deleteUser(req.params.id);
  if (!ok) return res.status(404).json({ message: 'User not found' });
  res.json({ success: true });
});

app.get('/api/admin/settings', authenticateAdmin, (_req: Request, res: Response) => {
  const settings = Database.getAdminSettings();
  const paymentConfig = Database.getPaymentConfig();
  res.json({
    ...settings,
    sepayWebhookUrl: PaymentService.getSepayWebhookUrl(paymentConfig),
    sepayWebhookConfigured: PaymentService.isSepayWebhookConfigured(paymentConfig),
  });
});

app.put('/api/admin/settings', authenticateAdmin, (req: Request, res: Response) => {
  Database.updateSettings(req.body);
  const settings = Database.getAdminSettings();
  const paymentConfig = Database.getPaymentConfig();
  res.json({
    ...settings,
    sepayWebhookUrl: PaymentService.getSepayWebhookUrl(paymentConfig),
    sepayWebhookConfigured: PaymentService.isSepayWebhookConfigured(paymentConfig),
  });
});

// Admin Dynamic Forms
app.get('/api/admin/forms', authenticateAdmin, (_req: Request, res: Response) => {
  res.json(Database.getDynamicForms());
});

app.post('/api/admin/forms', authenticateAdmin, (req: Request, res: Response) => {
  res.status(201).json(Database.saveDynamicForm(req.body));
});

app.put('/api/admin/forms/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (!Database.getDynamicForm(id)) return res.status(404).json({ message: 'Form not found' });
  res.json(Database.saveDynamicForm(req.body, id));
});

app.delete('/api/admin/forms/:id', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const success = Database.deleteDynamicForm(id);
  if (!success) return res.status(404).json({ message: 'Form not found' });
  res.json({ message: 'Form deleted successfully' });
});

app.get('/api/admin/form-submissions', authenticateAdmin, (_req: Request, res: Response) => {
  res.json(Database.getDynamicFormSubmissions());
});

app.patch('/api/admin/form-submissions/:id/status', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const status = ['new', 'reviewed', 'archived'].includes(req.body?.status) ? req.body.status : 'reviewed';
  const submission = Database.updateDynamicFormSubmissionStatus(id, status);
  if (!submission) return res.status(404).json({ message: 'Submission not found' });
  res.json(submission);
});

// Admin Staff / Personnel
app.get('/api/admin/staff', authenticateAdmin, (req: Request, res: Response) => {
  res.json(Database.getStaffMembers());
});

app.post('/api/admin/staff', authenticateAdmin, (req: Request, res: Response) => {
  try {
    const { name, phone, email, role, status, department, note, id, managerId } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Tên và số điện thoại nhân sự là bắt buộc' });
    }

    const staff = Database.upsertStaffMember({
      id,
      name,
      phone,
      email,
      role,
      status,
      department,
      managerId,
      note,
    });
    res.status(201).json(staff);
  } catch (error) {
    res.status(400).json({ message: 'Không thể lưu nhân sự', error: String(error) });
  }
});

app.patch('/api/admin/staff/:id/status', authenticateAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const status = req.body.status;
  if (status !== 'active' && status !== 'inactive') {
    return res.status(400).json({ message: 'Trạng thái nhân sự không hợp lệ' });
  }

  const staff = Database.updateStaffStatus(id, status);
  if (!staff) return res.status(404).json({ message: 'Không tìm thấy nhân sự' });
  res.json(staff);
});

app.delete('/api/admin/staff/:id', authenticateAdmin, (req: Request, res: Response) => {
  try {
    const ok = Database.deleteStaffMember(parseInt(req.params.id));
    if (!ok) return res.status(404).json({ message: 'Không tìm thấy nhân sự' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Không thể xóa nhân sự' });
  }
});

app.listen(PORT, () => {
  Logger.info(`🚀 Saximi shop Enterprise Backend running on http://localhost:${PORT}`);
});
