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
    sdk_key    = "dp_sk_...",
    tenant_id  = "your-tenant-id",
    agent_id   = "your-agent-id",
    ingest_url = "https://ingest.dapplepot.com",
)`}</CodeBlock>

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
      Catch them around your <code>invoke()</code>.
    </p>

    <CodeBlock language="python">{`from dapplepot_sdk import DapplePotBlockedError, DapplePotSessionTerminatedError

try:
    chain.invoke({"input": "..."}, config={"callbacks": [handler]})
except DapplePotBlockedError as exc:
    print("Blocked:", exc.signal, exc.reason)
except DapplePotSessionTerminatedError:
    print("Session terminated by security policy")`}</CodeBlock>
  </>
);

LangChainPage.headings = [
  { id: 'initialize', label: 'Initialize' },
  { id: 'usage',      label: 'Usage' },
  { id: 'nodes',      label: 'Nodes — automatic' },
  { id: 'tool-calls', label: 'Tool calls' },
  { id: 'errors',     label: 'Error events' },
];

export default LangChainPage;
