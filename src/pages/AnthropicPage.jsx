import CodeBlock from '../components/CodeBlock.jsx';
import Note      from '../components/Note.jsx';

const AnthropicPage = () => (
  <>
    <span className="eyebrow">Agent framework</span>
    <h1>Anthropic</h1>
    <p className="lede">
      Use the standard <code>anthropic</code> Python package. DapplePot
      patches <code>messages.create()</code> in place and captures every LLM
      and tool event automatically.
    </p>

    <h2 id="initialize">Initialize</h2>
    <p>
      Create one <code>DapplePot</code> instance per process at startup, then
      call <code>dp.instrument_anthropic()</code>. The patch survives until
      process exit.
    </p>

    <CodeBlock language="python">{`import anthropic
from dapplepot_sdk import DapplePot

dp = DapplePot(
    sdk_key    = "dp_sk_...",
    tenant_id  = "your-tenant-id",
    agent_id   = "your-agent-id",
    ingest_url = "https://ingest.dapplepot.com",
)
dp.instrument_anthropic()

client = anthropic.Anthropic(api_key="...")`}</CodeBlock>

    <Note tone="info" title="Standard anthropic package">
      The <code>anthropic</code> package is unmodified — upgrade it freely
      without coordinating with DapplePot releases.
    </Note>

    <h2 id="single-turn">Single-turn usage</h2>
    <p>
      Wrap each conversation in <code>dp.session()</code>. The SDK generates
      a session ID automatically; you only pass identity fields if you have
      them.
    </p>

    <CodeBlock language="python">{`with dp.session(user_context_id="user_123", user_tenant_id="acme_corp"):
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello!"}],
    )`}</CodeBlock>

    <p>This emits four events: <code>session_start</code>, <code>llm_start</code>, <code>llm_end</code>, <code>session_end</code>.</p>

    <h2 id="multi-turn">Multi-turn usage</h2>
    <p>
      Keep your message history client-side. Every call inside the same{' '}
      <code>dp.session()</code> block belongs to one session.
    </p>

    <CodeBlock language="python">{`history = []
with dp.session(user_context_id="user_123"):
    for user_msg in ["Hi", "Tell me a joke", "Another one"]:
        history.append({"role": "user", "content": user_msg})
        resp = client.messages.create(
            model="claude-opus-4-7",
            max_tokens=512,
            messages=list(history),
        )
        history.append({"role": "assistant", "content": resp.content[0].text})`}</CodeBlock>

    <h2 id="async-streaming">Sync, async, and streaming</h2>
    <p>
      <code>dp.instrument_anthropic()</code> patches every variant in one
      call — sync and async <code>messages.create()</code>, plus both
      streaming surfaces (<code>stream=True</code> and the{' '}
      <code>messages.stream()</code> context manager) in their sync and
      async forms. Tool calls inside any variant are auto-traced.
    </p>

    <h3 id="async">Async</h3>
    <CodeBlock language="python">{`import asyncio
import anthropic
from dapplepot_sdk import DapplePot

dp = DapplePot(sdk_key="dp_sk_...", tenant_id="...", agent_id="...",
               ingest_url="https://ingest.dapplepot.com")
dp.instrument_anthropic()

client = anthropic.AsyncAnthropic(api_key="...")

async def chat():
    with dp.session(user_context_id="user_123"):
        resp = await client.messages.create(
            model="claude-opus-4-7",
            max_tokens=1024,
            messages=[{"role": "user", "content": "Hello!"}],
        )

asyncio.run(chat())`}</CodeBlock>

    <h3 id="streaming-create">Streaming via stream=True</h3>
    <CodeBlock language="python">{`with dp.session(user_context_id="user_123"):
    stream = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=512,
        messages=[{"role": "user", "content": "Tell me a story."}],
        stream=True,
    )
    for event in stream:
        if event.type == "content_block_delta" and event.delta.type == "text_delta":
            print(event.delta.text, end="", flush=True)`}</CodeBlock>

    <h3 id="streaming-context">Streaming via messages.stream()</h3>
    <p>
      Anthropic's <code>messages.stream()</code> context manager is fully
      supported — DapplePot wraps the <code>MessageStreamManager</code> so
      the trace fires at <code>__exit__</code> time.
    </p>
    <CodeBlock language="python">{`with dp.session(user_context_id="user_123"):
    with client.messages.stream(
        model="claude-opus-4-7",
        max_tokens=512,
        messages=[{"role": "user", "content": "Tell me a story."}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)`}</CodeBlock>

    <p>
      <code>llm_end</code> fires once, at stream close, with the fully
      accumulated completion. <code>tool_start</code> fires at the same
      moment if the streamed response carried a <code>tool_use</code>{' '}
      block. The streamed <code>llm_end</code> payload carries{' '}
      <code>streamed: true</code>; the dashboard renders a small "streamed"
      badge on those rows.
    </p>

    <h3 id="streaming-async">Async streaming</h3>
    <CodeBlock language="python">{`async def chat():
    with dp.session(user_context_id="user_123"):
        async with client.messages.stream(
            model="claude-opus-4-7",
            max_tokens=512,
            messages=[{"role": "user", "content": "Tell me a story."}],
        ) as stream:
            async for text in stream.text_stream:
                print(text, end="", flush=True)`}</CodeBlock>

    <Note tone="info" title="Output-content detection on streamed responses">
      Output-content checks (PII leak, secret exfiltration) fire from{' '}
      <code>llm_end</code> — for streamed responses, that happens after the
      stream has closed and your code has already iterated every chunk.
      The check still runs and a finding still lands on the timeline, but
      it cannot retroactively prevent your code from receiving the streamed
      content. Use non-streaming <code>messages.create()</code> on
      endpoints where real-time output blocking is required. Input-side
      checks (prompt injection on <code>llm_start</code>) and tool-execution
      checks (on <code>tool_start</code>) still block in real time.
    </Note>

    <h2 id="nodes">Nodes</h2>
    <p>
      Use <code>dp.node()</code> inside a session to wrap any named step into
      a traced unit. It emits <code>node_start</code> on entry and{' '}
      <code>node_end</code> on clean exit. Pass <code>input</code> to capture
      what the step received.
    </p>

    <CodeBlock language="python">{`with dp.session(user_context_id="user_123"):
    with dp.node("retrieve", input=query):
        docs = vector_store.search(query)

    with dp.node("respond"):
        response = client.messages.create(
            model="claude-opus-4-7",
            max_tokens=512,
            messages=[{"role": "user", "content": query}],
        )`}</CodeBlock>

    <h3 id="node-error">Catching node errors</h3>
    <p>
      If an exception escapes a <code>dp.node()</code> block, DapplePot emits{' '}
      <code>node_error</code> and re-raises. Catch outside the{' '}
      <code>with dp.node()</code> block but inside <code>dp.session()</code>{' '}
      to keep the session alive.
    </p>

    <CodeBlock language="python">{`with dp.session():
    try:
        with dp.node("retrieve"):
            docs = vector_store.search(query)   # raises
    except Exception:
        docs = []   # node_error already emitted; session continues

    with dp.node("respond"):
        response = client.messages.create(
            model="claude-opus-4-7",
            max_tokens=512,
            messages=[{"role": "user", "content": query}],
        )`}</CodeBlock>

    <h2 id="tool-calls">Tool calls (automatic)</h2>
    <p>
      Tool tracking is fully automatic. The SDK reads <code>tool_use</code>{' '}
      blocks from the response and <code>tool_result</code> blocks from the
      next call. You do not write any DapplePot-specific tool code.
    </p>

    <CodeBlock language="python">{`with dp.session():
    # Turn 1 — model decides to call a tool
    resp = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=512,
        tools=[{"name": "web_search", "description": "...", "input_schema": {...}}],
        messages=[{"role": "user", "content": "How tall is the Eiffel Tower?"}],
    )
    # → DapplePot auto-emits tool_start from the tool_use block in resp.content

    # Run the tool yourself...
    result = run_web_search(resp.content[0].input)

    # Turn 2 — feed the result back the standard Anthropic way
    client.messages.create(
        model="claude-opus-4-7",
        max_tokens=512,
        messages=[
            {"role": "user",      "content": "How tall is the Eiffel Tower?"},
            {"role": "assistant", "content": resp.content},
            {"role": "user", "content": [{
                "type":         "tool_result",
                "tool_use_id":  resp.content[0].id,
                "content":      result,
            }]},
        ],
    )
    # → DapplePot auto-emits tool_end before this LLM call`}</CodeBlock>

    <h3 id="tool-error">Signalling tool failures</h3>
    <p>
      Set <code>is_error: True</code> on the <code>tool_result</code> block.
      DapplePot emits <code>tool_error</code> instead of <code>tool_end</code>.
    </p>

    <CodeBlock language="python">{`{
    "type":         "tool_result",
    "tool_use_id":  resp.content[0].id,
    "content":      "Search API returned 503",
    "is_error":     True,
}`}</CodeBlock>

    <h2 id="errors">Error events</h2>
    <p>Five error events can fire from the Anthropic integration:</p>
    <ul>
      <li><code>llm_error</code> — <code>messages.create()</code> raised</li>
      <li><code>tool_error</code> — tool result flagged with <code>is_error: True</code></li>
      <li><code>node_error</code> — exception escaped a <code>dp.node()</code> block</li>
      <li><code>session_error</code> — exception escaped <code>dp.session()</code> uncaught</li>
      <li>
        <code>DapplePotBlockedError</code> / <code>DapplePotSessionTerminatedError</code> —
        raised when a security check fires with action{' '}
        <code>block_call</code> or <code>terminate_session</code>
      </li>
    </ul>

    <h3 id="recovery">Recovery — keep the session alive</h3>
    <p>
      Errors propagate only as far as the exception travels. Catch{' '}
      <code>RuntimeError</code> inside <code>dp.session()</code> and the
      session continues normally.
    </p>

    <CodeBlock language="python">{`with dp.session():
    try:
        client.messages.create(...)            # raises 503
    except RuntimeError:
        pass                                   # llm_error emitted, session alive

    client.messages.create(...)                # retry — succeeds
# → session_end fires normally, NOT session_error`}</CodeBlock>

    <h3 id="blocked">Handling blocked calls</h3>
    <p>
      Security checks configured with the <code>block_call</code> action
      raise <code>DapplePotBlockedError</code> from the LLM/tool call site —
      catch it close to the call so a fallback can return and the session
      continues. <code>terminate_session</code> raises{' '}
      <code>DapplePotSessionTerminatedError</code>; catch it at the outer
      level to exit the conversation gracefully.
    </p>

    <CodeBlock language="python">{`from dapplepot_sdk import (
    DapplePot,
    DapplePotBlockedError,
    DapplePotSessionTerminatedError,
)

try:
    with dp.session():
        try:
            resp = client.messages.create(
                model="claude-opus-4-7",
                max_tokens=1024,
                messages=[{"role": "user", "content": user_input}],
            )
        except DapplePotBlockedError as exc:
            # Single call blocked — log and recover with a fallback.
            print("Blocked:", exc.signal, exc.reason, exc.session_id)
            resp = "[Response blocked by security policy]"
except DapplePotSessionTerminatedError:
    # Whole session terminated — exit the conversation.
    # The interceptor already emitted session_error before raising.
    print("Session terminated by security policy")`}</CodeBlock>

    <p>
      The <code>DapplePotBlockedError</code> carries three useful
      attributes: <code>.signal</code> (sub-check id like{' '}
      <code>PI-01a</code>), <code>.reason</code> (human-readable
      explanation), and <code>.session_id</code> (for cross-referencing
      against the dashboard).
    </p>
  </>
);

AnthropicPage.headings = [
  { id: 'initialize',       label: 'Initialize' },
  { id: 'single-turn',      label: 'Single-turn usage' },
  { id: 'multi-turn',       label: 'Multi-turn usage' },
  { id: 'async-streaming',  label: 'Sync, async, and streaming' },
  { id: 'nodes',            label: 'Nodes' },
  { id: 'tool-calls',       label: 'Tool calls' },
  { id: 'errors',           label: 'Error events' },
];

export default AnthropicPage;
