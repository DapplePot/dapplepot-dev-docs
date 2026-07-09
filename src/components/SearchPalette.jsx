import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FLAT_PAGES } from '../data/pages.js';

/* Flat, in-memory search index — page titles + each page's headings.
   No backend, no build step: built once from data already in pages.js. */
const buildIndex = () =>
  FLAT_PAGES.flatMap((page) => {
    const headings = page.component.headings || [];
    return [
      { label: page.label, path: page.path, section: null },
      ...headings.map((h) => ({ label: h.label, path: `${page.path}#${h.id}`, section: page.label })),
    ];
  });

const SearchPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const index = useMemo(buildIndex, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.slice(0, 8);
    return index.filter((r) => r.label.toLowerCase().includes(q)).slice(0, 20);
  }, [query, index]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => setActiveIdx(0), [query]);

  const go = (result) => {
    if (!result) return;
    navigate(result.path);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[activeIdx]);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-40 items-center gap-2 rounded-md border border-border bg-bg-soft px-2.5 py-1.5 text-[13px] text-muted hover:text-ink sm:w-64"
        aria-label="Search docs"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-auto hidden rounded border border-border bg-bg px-1.5 font-mono text-[10.5px] sm:inline">⌘K</kbd>
      </button>

      {open && createPortal(
        // Portaled straight to <body> — TopBar has `backdrop-blur-md`
        // (backdrop-filter), which establishes a new containing block for
        // any `position: fixed` descendant (same rule as `transform`/
        // `filter`). Rendered inside TopBar's subtree, this overlay's
        // `fixed inset-0` would size against TopBar's own 56px header box
        // instead of the viewport. Portaling out of that subtree avoids it
        // regardless of what CSS TopBar (or any other ancestor) ever gets.
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-ink/10 pt-[15vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[560px] overflow-hidden rounded-xl border border-border bg-bg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search pages and headings…"
              className="w-full border-b border-border bg-transparent px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-dim"
            />
            <div className="scrollarea max-h-[360px] overflow-y-auto py-2">
              {results.length === 0 && (
                <div className="px-4 py-6 text-center text-[13.5px] text-muted">No results</div>
              )}
              {results.map((r, i) => (
                <button
                  key={r.path}
                  onClick={() => go(r)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-[13.5px] ${
                    i === activeIdx ? 'bg-accent-soft text-accent-deep' : 'text-ink-soft'
                  }`}
                >
                  <span>{r.label}</span>
                  {r.section && <span className="font-mono text-[11px] text-dim">{r.section}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SearchPalette;
