import { Link } from 'react-router-dom';
import CodeBlock from '../components/CodeBlock.jsx';
import Note      from '../components/Note.jsx';
import Xref      from '../components/Xref.jsx';

const OpenAIPage = () => (
  <>
    <span className="eyebrow">Agent framework</span>
    <h1>OpenAI</h1>
    <p className="lede">
      Use the standard <code>openai</code> Python package. DapplePot patches{' '}
      <code>chat.completions.create()</code> and captures every LLM and tool
      event automatically.
    </p>

    <h2 id="initialize">Initialize</h2>
    <p>
      Create one <Xref>DapplePot</Xref> instance at startup and call{' '}
      <Xref>dp.instrument_openai()</Xref>.
    </p>

    <CodeBlock language="python">{`import openai
from dapplepot_sdk import DapplePot

dp = DapplePot(
    sdk_key  = "dp_sk_...",
    agent_id = "your-agent-id",
)
dp.instrument_openai()

client = openai.OpenAI(api_key="...")`}</CodeBlock>

    <Note tone="info" title="Full signature">
      See the <Link to="/sdk/reference/api">API Reference</Link> for every
      constructor option, including sampling, PII scrubbing, and buffer
      tuning.
    </Note>

    <h2 id="single-turn">Single-turn usage</h2>
    <CodeBlock language="python">{`with dp.session(user_context_id="user_123"):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hello!"}],
    )`}</CodeBlock>

    <h2 id="multi-turn">Multi-turn usage</h2>
    <CodeBlock language="python">{`history = [{"role": "system", "content": "You are a helpful assistant."}]
with dp.session(user_context_id="user_123"):
    for user_msg in ["Hi", "Tell me a joke", "Another one"]:
        history.append({"role": "user", "content": user_msg})
        resp = client.chat.completions.create(model="gpt-4o", messages=history)
        history.append({"role": "assistant", "content": resp.choices[0].message.content})`}</CodeBlock>

    <h2 id="async-streaming">Sync, async, and streaming</h2>
    <p>
      <Xref>dp.instrument_openai()</Xref> patches all four variants in one
      call — sync, async, sync streaming, and async streaming. No extra
      setup, no per-call wrapping. Tool calls inside any variant are
      auto-traced.
    </p>

    <h3 id="async">Async</h3>
    <CodeBlock language="python">{`import asyncio
import openai
from dapplepot_sdk import DapplePot

dp = DapplePot(sdk_key="dp_sk_...", agent_id="your-agent-id")
dp.instrument_openai()

client = openai.AsyncOpenAI(api_key="...")

async def chat():
    with dp.session(user_context_id="user_123"):
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "Hello!"}],
        )

asyncio.run(chat())`}</CodeBlock>

    <h3 id="streaming-sync">Sync streaming</h3>
    <CodeBlock language="python">{`with dp.session(user_context_id="user_123"):
    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Tell me a story."}],
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            print(delta, end="", flush=True)`}</CodeBlock>

    <p>
      <code>llm_end</code> fires once, at stream close, with the fully
      accumulated completion. <code>tool_start</code> fires at the same
      moment if the streamed response carried tool calls. The streamed{' '}
      <code>llm_end</code> event payload carries{' '}
      <code>streamed: true</code>; the dashboard renders a small "streamed"
      badge on those rows.
    </p>

    <h3 id="streaming-async">Async streaming</h3>
    <CodeBlock language="python">{`async def chat():
    with dp.session(user_context_id="user_123"):
        stream = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "Tell me a story."}],
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                print(delta, end="", flush=True)`}</CodeBlock>

    <Note tone="info" title="Output-content detection on streamed responses">
      Output-content checks (PII leak, secret exfiltration) fire from{' '}
      <code>llm_end</code> — for streamed responses, that happens after the
      stream has closed and your code has already iterated every chunk.
      The check still runs and a finding still lands on the timeline, but
      it cannot retroactively prevent your code from receiving the streamed
      content. Use <code>stream=False</code> on endpoints where real-time
      output blocking is required. Input-side checks (prompt injection on{' '}
      <code>llm_start</code>) and tool-execution checks (on{' '}
      <code>tool_start</code>) still block in real time for streamed
      responses.
    </Note>

    <h2 id="nodes">Nodes</h2>
    <p>
      Use <Xref>dp.node()</Xref> inside a session to wrap any named step into
      a traced unit. It emits <code>node_start</code> on entry and{' '}
      <code>node_end</code> on clean exit. Pass <code>input</code> to capture
      what the step received.
    </p>

    <CodeBlock language="python">{`with dp.session(user_context_id="user_123"):
    with dp.node("retrieve", input=query):
        docs = vector_store.search(query)

    with dp.node("respond"):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": query}],
        )`}</CodeBlock>

    <h3 id="node-error">Catching node errors</h3>
    <p>
      If an exception escapes a <Xref>dp.node()</Xref> block, DapplePot emits{' '}
      <code>node_error</code> and re-raises. Catch outside the{' '}
      <code>with dp.node()</code> block but inside <Xref>dp.session()</Xref>{' '}
      to keep the session alive.
    </p>

    <CodeBlock language="python">{`with dp.session():
    try:
        with dp.node("retrieve"):
            docs = vector_store.search(query)   # raises
    except Exception:
        docs = []   # node_error already emitted; session continues

    with dp.node("respond"):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": query}],
        )`}</CodeBlock>

    <h2 id="tool-calls">Tool calls (automatic)</h2>
    <p>
      <code>tool_start</code> fires from <code>tool_calls</code> on the
      response. <code>tool_end</code> fires when the next call carries the
      matching <code>{`{"role": "tool", "tool_call_id": "..."}`}</code>{' '}
      message.
    </p>

    <CodeBlock language="python">{`with dp.session():
    # Turn 1 — model picks a tool
    resp = client.chat.completions.create(
        model="gpt-4o",
        tools=[{
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get current weather for a city",
                "parameters": {"type": "object", "properties": {"city": {"type": "string"}}},
            },
        }],
        messages=[{"role": "user", "content": "Weather in Paris?"}],
    )
    tool_call = resp.choices[0].message.tool_calls[0]
    # → DapplePot auto-emits tool_start

    # Run the tool yourself
    weather = get_weather(tool_call.function.arguments)

    # Turn 2 — pass result back the standard OpenAI way
    client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user",      "content": "Weather in Paris?"},
            {"role": "assistant", "content": None, "tool_calls": [tool_call]},
            {"role": "tool", "tool_call_id": tool_call.id, "content": weather},
        ],
    )
    # → DapplePot auto-emits tool_end before this LLM call`}</CodeBlock>

    <h3 id="tool-error">Signalling tool failures</h3>
    <p>
      Add <code>is_error: True</code> to the tool message. This is a
      DapplePot convention — OpenAI ignores extra fields, so it's safe to
      include on real requests.
    </p>

    <CodeBlock language="python">{`{
    "role":         "tool",
    "tool_call_id": tool_call.id,
    "content":      "Weather API returned 503",
    "is_error":     True,
}`}</CodeBlock>

    <Note tone="info" title="OpenAI has no native error flag">
      Anthropic ships <code>is_error</code> as part of the API. OpenAI does
      not, but the field is silently dropped by their endpoint — so the SDK
      can use it to communicate intent without breaking your request.
    </Note>

    <h2 id="errors">Error events</h2>
    <p>The OpenAI integration emits the same four error events as Anthropic:</p>
    <ul>
      <li><code>llm_error</code> — <code>chat.completions.create()</code> raised</li>
      <li><code>tool_error</code> — tool message flagged with <code>is_error: True</code></li>
      <li><code>node_error</code> — exception escaped a <Xref>dp.node()</Xref> block</li>
      <li><code>session_error</code> — exception escaped <Xref>dp.session()</Xref> uncaught</li>
    </ul>

    <h3 id="recovery">Recovery example</h3>
    <CodeBlock language="python">{`with dp.session():
    try:
        client.chat.completions.create(...)    # raises 503
    except Exception:
        pass                                   # llm_error emitted, session alive

    client.chat.completions.create(...)        # retry
# → session_end fires normally`}</CodeBlock>

    <h3 id="blocked">Handling blocked calls</h3>
    <p>
      Security checks configured with the <code>block_call</code> action
      raise <Xref>DapplePotBlockedError</Xref> from the LLM/tool call site —
      catch it close to the call so a fallback can return and the session
      continues. <code>terminate_session</code> raises{' '}
      <Xref>DapplePotSessionTerminatedError</Xref>; catch it at the outer
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
            resp = client.chat.completions.create(
                model="gpt-4o",
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
      The <Xref>DapplePotBlockedError</Xref> carries three useful
      attributes: <code>.signal</code> (sub-check id like{' '}
      <code>PI-01a</code>), <code>.reason</code> (human-readable
      explanation), and <code>.session_id</code> (for cross-referencing
      against the dashboard).
    </p>
  </>
);

OpenAIPage.headings = [
  { id: 'initialize',       label: 'Initialize' },
  { id: 'single-turn',      label: 'Single-turn usage' },
  { id: 'multi-turn',       label: 'Multi-turn usage' },
  { id: 'async-streaming',  label: 'Sync, async, and streaming' },
  { id: 'nodes',            label: 'Nodes' },
  { id: 'tool-calls',       label: 'Tool calls' },
  { id: 'errors',           label: 'Error events' },
];

export default OpenAIPage;
