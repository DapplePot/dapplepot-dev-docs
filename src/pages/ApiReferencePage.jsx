import CodeBlock from '../components/CodeBlock.jsx';
import Note from '../components/Note.jsx';
import apiReference from '../data/apiReference.generated.json';

const slug = (moduleName, className) =>
  `${moduleName.replace(/\./g, '-')}-${className}`.toLowerCase();

const MethodCard = ({ method }) => {
  const { docstring: doc } = method;
  return (
    <div className="my-5 rounded-lg border border-border p-4">
      <CodeBlock language="python">{`${method.signature}`}</CodeBlock>

      {doc.summary && <p className="font-medium text-ink">{doc.summary}</p>}
      {doc.description && (
        <p className="whitespace-pre-line text-ink-soft">{doc.description}</p>
      )}

      {doc.args.length > 0 && (
        <>
          <div className="mt-3 mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-dim">
            Args
          </div>
          <table className="w-full text-[13.5px]">
            <tbody>
              {doc.args.map((a) => (
                <tr key={a.name} className="border-t border-border-soft">
                  <td className="py-1.5 pr-3 align-top font-mono text-accent-deep">{a.name}</td>
                  {a.type && (
                    <td className="py-1.5 pr-3 align-top font-mono text-dim">{a.type}</td>
                  )}
                  <td className="py-1.5 align-top text-ink-soft">{a.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {doc.returns && (
        <>
          <div className="mt-3 mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-dim">
            Returns
          </div>
          <p className="text-ink-soft">{doc.returns.description}</p>
        </>
      )}

      {doc.raises.length > 0 && (
        <>
          <div className="mt-3 mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-dim">
            Raises
          </div>
          {doc.raises.map((r, i) => (
            <p key={i} className="text-ink-soft">
              <span className="font-mono text-accent-deep">{r.type}</span> — {r.description}
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

const ClassSection = ({ moduleName, cls }) => (
  <>
    <h2 id={slug(moduleName, cls.name)}>{cls.name}</h2>
    {cls.docstring.summary && <p className="lede">{cls.docstring.summary}</p>}
    {cls.docstring.description && (
      <p className="whitespace-pre-line">{cls.docstring.description}</p>
    )}
    {cls.methods.map((m) => (
      <MethodCard key={m.name} method={m} />
    ))}
  </>
);

const ApiReferencePage = () => (
  <>
    <span className="eyebrow">Reference</span>
    <h1>API Reference</h1>
    <p className="lede">
      Generated directly from the SDK's own docstrings — every signature and
      description below is exactly what ships in{' '}
      <code>dapplepot-sdk v{apiReference.sdk_version}</code>. If a code
      example elsewhere in these docs ever disagrees with this page, this
      page is right.
    </p>

    <Note tone="info" title={`Synced with dapplepot-sdk v${apiReference.sdk_version}`}>
      Generated {new Date(apiReference.generated_at).toLocaleString()}. See{' '}
      <code>sdk-version.json</code> in this repo to bump the pinned version.
    </Note>

    {apiReference.modules.map((mod) => (
      <div key={mod.name}>
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
