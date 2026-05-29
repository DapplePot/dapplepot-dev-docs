import CodeBlock from '../components/CodeBlock.jsx';
import Note      from '../components/Note.jsx';

const LangGraphPage = () => (
  <>
    <span className="eyebrow">Agent framework</span>
    <h1>LangGraph</h1>
    <p className="lede">
      Same callback model as LangChain. Each graph node becomes a named{' '}
      <code>node_start</code> / <code>node_end</code> pair; the graph
      invocation itself is the session.
    </p>

    <h2 id="initialize">Initialize</h2>
    <p>
      Same as LangChain — one <code>DapplePot</code> instance, then{' '}
      <code>callback_handler()</code> per graph run.
    </p>

    <CodeBlock language="python">{`from dapplepot_sdk import DapplePot

dp = DapplePot(
    sdk_key    = "dp_sk_...",
    tenant_id  = "your-tenant-id",
    agent_id   = "your-agent-id",
    ingest_url = "https://ingest.dapplepot.com",
)`}</CodeBlock>

    <h2 id="usage">Usage</h2>
    <CodeBlock language="python">{`from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

def agent(state):
    return {"messages": [llm.invoke(state["messages"])]}

graph = StateGraph(dict)
graph.add_node("agent", agent)
graph.add_edge(START, "agent")
graph.add_edge("agent", END)
app = graph.compile()

handler = dp.callback_handler(user_context_id="user_123")
result  = app.invoke(
    {"messages": [HumanMessage(content="Hello!")]},
    config={"callbacks": [handler]},
)`}</CodeBlock>

    <p>
      The graph node named <code>"agent"</code> becomes a{' '}
      <code>node_start</code> with <code>node_name="agent"</code>. The whole{' '}
      <code>app.invoke()</code> becomes one session.
    </p>

    <h2 id="multi-node">Multi-node pipelines</h2>
    <p>
      Every node fires its own <code>node_start</code> / <code>node_end</code>{' '}
      pair, so a multi-step pipeline shows up as a clean sequence in the
      trace UI.
    </p>

    <CodeBlock language="python">{`def classify(state):
    return {"intent": llm.invoke([HumanMessage(content=state["query"])]).content}

def retrieve(state):
    return {"context": vector_store.search(state["intent"])}

def respond(state):
    return {"reply": llm.invoke([HumanMessage(content=state["context"] + state["query"])]).content}

graph = StateGraph(dict)
graph.add_node("classify", classify)
graph.add_node("retrieve", retrieve)
graph.add_node("respond",  respond)
graph.add_edge(START,      "classify")
graph.add_edge("classify", "retrieve")
graph.add_edge("retrieve", "respond")
graph.add_edge("respond",  END)
app = graph.compile()`}</CodeBlock>

    <h2 id="tool-calls">Tool calls — ToolNode</h2>
    <p>
      Tools wrapped in <code>ToolNode</code> emit <code>tool_start</code> /{' '}
      <code>tool_end</code> automatically.
    </p>

    <CodeBlock language="python">{`from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    return f"{city}: 18 °C, partly cloudy."

graph = StateGraph(dict)
graph.add_node("agent", agent)
graph.add_node("tools", ToolNode([get_weather], handle_tool_errors=False))
graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_continue)
graph.add_edge("tools", "agent")
app = graph.compile()`}</CodeBlock>

    <Note tone="warn" title="Tool errors require handle_tool_errors=False">
      The default <code>handle_tool_errors=True</code> swallows exceptions
      inside <code>ToolNode</code> before the callback fires, so{' '}
      <code>tool_error</code> never gets emitted. Set it to{' '}
      <code>False</code> if you want failed tools to surface in DapplePot.
    </Note>

    <h2 id="errors">Error events</h2>
    <ul>
      <li><code>llm_error</code> — an LLM call inside a node raised</li>
      <li><code>tool_error</code> — a tool in a <code>ToolNode</code> raised (when <code>handle_tool_errors=False</code>)</li>
      <li><code>node_error</code> — a graph node function raised</li>
      <li><code>session_error</code> — error escaped the root graph invocation</li>
    </ul>

    <h3 id="recovery">Recovery — catching inside a node</h3>
    <p>
      Errors caught inside a node keep the graph alive — the node returns
      normally, the next node runs, the session ends with <code>session_end</code>.
    </p>

    <CodeBlock language="python">{`def agent_with_retry(state):
    try:
        return {"messages": [llm.invoke(state["messages"])]}
    except Exception:
        # llm_error already emitted; fall back gracefully
        return {"messages": [HumanMessage(content="I'm having trouble — please try again.")]}`}</CodeBlock>

    <h3 id="blocked">Handling blocked calls</h3>
    <CodeBlock language="python">{`from dapplepot_sdk import DapplePotBlockedError, DapplePotSessionTerminatedError

try:
    app.invoke(initial_state, config={"callbacks": [handler]})
except DapplePotBlockedError as exc:
    print("Blocked:", exc.signal, exc.reason)
except DapplePotSessionTerminatedError:
    print("Session terminated by security policy")`}</CodeBlock>
  </>
);

LangGraphPage.headings = [
  { id: 'initialize',  label: 'Initialize' },
  { id: 'usage',       label: 'Usage' },
  { id: 'multi-node',  label: 'Multi-node pipelines' },
  { id: 'tool-calls',  label: 'Tool calls — ToolNode' },
  { id: 'errors',      label: 'Error events' },
];

export default LangGraphPage;
