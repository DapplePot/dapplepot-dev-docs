import CodeBlock from '../components/CodeBlock.jsx';
import Note from '../components/Note.jsx';
import apiReference from '../data/apiReference.generated.json';

const slug = (moduleName, className) =>
  `${moduleName.replace(/\./g, '-')}-${className}`.toLowerCase();

// Python docstrings use Sphinx/RST inline markup — ``code`` and
// :class:`dotted.Path` / :meth:`name` cross-reference roles. Convert both
// to plain inline <code> so raw backticks/roles don't leak into the page.
const DOCSTRING_MARKUP_RE = /:(?:class|meth|func|attr|exc):`([^`]+)`|``([^`]+)``/g;

// Summary/description text keeps the source's line-wrapping (PEP 8 wraps
// docstring prose at ~79 chars) — docstring_parser preserves those as literal
// single newlines, indistinguishable from an intentional one-line break.
// Rendered with `whitespace-pre-line`, every wrap became a visible line
// break, chopping one flowing sentence into several short lines. Collapse
// single newlines (mid-paragraph wrap) into a space; keep blank-line gaps
// (an actual paragraph break) as one newline for `whitespace-pre-line` to render.
const normalizeProse = (text) => {
  if (!text) return text;
  return text
    .split(/\n{2,}/)
    .map((para) => para.replace(/\s*\n\s*/g, ' ').trim())
    .join('\n\n');
};

const renderDocText = (text) => {
  if (!text) return text;
  const nodes = [];
  let last = 0;
  let key = 0;
  let m;
  DOCSTRING_MARKUP_RE.lastIndex = 0;
  while ((m = DOCSTRING_MARKUP_RE.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const raw = m[1] ?? m[2];
    const label = m[1] ? raw.split('.').pop() : raw; // trim dotted path on :class:/:meth: refs
    nodes.push(
      <code key={key++} className="rounded bg-accent-soft px-1 py-0.5 font-mono text-[0.9em] text-accent-deep">
        {label}
      </code>
    );
    last = DOCSTRING_MARKUP_RE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

const KIND_BADGES = {
  exception: { label: 'Exception', className: 'bg-warning/10 text-warning' },
  class: { label: 'Class', className: 'bg-accent-soft text-accent-deep' },
};

const isExceptionName = (name) => name.endsWith('Error');

// Which integration guide each method belongs to, if any — shown as a link
// on the method card so the reference and the tutorial content stay
// discoverable from each other.
const METHOD_GUIDES = {
  instrument_anthropic: { label: 'Anthropic guide', path: '/sdk/agent-frameworks/anthropic' },
  instrument_openai: { label: 'OpenAI guide', path: '/sdk/agent-frameworks/openai' },
  callback_handler: { label: 'LangChain / LangGraph guide', path: '/sdk/agent-frameworks/langchain' },
};

// Shared by MethodCard's "Args" and ClassSection's "Attributes" — same
// {name, type, description} shape, just a different section label and
// source (method parameters vs. instance attributes).
const FieldTable = ({ label, fields }) => {
  if (fields.length === 0) return null;
  return (
    <>
      <div className="mt-3 mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-dim">
        {label}
      </div>
      <table className="w-full text-[13.5px]">
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="border-t border-border-soft">
              <td className="py-1.5 pr-3 align-top font-mono text-accent-deep">{f.name}</td>
              {f.type && (
                <td className="py-1.5 pr-3 align-top font-mono text-dim">{f.type}</td>
              )}
              <td className="py-1.5 align-top text-ink-soft">{renderDocText(f.description)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const MethodCard = ({ method, anchorId }) => {
  const { docstring: doc } = method;
  const guide = METHOD_GUIDES[method.name];
  return (
    <div id={anchorId} className="my-5 scroll-mt-6 rounded-lg border border-border p-4">
      <CodeBlock language="python">{`${method.signature}`}</CodeBlock>

      {guide && (
        <a
          href={guide.path}
          className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold text-accent-deep no-underline"
        >
          → {guide.label}
        </a>
      )}

      {doc.summary && <p className="font-medium text-ink">{renderDocText(doc.summary)}</p>}
      {doc.description && (
        <p className="whitespace-pre-line text-ink-soft">{renderDocText(normalizeProse(doc.description))}</p>
      )}

      <FieldTable label="Args" fields={doc.args} />

      {doc.returns && (
        <>
          <div className="mt-3 mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-dim">
            Returns
          </div>
          <p className="text-ink-soft">{renderDocText(doc.returns.description)}</p>
        </>
      )}

      {doc.raises.length > 0 && (
        <>
          <div className="mt-3 mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-dim">
            Raises
          </div>
          {doc.raises.map((r, i) => (
            <p key={i} className="text-ink-soft">
              <span className="font-mono text-accent-deep">{r.type}</span> — {renderDocText(r.description)}
            </p>
          ))}
        </>
      )}

      {doc.examples.map((ex, i) => (
        <CodeBlock key={i} language="python">{ex}</CodeBlock>
      ))}
    </div>
  );
};

const ClassSection = ({ moduleName, cls }) => {
  const badge = KIND_BADGES[isExceptionName(cls.name) ? 'exception' : 'class'];
  return (
    <div className="mt-12 border-t border-border pt-8 first:mt-0 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-center gap-2">
        <h2 id={slug(moduleName, cls.name)} className="!my-0">{cls.name}</h2>
        <span className={`rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      {cls.docstring.summary && <p className="lede">{renderDocText(cls.docstring.summary)}</p>}
      {cls.docstring.description && (
        <p className="whitespace-pre-line">{renderDocText(normalizeProse(cls.docstring.description))}</p>
      )}
      <FieldTable label="Attributes" fields={cls.docstring.attributes ?? []} />
      {cls.methods.map((m) => (
        <MethodCard key={m.name} method={m} anchorId={`${slug(moduleName, cls.name)}-${m.name}`} />
      ))}
    </div>
  );
};

const ApiReferencePage = () => (
  <>
    <span className="eyebrow">Reference</span>
    <h1>API Reference</h1>
    <p className="lede">
      Every signature and description below is generated directly from the{' '}
      <code>dapplepot-sdk v{apiReference.sdk_version}</code> source.
    </p>

    <Note tone="info" title={`Synced with dapplepot-sdk v${apiReference.sdk_version}`}>
      Last generated {new Date(apiReference.generated_at).toLocaleDateString()}.
    </Note>

    {apiReference.modules.map((mod) => (
      <div key={mod.name}>
        <h3 id={mod.name.toLowerCase().replace(/\./g, '-')} className="mt-10 font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-dim first:mt-6">
          {mod.name}
        </h3>
        {mod.classes.map((cls) => (
          <ClassSection key={cls.name} moduleName={mod.name} cls={cls} />
        ))}
      </div>
    ))}
  </>
);

ApiReferencePage.headings = apiReference.modules.flatMap((mod) =>
  mod.classes.map((cls) => ({ id: slug(mod.name, cls.name), label: cls.name }))
);

export default ApiReferencePage;
