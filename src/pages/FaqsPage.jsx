import CodeBlock from '../components/CodeBlock.jsx';

const FaqItem = ({ id, q, children }) => (
  <details id={id} className="group my-3 rounded-lg border border-border bg-bg-soft px-4 py-3 [&[open]]:bg-bg [&[open]]:shadow-sm">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-ink">
      <span>{q}</span>
      <span className="font-mono text-[13px] text-muted transition-transform group-open:rotate-180">⌄</span>
    </summary>
    <div className="mt-3 border-t border-border-soft pt-3 text-[14px] leading-relaxed text-ink-soft">
      {children}
    </div>
  </details>
);

const FaqsPage = () => (
  <>
    <span className="eyebrow">Help</span>
    <h1>FAQs</h1>
    <p className="lede">
      Short answers to the questions that come up most often when teams
      first integrate the SDK.
    </p>

    <h2 id="setup">Setup &amp; credentials</h2>

    <FaqItem id="get-credentials" q="Where do I get sdk_key, tenant_id, and agent_id?">
      <p>
        From the DapplePot dashboard. Create a project → create an agent →
        the credentials block appears at the top of the agent page.
      </p>
    </FaqItem>

    <FaqItem id="env-vars" q="Should I put the credentials in environment variables?">
      <p>
        Yes — the SDK has no opinion on how you load them, but{' '}
        <code>os.environ.get("DAPPLEPOT_SDK_KEY")</code> is the recommended
        pattern. Never commit <code>sdk_key</code> to source control.
      </p>
    </FaqItem>

    <FaqItem id="how-many" q="One DapplePot instance per process, or per request?">
      <p>
        One per process. The instance owns a background flush thread and an
        in-memory event buffer — re-creating it per request would create
        thread churn and lose buffered events.
      </p>
    </FaqItem>

    <h2 id="sessions">Sessions &amp; identity</h2>

    <FaqItem id="auto-session-id" q="Do I need to pass session_id to dp.session()?">
      <p>
        No. The SDK generates a fresh session ID for every{' '}
        <code>dp.session()</code> block. The only parameters you optionally
        pass are <code>user_context_id</code> and <code>user_tenant_id</code>.
      </p>
    </FaqItem>

    <FaqItem id="multi-turn-id" q="How do I keep one session across multiple HTTP requests?">
      <p>
        The session lives only inside the <code>with dp.session():</code>{' '}
        block. For multi-request conversations, persist the session ID
        yourself and use the optional <code>session_id</code> kwarg only when
        explicitly continuing — but in most cases each HTTP request is its
        own short session, and continuity comes from{' '}
        <code>user_context_id</code>.
      </p>
    </FaqItem>

    <FaqItem id="no-session" q="What happens if I forget to wrap calls in dp.session()?">
      <p>
        Each patched LLM call becomes its own one-event session — useful for
        quick demos but not what you want in production. Wrap conversations
        in <code>dp.session()</code> so a single conversation = a single
        session.
      </p>
    </FaqItem>

    <h2 id="events">Events &amp; tool tracking</h2>

    <FaqItem id="auto-tools" q="Do I need to call tool_start / tool_end manually?">
      <p>
        No. The Anthropic and OpenAI patchers read tool calls and results
        directly from the wire. For LangChain / LangGraph, the framework's
        own callbacks fire automatically. You never write{' '}
        <code>tool_start</code> / <code>tool_end</code> by hand.
      </p>
    </FaqItem>

    <FaqItem id="tool-error" q="How do I signal a tool failure?">
      <p>
        Set <code>is_error: True</code> on the <code>tool_result</code> (Anthropic)
        or <code>{`{"role": "tool"}`}</code> (OpenAI) message. The SDK emits{' '}
        <code>tool_error</code> instead of <code>tool_end</code>.
      </p>
    </FaqItem>

    <FaqItem id="dp-node" q="When should I use dp.node()?">
      <p>
        For raw Anthropic and OpenAI agents where you want named structure
        in the trace — for example, <code>classify_intent</code>,{' '}
        <code>retrieve_context</code>, <code>generate_response</code>.
        LangChain / LangGraph already emit node events automatically.
      </p>
    </FaqItem>

    <h2 id="errors">Errors</h2>

    <FaqItem id="catch-llm" q="Does catching an LLM error inside dp.session() stop the session?">
      <p>
        No. <code>llm_error</code> fires the moment the LLM call raises. If
        you catch the exception inside the session, the session continues
        and ends with <code>session_end</code>. <code>session_error</code>{' '}
        only fires when the exception escapes <code>dp.session()</code>{' '}
        entirely.
      </p>
    </FaqItem>

    <FaqItem id="blocked-vs-terminated" q="What's the difference between blocked and terminated?">
      <p>
        <code>block_call</code> raises <code>DapplePotBlockedError</code> on
        a single call — the session is still alive and you can recover.{' '}
        <code>terminate_session</code> raises{' '}
        <code>DapplePotSessionTerminatedError</code> and the session ends
        with <code>session_error</code>. Both are configured per-check in
        the dashboard.
      </p>
    </FaqItem>

    <h2 id="security">Security &amp; data</h2>

    <FaqItem id="checks-config" q="How do I change which security checks run?">
      <p>
        In the DapplePot dashboard. The SDK fetches per-check configuration
        at startup. Restart your agent after changing checks — there is no
        live reload.
      </p>
    </FaqItem>

    <FaqItem id="pii" q="How do I scrub PII before events leave my process?">
      <p>Pass a scrubber to the constructor:</p>
      <CodeBlock language="python">{`from dapplepot_sdk import DapplePot
from dapplepot_sdk.scrubbers import RegexScrubber

dp = DapplePot(
    ...,
    pii_scrubber = RegexScrubber(patterns=["email", "ssn", "aws_key"]),
    redact_keys  = ["api_key", "password"],
)`}</CodeBlock>
    </FaqItem>

    <FaqItem id="latency" q="What overhead does the SDK add?">
      <p>
        Synchronous checks add sub-millisecond overhead per event. Network
        flushes happen on a background thread and never block your agent.
        You can tune the flush cadence with <code>flush_interval_ms</code>{' '}
        and <code>flush_batch_size</code>.
      </p>
    </FaqItem>

    <h2 id="other">Other</h2>

    <FaqItem id="upgrade-anthropic" q="Will upgrading the anthropic package break the SDK?">
      <p>
        No — DapplePot patches the standard package in place; it does not
        ship its own copy. Upgrade <code>anthropic</code> freely.
      </p>
    </FaqItem>

    <FaqItem id="shutdown" q="Do I need to call dp.shutdown()?">
      <p>
        Recommended at process exit so the buffer flushes cleanly. In long-
        running web servers, register it as an exit hook (Flask{' '}
        <code>atexit</code>, FastAPI lifespan event, etc.).
      </p>
    </FaqItem>

    <FaqItem id="frameworks" q="Will you support LiteLLM or LlamaIndex?">
      <p>
        Not in the current release. We focus on direct SDK integrations
        (Anthropic, OpenAI) and the dominant agent orchestrators (LangChain,
        LangGraph). LiteLLM's callback architecture only fires after the
        call returns, which makes runtime intervention impossible.
      </p>
    </FaqItem>
  </>
);

FaqsPage.headings = [
  { id: 'setup',    label: 'Setup & credentials' },
  { id: 'sessions', label: 'Sessions & identity' },
  { id: 'events',   label: 'Events & tool tracking' },
  { id: 'errors',   label: 'Errors' },
  { id: 'security', label: 'Security & data' },
  { id: 'other',    label: 'Other' },
];

export default FaqsPage;
