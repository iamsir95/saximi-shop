import express, { Express, RequestHandler } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export function mountUploads(app: Express, auth: RequestHandler, register: (url: string, title: string) => void, directory = path.join(__dirname, '../data/uploads')) {
  app.use(['/uploads', '/api/uploads'], express.static(directory, { maxAge: '1y', immutable: true, dotfiles: 'deny', setHeaders: res => { res.setHeader('X-Content-Type-Options', 'nosniff'); } }));
  app.post('/api/admin/uploads', auth, async (req, res) => {
    if ((req as any).admin?.role !== 'SUPER_ADMIN') return res.status(403).json({ message: 'Bạn không có quyền tải ảnh lên.' });
    const data = req.body?.data;
    if (typeof data !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(data)) return res.status(400).json({ message: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' });
    const bytes = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    if (bytes.length > 5 * 1024 * 1024) return res.status(413).json({ message: 'Ảnh tối đa 5 MB.' });
    let output: Buffer;
    try {
      const source = sharp(bytes, { limitInputPixels: 40000000, failOn: 'warning' });
      const meta = await source.metadata();
      if (!['jpeg', 'png', 'webp'].includes(meta.format || '') || (meta.pages || 1) > 1) throw new Error('Unsupported');
      output = await source.rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } catch { return res.status(400).json({ message: 'Ảnh không hợp lệ, là ảnh động hoặc có độ phân giải quá lớn.' }); }
    const name = `${randomUUID()}.webp`;
    const file = path.join(directory, name);
    const url = `/api/uploads/${name}`;
    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(file, output, { flag: 'wx' });
      register(url, String(req.body.name || 'Ảnh tải lên').slice(0, 180));
      return res.status(201).json({ url });
    } catch {
      await fs.unlink(file).catch(() => {});
      return res.status(500).json({ message: 'Chưa lưu được ảnh lên máy chủ. Vui lòng thử lại.' });
    }
  });
}
