import { Link } from 'react-router-dom';
import { SECTIONS } from '../data/pages.js';

const Sidebar = ({ currentPath, open, onClose }) => (
  <>
    {open && (
      <div
        className="fixed inset-0 z-30 bg-ink/40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
    )}

    <aside
      className={`scrollarea fixed left-0 top-14 z-40 h-[calc(100vh-56px)] w-64 overflow-y-auto border-r border-border bg-bg-soft px-4 py-6 transition-transform md:sticky md:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <nav className="flex flex-col gap-7">
        {SECTIONS.map((section, idx) => (
          <div key={section.title || `section-${idx}`}>
            {section.title && (
              <div className="mb-2 px-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-dim">
                {section.title}
              </div>
            )}
            <ul className="flex flex-col gap-[2px]">
              {section.pages.map((p) => {
                const active = p.path === currentPath;
                return (
                  <li key={p.path}>
                    <Link
                      to={p.path}
                      onClick={onClose}
                      className={`block rounded-md px-3 py-[7px] text-[13.5px] font-medium transition-colors ${
                        active
                          ? 'bg-accent-soft text-accent-deep'
                          : 'text-ink-soft hover:bg-bg hover:text-ink'
                      }`}
                    >
                      {p.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  </>
);

export default Sidebar;
