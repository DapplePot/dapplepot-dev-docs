import { Link } from 'react-router-dom';
import CodeBlock from '../components/CodeBlock.jsx';
import Note      from '../components/Note.jsx';
import apiReference from '../data/apiReference.generated.json';
import Xref      from '../components/Xref.jsx';

const { python, extras } = apiReference.requirements;

const QUICKSTARTS = [
  { label: 'Anthropic', path: '/sdk/agent-frameworks/anthropic', desc: 'Direct Anthropic SDK usage' },
  { label: 'OpenAI', path: '/sdk/agent-frameworks/openai', desc: 'Direct OpenAI SDK usage' },
  { label: 'LangChain', path: '/sdk/agent-frameworks/langchain', desc: 'Callback-based integration' },
  { label: 'LangGraph', path: '/sdk/agent-frameworks/langgraph', desc: 'Callback-based integration' },
];

const QuickstartCard = ({ label, path, desc }) => (
  <Link
    to={path}
    className="flex flex-col gap-1 rounded-lg border border-border p-4 no-underline transition-colors hover:border-accent hover:bg-accent-soft/30"
  >
    <span className="text-[14.5px] font-semibold text-ink">{label}</span>
    <span className="text-[13px] text-muted">{desc}</span>
  </Link>
);

const IntroPage = () => (
  <>
    <span className="eyebrow">Getting Started</span>
    <h1>DapplePot Python SDK</h1>
    <p className="lede">
      Runtime security, session replay, and real-time threat detection for AI
      agents — in a few lines of code. Drop-in integrations for Anthropic,
      OpenAI, LangChain, and LangGraph.
    </p>

    <h2 id="quickstart">Quickstart</h2>
    <p>Pick your framework to jump straight to its setup guide.</p>
    <div className="my-5 grid grid-cols-2 gap-3 max-md:grid-cols-1">
      {QUICKSTARTS.map((q) => <QuickstartCard key={q.path} {...q} />)}
    </div>
    <p>
      Not yet supported: OpenAI Responses/Assistants/Agents API, Anthropic via
      Bedrock/Vertex, other providers, and other agent frameworks — see the{' '}
      <Link to="/sdk/help/faq#unsupported-providers">FAQ</Link> for the full list.
    </p>

    <h2 id="overview">Overview</h2>
    <p>
      The SDK instruments your agent and forwards structured events to the
      DapplePot ingest API. Twelve security sub-checks run synchronously on
      every event — prompt injection, data leakage, excessive agency, and
      more. Each finding fires immediately, and configurable per-check
      actions can sanitize content, block the call, or terminate the session.
    </p>

    <ul>
      <li>One event model across all integrations</li>
      <li>Automatic tool tracking — no manual <code>tool_start</code> / <code>tool_end</code> calls</li>
      <li>Inline security checks with under-a-millisecond overhead per event</li>
      <li>Optional <Xref>dp.node()</Xref> for developer-declared trace structure</li>
      <li>Pluggable PII scrubbing and key redaction</li>
    </ul>

    <Note tone="info" title="How instrumentation works">
      <Xref>dp.instrument_anthropic()</Xref> / <Xref>dp.instrument_openai()</Xref>{' '}
      patch the vendor package once, globally, for the whole process — not
      per-client-instance. Call it right after constructing{' '}
      <Xref>DapplePot</Xref> and before creating your Anthropic/OpenAI client.{' '}
      <Xref>dp.callback_handler()</Xref> works differently — it doesn't patch
      anything; it returns an object you pass into LangChain/LangGraph's own
      callback system, one per logical session.
    </Note>

    <h2 id="install">Install</h2>
    <p>Install with the extras for the framework you use.</p>

    <CodeBlock language="bash">{`pip install dapplepot-sdk

pip install "dapplepot-sdk[anthropic]"    # Anthropic
pip install "dapplepot-sdk[openai]"       # OpenAI
pip install "dapplepot-sdk[langchain]"    # LangChain / LangGraph
pip install "dapplepot-sdk[all]"          # Everything`}</CodeBlock>

    <h2 id="thirty-second">30-second example</h2>
    <p>
      Get credentials from the{' '}
      <a href="https://app.dapplepot.com" target="_blank" rel="noopener noreferrer">dashboard</a>,
      then add three lines to your agent.
      This is the full minimal Anthropic setup — the same shape works for
      every framework.
    </p>

    <CodeBlock language="python">{`import anthropic
from dapplepot_sdk import DapplePot

dp = DapplePot(
    sdk_key  = "dp_sk_...",
    agent_id = "your-agent-id",
)
dp.instrument_anthropic()

with dp.session(user_context_id="user_123"):
    response = anthropic.Anthropic().messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello!"}],
    )`}</CodeBlock>

    <Note tone="info" title="Credentials">
      Grab <code>sdk_key</code> and <code>agent_id</code> from the{' '}
      <a href="https://app.dapplepot.com" target="_blank" rel="noopener noreferrer">DapplePot dashboard</a>.
      Each framework page in this guide assumes you already have
      them — see the <Link to="/sdk/reference/api">API Reference</Link> for every
      constructor option.
    </Note>

    <h2 id="compatibility">Requirements &amp; compatibility</h2>
    <table>
      <tbody>
        <tr><td>Python</td><td><code>{python}</code></td></tr>
        {Object.entries(extras).map(([extra, reqs]) => (
          <tr key={extra}>
            <td>{extra}</td>
            <td>{reqs.map((r) => <code key={r} style={{ marginRight: 8 }}>{r}</code>)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
);

IntroPage.headings = [
  { id: 'quickstart',     label: 'Quickstart' },
  { id: 'overview',       label: 'Overview' },
  { id: 'install',        label: 'Install' },
  { id: 'thirty-second',  label: '30-second example' },
  { id: 'compatibility',  label: 'Requirements & compatibility' },
];

export default IntroPage;
