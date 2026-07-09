import { Link } from 'react-router-dom';
import { findAdjacent } from '../data/pages.js';

const PrevNext = ({ pathname }) => {
  const { prev, next } = findAdjacent(pathname);

  return (
    <div className="mt-16 grid grid-cols-2 gap-3 border-t border-border-soft pt-8 max-sm:grid-cols-1">
      {prev ? (
        <Link
          to={prev.path}
          className="group no-underline rounded-lg border border-border bg-bg p-4 transition-colors hover:border-accent/40 hover:bg-accent-soft/30"
        >
          <div className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
            ← Previous
          </div>
          <div className="text-[14px] font-semibold text-ink group-hover:text-accent-deep">
            {prev.label}
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={next.path}
          className="group no-underline rounded-lg border border-border bg-bg p-4 text-right transition-colors hover:border-accent/40 hover:bg-accent-soft/30"
        >
          <div className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
            Next →
          </div>
          <div className="text-[14px] font-semibold text-ink group-hover:text-accent-deep">
            {next.label}
          </div>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
};

export default PrevNext;
