import logo from '../assets/dapplePotLogo.png';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';

const TopBar = ({ onMenuClick }) => (
  <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-md">
    <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <button
          className="mr-1 -ml-1 hidden h-8 w-8 items-center justify-center rounded-md border border-border bg-bg-soft text-muted hover:text-ink max-md:flex"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <a href="/sdk" className="flex items-center gap-1.5">
          <img src={logo} alt="DapplePot" width="22" height="22" className="rounded-[5px] invert" />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">DapplePot</span>
          <span className="ml-1 hidden rounded border border-border bg-bg-soft px-1.5 py-[1px] font-mono text-[10px] font-medium text-muted md:inline">
            docs
          </span>
        </a>
      </div>

      <nav className="flex items-center gap-1">
        <a
          href="https://github.com/DapplePot/dapplepot-sdk"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-1.5 text-ink-soft hover:bg-bg-soft hover:text-ink"
        >
          <FaGithub size={18} />
        </a>
        <a
          href="https://www.linkedin.com/company/dapplepot/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-1.5 text-ink-soft hover:bg-bg-soft hover:text-ink"
        >
          <FaLinkedin size={18} />
        </a>
        <a
          href="https://x.com/DapplePot"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-1.5 text-ink-soft hover:bg-bg-soft hover:text-ink"
        >
          <FaXTwitter size={18} />
        </a>
      </nav>
    </div>
  </header>
);

export default TopBar;
