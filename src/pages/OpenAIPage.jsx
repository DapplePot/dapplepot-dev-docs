import CodeBlock from '../components/CodeBlock.jsx';
import Note      from '../components/Note.jsx';

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
      Create one <code>DapplePot</code> instance at startup and call{' '}
      <code>dp.instrument_openai()</code>.
    </p>

    <CodeBlock language="python">{`import openai
from dapplepot_sdk import DapplePot

dp = DapplePot(
    sdk_key    = "dp_sk_...",
    tenant_id  = "your-tenant-id",
    agent_id   = "your-agent-id",
    ingest_url = "https://ingest.dapplepot.com",
)
dp.instrument_openai()

client = openai.OpenAI(api_key="...")`}</CodeBlock>

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
        response = client.chat.completions.create(
            model="gpt-4o",
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
      <li><code>node_error</code> — exception escaped a <code>dp.node()</code> block</li>
      <li><code>session_error</code> — exception escaped <code>dp.session()</code> uncaught</li>
    </ul>

    <h3 id="recovery">Recovery example</h3>
    <CodeBlock language="python">{`with dp.session():
    try:
        client.chat.completions.create(...)    # raises 503
    except Exception:
        pass                                   # llm_error emitted, session alive

    client.chat.completions.create(...)        # retry
# → session_end fires normally`}</CodeBlock>
  </>
);

OpenAIPage.headings = [
  { id: 'initialize',  label: 'Initialize' },
  { id: 'single-turn', label: 'Single-turn usage' },
  { id: 'multi-turn',  label: 'Multi-turn usage' },
  { id: 'nodes',       label: 'Nodes' },
  { id: 'tool-calls',  label: 'Tool calls' },
  { id: 'errors',      label: 'Error events' },
];

export default OpenAIPage;
