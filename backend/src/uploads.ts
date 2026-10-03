import express, { Express, RequestHandler } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

const videoTypes: Record<string, { ext: string; label: string }> = {
  'video/mp4': { ext: 'mp4', label: 'MP4' },
  'video/webm': { ext: 'webm', label: 'WebM' },
  'video/quicktime': { ext: 'mov', label: 'MOV' },
};

export function mountUploads(app: Express, auth: RequestHandler, register: (url: string, title: string) => void, directory = path.join(__dirname, '../data/uploads')) {
  app.use(['/uploads', '/api/uploads'], express.static(directory, { maxAge: '1y', immutable: true, dotfiles: 'deny', setHeaders: res => { res.setHeader('X-Content-Type-Options', 'nosniff'); } }));
  app.post('/api/admin/uploads', auth, async (req, res) => {
    if ((req as any).admin?.role !== 'SUPER_ADMIN') return res.status(403).json({ message: 'Bạn không có quyền tải media lên.' });
    const data = req.body?.data;
    const title = String(req.body.name || 'Media tải lên').slice(0, 180);
    if (typeof data !== 'string') return res.status(400).json({ message: 'Dữ liệu tải lên không hợp lệ.' });

    const videoMatch = data.match(/^data:(video\/(?:mp4|webm|quicktime));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (videoMatch) {
      const type = videoTypes[videoMatch[1]];
      if (!type) return res.status(400).json({ message: 'Chỉ hỗ trợ video MP4, WebM hoặc MOV.' });
      const bytes = Buffer.from(videoMatch[2], 'base64');
      if (bytes.length > 60 * 1024 * 1024) return res.status(413).json({ message: 'Video tối đa 60 MB.' });
      const name = `${randomUUID()}.${type.ext}`;
      const file = path.join(directory, name);
      const url = `/api/uploads/${name}`;
      try {
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(file, bytes, { flag: 'wx' });
        register(url, title || `Video ${type.label}`);
        return res.status(201).json({ url, type: videoMatch[1] });
      } catch {
        await fs.unlink(file).catch(() => {});
        return res.status(500).json({ message: 'Chưa lưu được video lên máy chủ. Vui lòng thử lại.' });
      }
    }

    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(data)) return res.status(400).json({ message: 'Chỉ hỗ trợ ảnh JPG, PNG, WebP hoặc video MP4/WebM/MOV.' });
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
      register(url, title || 'Ảnh tải lên');
      return res.status(201).json({ url });
    } catch {
      await fs.unlink(file).catch(() => {});
      return res.status(500).json({ message: 'Chưa lưu được ảnh lên máy chủ. Vui lòng thử lại.' });
    }
  });
}
