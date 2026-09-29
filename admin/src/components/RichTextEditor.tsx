import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Table2,
  Underline,
  Undo2,
} from 'lucide-react';

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

const BLOCKED_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'meta', 'link'];

export function cleanRichText(value: string) {
  if (!value) return '';
  const template = document.createElement('template');
  template.innerHTML = value;

  template.content.querySelectorAll(BLOCKED_TAGS.join(',')).forEach((node) => node.remove());
  template.content.querySelectorAll<HTMLElement>('*').forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const rawValue = attr.value.trim().toLowerCase();

      if (name.startsWith('on')) {
        node.removeAttribute(attr.name);
        return;
      }

      if (['href', 'src'].includes(name) && rawValue.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    });
  });

  return template.innerHTML.trim();
}

const toolbarButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 transition-colors hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-cyan-200';

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 240,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'visual' | 'html'>('visual');

  useEffect(() => {
    if (mode !== 'visual' || !editorRef.current) return;
    const current = editorRef.current.innerHTML;
    if (current !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [mode, value]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const syncValue = () => {
    onChange(cleanRichText(editorRef.current?.innerHTML || ''));
  };

  const runCommand = (command: string, commandValue?: string) => {
    focusEditor();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const setBlock = (tag: string) => {
    runCommand('formatBlock', tag);
  };

  const insertLink = () => {
    const url = window.prompt('Nhập đường dẫn liên kết');
    if (!url) return;
    runCommand('createLink', url);
  };

  const insertImage = () => {
    const url = window.prompt('Nhập URL hình ảnh');
    if (!url) return;
    runCommand('insertImage', url);
  };

  const insertTable = () => {
    const rows = Math.min(Math.max(Number(window.prompt('Số dòng', '2')) || 2, 1), 8);
    const cols = Math.min(Math.max(Number(window.prompt('Số cột', '2')) || 2, 1), 6);
    const cells = Array.from({ length: rows })
      .map(() => `<tr>${Array.from({ length: cols }).map(() => '<td>Nội dung</td>').join('')}</tr>`)
      .join('');
    runCommand(
      'insertHTML',
      `<table><tbody>${cells}</tbody></table><p><br></p>`
    );
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    const plain = document.createElement('div');
    plain.textContent = text;
    runCommand('insertHTML', html ? cleanRichText(html) : plain.innerHTML.replace(/\n/g, '<br>'));
  };

  const handleHtmlChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(cleanRichText(event.target.value));
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="block text-xs font-semibold text-slate-400">{label}</label>
        <button
          type="button"
          onClick={() => setMode((current) => (current === 'visual' ? 'html' : 'visual'))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200"
        >
          <Code2 className="h-3.5 w-3.5" />
          {mode === 'visual' ? 'HTML' : 'Soạn thảo'}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/80">
        <div className="flex flex-wrap gap-1.5 border-b border-slate-800 bg-slate-900/95 p-2" onMouseDown={event => event.preventDefault()}>
          <button type="button" title="Đoạn văn" className={toolbarButtonClass} onClick={() => setBlock('p')}>
            <Pilcrow className="h-4 w-4" />
          </button>
          <button type="button" title="Heading 1" className={toolbarButtonClass} onClick={() => setBlock('h2')}>
            <Heading1 className="h-4 w-4" />
          </button>
          <button type="button" title="Heading 2" className={toolbarButtonClass} onClick={() => setBlock('h3')}>
            <Heading2 className="h-4 w-4" />
          </button>
          <button type="button" title="In đậm" className={toolbarButtonClass} onClick={() => runCommand('bold')}>
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" title="In nghiêng" className={toolbarButtonClass} onClick={() => runCommand('italic')}>
            <Italic className="h-4 w-4" />
          </button>
          <button type="button" title="Gạch chân" className={toolbarButtonClass} onClick={() => runCommand('underline')}>
            <Underline className="h-4 w-4" />
          </button>
          <button type="button" title="Danh sách" className={toolbarButtonClass} onClick={() => runCommand('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </button>
          <button type="button" title="Danh sách số" className={toolbarButtonClass} onClick={() => runCommand('insertOrderedList')}>
            <ListOrdered className="h-4 w-4" />
          </button>
          <button type="button" title="Trích dẫn" className={toolbarButtonClass} onClick={() => setBlock('blockquote')}>
            <Quote className="h-4 w-4" />
          </button>
          <button type="button" title="Căn trái" className={toolbarButtonClass} onClick={() => runCommand('justifyLeft')}>
            <AlignLeft className="h-4 w-4" />
          </button>
          <button type="button" title="Căn giữa" className={toolbarButtonClass} onClick={() => runCommand('justifyCenter')}>
            <AlignCenter className="h-4 w-4" />
          </button>
          <button type="button" title="Căn phải" className={toolbarButtonClass} onClick={() => runCommand('justifyRight')}>
            <AlignRight className="h-4 w-4" />
          </button>
          <button type="button" title="Chèn link" className={toolbarButtonClass} onClick={insertLink}>
            <Link className="h-4 w-4" />
          </button>
          <button type="button" title="Chèn ảnh" className={toolbarButtonClass} onClick={insertImage}>
            <Image className="h-4 w-4" />
          </button>
          <button type="button" title="Chèn bảng" className={toolbarButtonClass} onClick={insertTable}>
            <Table2 className="h-4 w-4" />
          </button>
          <button type="button" title="Hoàn tác" className={toolbarButtonClass} onClick={() => runCommand('undo')}>
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" title="Làm lại" className={toolbarButtonClass} onClick={() => runCommand('redo')}>
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {mode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            role="textbox"
            aria-label={label}
            aria-multiline="true"
            onInput={syncValue}
            onPaste={handlePaste}
            className="rich-text-editor min-h-[220px] w-full overflow-y-auto bg-slate-800 px-4 py-3 text-sm leading-7 text-white outline-none"
            style={{ minHeight }}
            data-placeholder={placeholder}
            suppressContentEditableWarning
          />
        ) : (
          <textarea
            value={value}
            onChange={handleHtmlChange}
            className="min-h-[220px] w-full resize-y bg-slate-800 px-4 py-3 font-mono text-xs leading-6 text-white outline-none"
            style={{ minHeight }}
            placeholder="<h2>Tiêu đề</h2><p>Nội dung...</p>"
          />
        )}
      </div>
    </div>
  );
};
