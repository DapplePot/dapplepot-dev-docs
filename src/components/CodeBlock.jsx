import { useState } from 'react';

/* Lightweight syntax highlighter — Python + bash. */

const PY_KEYWORDS = new Set([
  'def', 'class', 'import', 'from', 'as', 'with', 'return', 'if', 'elif', 'else',
  'try', 'except', 'finally', 'raise', 'for', 'while', 'in', 'not', 'and', 'or',
  'True', 'False', 'None', 'pass', 'lambda', 'yield', 'async', 'await', 'global',
  'nonlocal', 'is',
]);

const PY_BUILTINS = new Set([
  'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple',
  'bool', 'open', 'isinstance', 'getattr', 'setattr', 'hasattr', 'type', 'super',
  'self',
]);

const tokenisePython = (src) => {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];

    if (ch === '#') {
      let j = i;
      while (j < src.length && src[j] !== '\n') j++;
      out.push({ type: 'comment', value: src.slice(i, j) });
      i = j;
      continue;
    }
    if ((ch === '"' || ch === "'") && src.slice(i, i + 3) === ch.repeat(3)) {
      const q = ch.repeat(3);
      const end = src.indexOf(q, i + 3);
      const stop = end === -1 ? src.length : end + 3;
      out.push({ type: 'string', value: src.slice(i, stop) });
      i = stop;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== ch) {
        if (src[j] === '\\') j++;
        j++;
      }
      out.push({ type: 'string', value: src.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    if (ch === '@' && /[a-zA-Z_]/.test(src[i + 1] || '')) {
      let j = i + 1;
      while (j < src.length && /[a-zA-Z0-9_.]/.test(src[j])) j++;
      out.push({ type: 'decorator', value: src.slice(i, j) });
      i = j;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9._]/.test(src[j])) j++;
      out.push({ type: 'number', value: src.slice(i, j) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      if (PY_KEYWORDS.has(word))      out.push({ type: 'keyword', value: word });
      else if (PY_BUILTINS.has(word)) out.push({ type: 'builtin', value: word });
      else                            out.push({ type: 'ident', value: word });
      i = j;
      continue;
    }
    out.push({ type: 'text', value: ch });
    i++;
  }
  return out;
};

const tokeniseBash = (src) => {
  const lines = src.split('\n');
  return lines.flatMap((line, idx) => {
    const parts = [];
    if (line.trimStart().startsWith('#')) {
      parts.push({ type: 'comment', value: line });
    } else {
      const m = line.match(/^(\s*)([a-zA-Z][a-zA-Z0-9_-]*)/);
      if (m) {
        parts.push({ type: 'text',    value: m[1] });
        parts.push({ type: 'command', value: m[2] });
        parts.push({ type: 'text',    value: line.slice(m[0].length) });
      } else {
        parts.push({ type: 'text', value: line });
      }
    }
    if (idx < lines.length - 1) parts.push({ type: 'text', value: '\n' });
    return parts;
  });
};

const renderTokens = (tokens) =>
  tokens.map((t, idx) => {
    if (t.type === 'text') return t.value;
    return <span key={idx} className={`tok tok-${t.type}`}>{t.value}</span>;
  });

const CodeBlock = ({ language = 'python', filename, children }) => {
  const [copied, setCopied] = useState(false);
  const code = typeof children === 'string' ? children : '';
  const tokens = language === 'bash' ? tokeniseBash(code) : tokenisePython(code);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div className="codeblock my-5 overflow-hidden rounded-lg border border-border bg-bg-code">
      <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#7d8590]">
            {language}
          </span>
          {filename && (
            <span className="font-mono text-[11.5px] text-[#9d9eaa]">{filename}</span>
          )}
        </div>
        <button
          onClick={copy}
          aria-label="Copy code"
          className="rounded border border-white/8 bg-white/4 px-2.5 py-1 font-sans text-[11.5px] font-medium text-[#c9d1d9] hover:border-white/15 hover:bg-white/8"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="scrollarea overflow-x-auto px-5 py-4 font-mono text-[12.75px] leading-relaxed text-[#e6edf3]">
        <code>{renderTokens(tokens)}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
