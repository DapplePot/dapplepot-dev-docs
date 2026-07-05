import CodeBlock from '../components/CodeBlock.jsx';
import Note      from '../components/Note.jsx';

const IntroPage = () => (
  <>
    <span className="eyebrow">Developer's Guide</span>
    <h1>DapplePot Python SDK</h1>
    <p className="lede">
      Runtime security, session replay, and real-time threat detection for AI
      agents — in a few lines of code. Drop-in integrations for Anthropic,
      OpenAI, LangChain, and LangGraph.
    </p>

    <h2 id="what-it-does">What the SDK does</h2>
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
      <li>Optional <code>dp.node()</code> for developer-declared trace structure</li>
      <li>Pluggable PII scrubbing and key redaction</li>
    </ul>

    <h2 id="install">Install</h2>
    <p>Install with the extras for the framework you use.</p>

    <CodeBlock language="bash">{`pip install dapplepot-sdk

pip install "dapplepot-sdk[anthropic]"    # Anthropic
pip install "dapplepot-sdk[openai]"       # OpenAI
pip install "dapplepot-sdk[langchain]"    # LangChain / LangGraph
pip install "dapplepot-sdk[all]"          # Everything`}</CodeBlock>

    <h2 id="thirty-second">30-second example</h2>
    <p>
      Get credentials from the dashboard, then add three lines to your agent.
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
      Grab <code>sdk_key</code> and <code>agent_id</code> from the DapplePot
      dashboard. Each framework page in this guide assumes you already have
      them — see the <a href="/sdk/reference/api">API Reference</a> for every
      constructor option.
    </Note>

    <h2 id="next">Where next</h2>
    <p>
      Pick the framework you ship on and follow its dedicated guide. Each
      page covers install, init, usage, tool calls, and error events in the
      same order so you can flip between them.
    </p>
  </>
);

IntroPage.headings = [
  { id: 'what-it-does', label: 'What the SDK does' },
  { id: 'install',      label: 'Install' },
  { id: 'thirty-second',label: '30-second example' },
  { id: 'next',         label: 'Where next' },
];

export default IntroPage;
