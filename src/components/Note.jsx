/**
 * Inline note / callout for the docs prose.
 *   tone: 'info' (default) | 'warn' | 'success'
 */
const TONES = {
  info: {
    border: 'border-accent/25',
    bg:     'bg-accent-soft/40',
    label:  'text-accent-deep',
    icon:   'i',
  },
  warn: {
    border: 'border-warning/35',
    bg:     'bg-warning/8',
    label:  'text-warning',
    icon:   '!',
  },
  success: {
    border: 'border-success/30',
    bg:     'bg-success/8',
    label:  'text-success',
    icon:   '✓',
  },
};

const Note = ({ tone = 'info', title, children }) => {
  const t = TONES[tone] || TONES.info;
  return (
    <div className={`my-5 rounded-lg border ${t.border} ${t.bg} px-4 py-3.5`}>
      {title && (
        <div className={`mb-1 flex items-center gap-2 text-[12.5px] font-semibold ${t.label}`}>
          <span className={`flex h-4 w-4 items-center justify-center rounded-full font-mono text-[11px] font-bold ${t.bg} ring-1 ring-current`}>
            {t.icon}
          </span>
          {title}
        </div>
      )}
      <div className="text-[14px] leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
};

export default Note;
