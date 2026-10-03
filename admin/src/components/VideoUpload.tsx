import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { api } from '../api';

export function VideoUpload({ value, onChange, onBusyChange }: {
  value: string;
  onChange: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const setUploadBusy = (next: boolean) => {
    setBusy(next);
    onBusyChange?.(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-indigo-200 focus-within:ring-2 focus-within:ring-indigo-400">
          <Upload size={17} />
          {busy ? 'Đang tải video...' : 'Tải video từ máy tính'}
          <input
            type="file"
            aria-label="Tải video từ máy tính"
            accept="video/mp4,video/webm,video/quicktime"
            disabled={busy}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (!file || busy) return;
              if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
                setError('Chọn video MP4, WebM hoặc MOV.');
                return;
              }
              if (file.size > 60 * 1024 * 1024) {
                setError('Video tối đa 60 MB.');
                return;
              }
              setUploadBusy(true);
              setError('');
              try {
                const data = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result));
                  reader.onerror = () => reject(new Error('Không đọc được video.'));
                  reader.readAsDataURL(file);
                });
                const result = await api.uploadMedia(data, file.name);
                if (mounted.current) onChange(result.url);
              } catch (err) {
                if (mounted.current) setError((err as Error).message);
              } finally {
                if (mounted.current) setUploadBusy(false);
              }
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange('')}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-semibold text-rose-200 disabled:opacity-50"
          >
            <X size={16} />
            Xóa video
          </button>
        )}
      </div>
      {value && (
        <video
          src={value}
          controls
          playsInline
          preload="metadata"
          className="max-h-64 w-full rounded-xl border border-slate-700 bg-black object-contain"
        />
      )}
      {error && <p role="alert" className="text-xs text-rose-300 break-words">{error}</p>}
      <p className="text-xs leading-5 text-slate-500">Hỗ trợ MP4, WebM, MOV. Dung lượng tối đa 60 MB.</p>
    </div>
  );
}
