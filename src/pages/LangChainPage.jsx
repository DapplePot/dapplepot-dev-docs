import CodeBlock from '../components/CodeBlock.jsx';
import Note      from '../components/Note.jsx';

const LangChainPage = () => (
  <>
    <span className="eyebrow">Agent framework</span>
    <h1>LangChain</h1>
    <p className="lede">
      LangChain fires its own callbacks during chain execution. DapplePot
      ships a callback handler — pass it on each invocation and the handler
      emits DapplePot events as the chain runs.
    </p>

    <h2 id="initialize">Initialize</h2>
    <p>
      Create the <code>DapplePot</code> instance once. There is no{' '}
      <code>instrument_*</code> call — instead you ask for a fresh callback
      handler per chain invocation.
    </p>

    <CodeBlock language="python">{`from dapplepot_sdk import DapplePot

dp = DapplePot(
    sdk_key  = "dp_sk_...",
    agent_id = "your-agent-id",
)`}</CodeBlock>

    <Note tone="info" title="Full signature">
      See the <a href="/sdk/reference/api">API Reference</a> for every
      constructor option, including sampling, PII scrubbing, and buffer
      tuning.
    </Note>

    <h2 id="usage">Usage</h2>
    <p>
      Get a handler with <code>dp.callback_handler()</code> and pass it in
      the run config. One handler == one session.
    </p>

    <CodeBlock language="python">{`from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{input}"),
])
chain = prompt | ChatOpenAI(model="gpt-4o")

handler = dp.callback_handler(user_context_id="user_123")
result  = chain.invoke({"input": "Hello!"}, config={"callbacks": [handler]})`}</CodeBlock>

    <Note tone="info" title="One handler per invocation">
      Each <code>callback_handler()</code> call yields a session. Re-use it
      across <code>invoke()</code> calls only if those calls form a single
      logical session.
    </Note>

    <h2 id="async-streaming">Async, streaming, and callback propagation</h2>
    <p>
      Streaming and async are handled <em>inside</em> LangChain — DapplePot
      sees the lifecycle events (<code>on_chat_model_start</code>,{' '}
      <code>on_llm_end</code>), not the raw stream. You don't need to do
      anything different for streaming chains; <code>llm_start</code> and{' '}
      <code>llm_end</code> fire normally with the accumulated response.
    </p>

    <Note tone="warn" title="Async callback propagation — must thread through RunnableConfig">
      In async LangChain (<code>ainvoke</code>, <code>astream</code>) the
      framework does not always propagate callbacks to child runs
      automatically. Always pass the handler explicitly via the run config:
    </Note>

    <CodeBlock language="python">{`handler = dp.callback_handler(user_context_id="user_42")

result = await chain.ainvoke(
    {"input": "Hello"},
    config={"callbacks": [handler]},   # required for async
)`}</CodeBlock>

    <p>
      If your trace shows <code>session_start</code> followed by silence
      in an async chain, this is almost always the cause.
    </p>

    <h2 id="nodes">Nodes — automatic</h2>
    <p>
      Each named LCEL component (prompt templates, retrieval lambdas, output
      parsers, …) becomes a <code>node_start</code> / <code>node_end</code>{' '}
      pair. Name your <code>RunnableLambda</code>s with{' '}
      <code>.with_config(run_name="…")</code> so they show up clearly in the
      trace.
    </p>

    <CodeBlock language="python">{`from langchain_core.runnables import RunnableLambda

def retrieve(query: str) -> dict:
    docs = vector_store.search(query)
    return {"context": "\\n".join(docs), "input": query}

chain = (
    RunnableLambda(retrieve).with_config(run_name="retrieval")
    | prompt
    | ChatOpenAI(model="gpt-4o")
)`}</CodeBlock>

    <h2 id="tool-calls">Tool calls</h2>
    <p>
      Tools registered through LangChain's <code>BaseTool</code> interface
      fire their own callbacks; DapplePot's handler maps them to{' '}
      <code>tool_start</code> and <code>tool_end</code>.
    </p>

    <CodeBlock language="python">{`from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    return f"{city}: 18 °C, partly cloudy."

llm_with_tools = ChatOpenAI(model="gpt-4o").bind_tools([get_weather])`}</CodeBlock>

    <h2 id="errors">Error events</h2>
    <ul>
      <li>
        <code>llm_error</code> — LLM step raised. The SDK fires this from{' '}
        <code>on_llm_error</code>.
      </li>
      <li>
        <code>tool_error</code> — tool raised. The SDK fires this from{' '}
        <code>on_tool_error</code>.
      </li>
      <li>
        <code>node_error</code> — child chain step raised.
      </li>
      <li>
        <code>session_error</code> — root chain raised; the whole invocation
        failed.
      </li>
    </ul>

    <h3 id="recovery">Recovery</h3>
    <p>
      Errors caught inside a node keep the session alive. Errors that escape
      the root <code>invoke()</code> end the session.
    </p>

    <CodeBlock language="python">{`# Inside a RunnableLambda — catch and recover
def safe_step(input):
    try:
        return upstream_call(input)
    except Exception:
        return "fallback"     # llm_error/node_error already emitted; session continues

# Outside — let it bubble
try:
    result = chain.invoke({"input": "Hello"}, config={"callbacks": [handler]})
except Exception:
    pass    # session_error already emitted`}</CodeBlock>

    <h3 id="blocked">Handling blocked calls</h3>
    <p>
      Security checks raise <code>DapplePotBlockedError</code> /{' '}
      <code>DapplePotSessionTerminatedError</code> from inside the chain.
      The two have different catch sites:
    </p>

    <ul>
      <li>
        <code>DapplePotBlockedError</code> — catch <strong>inside each
        pipeline step</strong> so the step can return a graceful fallback
        and the chain continues to completion. DapplePot intercepts at
        both <code>on_chat_model_start</code> and <code>on_tool_start</code>,
        so either an LLM call or a tool call can raise it.
      </li>
      <li>
        <code>DapplePotSessionTerminatedError</code> — catch at the{' '}
        <strong>root</strong>, around <code>chain.invoke()</code>. The
        interceptor already emitted <code>session_error</code> before
        raising; you only need to exit gracefully.
      </li>
    </ul>

    <CodeBlock language="python">{`from dapplepot_sdk import DapplePotBlockedError, DapplePotSessionTerminatedError

# Pattern 1 — inside each step, catch and fall back
def classify_step(input, config):
    try:
        return llm.invoke([SystemMessage(...), HumanMessage(content=input["query"])],
                          config=config)
    except DapplePotBlockedError as exc:
        # Step blocked — return a safe fallback so the chain continues
        return {**input, "intent": "NONE"}

# Pattern 2 — at the root, only handle full-session termination
try:
    chain.invoke({"input": "..."}, config={"callbacks": [handler]})
except DapplePotSessionTerminatedError:
    print("Session terminated by security policy")
    # The session is permanently closed; no further invocations allowed`}</CodeBlock>

    <p>
      The <code>DapplePotBlockedError</code> carries{' '}
      <code>.signal</code>, <code>.reason</code>, and{' '}
      <code>.session_id</code> — log <code>.signal</code> (e.g.{' '}
      <code>PI-01a</code>) in your fallback so the trace is searchable
      against the dashboard.
    </p>
  </>
);

LangChainPage.headings = [
  { id: 'initialize',       label: 'Initialize' },
  { id: 'usage',            label: 'Usage' },
  { id: 'async-streaming',  label: 'Async, streaming, and callback propagation' },
  { id: 'nodes',            label: 'Nodes — automatic' },
  { id: 'tool-calls',       label: 'Tool calls' },
  { id: 'errors',           label: 'Error events' },
];

export default LangChainPage;
