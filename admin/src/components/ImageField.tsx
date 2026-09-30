import { ReactNode, useId, useRef, useState } from 'react';
import { Images, Link, Upload, X } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

export function ImageField({ label, value, onChange, multiple = false, onBusyChange, library }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiple?: boolean;
  onBusyChange?: (busy: boolean) => void;
  library?: ReactNode;
}) {
  const id = useId();
  const [mode, setMode] = useState('upload');
  const [busy, setBusy] = useState(false);
  const currentValue = useRef(value);
  currentValue.current = value;
  const urls = value.split('\n').map(url => url.trim()).filter(Boolean);
  const inputClass = 'w-full min-w-0 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400';
  return <div className="min-w-0 space-y-2" role="group" aria-labelledby={id}>
    <div className="space-y-2">
      <span id={id} className="text-xs font-semibold text-slate-400">{label}</span>
      <div className={`grid gap-1 ${library ? 'grid-cols-3' : 'grid-cols-2'}`} aria-label={`Nguồn ${label.toLowerCase()}`}>
        {[
          { key: 'upload', text: 'Tải ảnh lên', Icon: Upload },
          { key: 'url', text: 'Dùng URL', Icon: Link },
          ...(library ? [{ key: 'library', text: 'Kho ảnh', Icon: Images }] : []),
        ].map(({ key, text, Icon }) => <button key={key} type="button" disabled={busy} aria-pressed={mode === key} onClick={() => setMode(key)} className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-lg px-1 text-xs font-medium disabled:opacity-50 ${mode === key ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-400 hover:bg-slate-800'}`}><Icon size={14} className="shrink-0" />{text}</button>)}
      </div>
    </div>
    {mode === 'upload' && <ImageUpload multiple={multiple} label={multiple ? 'Chọn ảnh từ máy tính' : 'Chọn ảnh'} onBusyChange={next => { setBusy(next); onBusyChange?.(next); }} onUploaded={url => {
      currentValue.current = multiple ? [currentValue.current.trim(), url].filter(Boolean).join('\n') : url;
      onChange(currentValue.current);
    }} />}
    {mode === 'url' && (multiple
      ? <textarea aria-label={`${label} - URL`} rows={3} value={value} onChange={e => onChange(e.target.value)} className={inputClass} placeholder="Mỗi dòng một URL ảnh" />
      : <input aria-label={`${label} - URL`} type="text" maxLength={2000} value={value} onChange={e => onChange(e.target.value)} className={inputClass} placeholder="https://..." />)}
    {mode === 'library' && library}
    {urls.length > 0 && <div className="flex flex-wrap gap-2">
      {urls.map((url, index) => <div key={`${index}-${url}`} className="relative h-20 w-20 shrink-0">
        <img src={url} alt={`${label} ${index + 1}`} className="h-full w-full rounded-lg border border-slate-700 object-contain" />
        <button type="button" disabled={busy} title={`Xóa ${label.toLowerCase()} ${index + 1}`} aria-label={`Xóa ${label.toLowerCase()} ${index + 1}`} onClick={() => onChange(urls.filter((_, i) => i !== index).join('\n'))} className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900/90 text-white disabled:opacity-50"><X size={15} /></button>
      </div>)}
    </div>}
  </div>;
}
