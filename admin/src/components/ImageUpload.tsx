import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../api';

export function ImageUpload({ onUploaded, multiple = false, label = 'Tải ảnh từ máy tính', onBusyChange, onBeforeSelect }: {
  onUploaded: (url: string) => void;
  multiple?: boolean; label?: string;
  onBusyChange?: (busy: boolean) => void;
  onBeforeSelect?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return <div className="space-y-1.5">
    <label className="relative inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-cyan-200 focus-within:ring-2 focus-within:ring-cyan-400">
      <Upload size={17} />{busy ? 'Đang tải ảnh…' : label}
      <input type="file" aria-label={label} accept="image/jpeg,image/png,image/webp" multiple={multiple} disabled={busy} className="absolute inset-0 w-full cursor-pointer opacity-0" onClick={onBeforeSelect} onChange={async e => {
        const files = Array.from(e.currentTarget.files || []); e.currentTarget.value = '';
        if (!files.length || busy) return;
        if (files.length > 12) { setError('Mỗi lần chọn tối đa 12 ảnh.'); return; }
        setBusy(true); setError(''); onBusyChange?.(true);
        const failures: string[] = [];
        try {
          for (const file of files) {
            if (!mounted.current) break;
            try {
              if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Chọn ảnh JPG, PNG, WebP tối đa 5 MB.');
              const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Không đọc được ảnh.')); reader.readAsDataURL(file);
              });
              const result = await api.uploadImage(data, file.name);
              if (mounted.current) onUploaded(result.url);
            } catch (err) { failures.push(`${file.name}: ${(err as Error).message}`); }
          }
          if (mounted.current) setError(failures.join(' '));
        } finally { if (mounted.current) setBusy(false); onBusyChange?.(false); }
      }} />
    </label>
    {error && <p role="alert" className="text-xs text-rose-300 break-words">{error}</p>}
  </div>;
}
