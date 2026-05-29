import { useEffect, useState } from 'react';

/**
 * Right-rail "On this page" table of contents.
 * `headings` is the list to render — supplied by each page.
 *   [{ id: 'install', label: 'Install' }, ...]
 *
 * Active heading is computed by IntersectionObserver — the section whose
 * top has crossed the trigger band is highlighted.
 */
const OnThisPage = ({ headings = [] }) => {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    setActive(headings[0]?.id);
    if (headings.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to the top of the trigger band.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 },
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [headings]);

  if (headings.length === 0) return <div className="hidden xl:block" />;

  return (
    <aside className="sticky top-[88px] hidden h-fit max-h-[calc(100vh-100px)] overflow-y-auto pl-6 xl:block scrollarea">
      <div className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-dim">
        On this page
      </div>
      <ul className="flex flex-col gap-[2px] border-l border-border-soft">
        {headings.map((h) => {
          const isActive = h.id === active;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`-ml-px block border-l py-[5px] pl-3.5 text-[12.5px] leading-snug transition-colors ${
                  isActive
                    ? 'border-l-accent text-accent-deep'
                    : 'border-l-transparent text-muted hover:text-ink'
                }`}
              >
                {h.label}
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default OnThisPage;
