import { Link } from 'react-router-dom';
import CodeBlock from '../components/CodeBlock.jsx';
import Note      from '../components/Note.jsx';
import Xref      from '../components/Xref.jsx';

const ProductionChecklistPage = () => (
  <>
    <span className="eyebrow">How-to guide</span>
    <h1>Production Checklist</h1>
    <p className="lede">
      Credential handling, graceful shutdown, PII scrubbing, and overhead
      tuning — the operational details worth getting right before an agent
      goes live, regardless of which framework it runs on.
    </p>

    <h2 id="credentials">Credentials</h2>
    <p>
      Load <code>sdk_key</code> from an environment variable — the SDK has no
      opinion on how, but <code>os.environ.get("DAPPLEPOT_SDK_KEY")</code> is
      the common pattern. Never commit <code>sdk_key</code> to source
      control.
    </p>
    <CodeBlock language="python">{`import os
from dapplepot_sdk import DapplePot

dp = DapplePot(
    sdk_key  = os.environ["DAPPLEPOT_SDK_KEY"],
    agent_id = os.environ["DAPPLEPOT_AGENT_ID"],
)`}</CodeBlock>
    <p>
      Create exactly one <Xref>DapplePot</Xref> instance per process, at
      startup — not per request. The instance owns a background flush thread
      and an in-memory event buffer; re-creating it per request causes thread
      churn and can lose buffered events.
    </p>

    <h2 id="shutdown">Graceful shutdown</h2>
    <p>
      Call <Xref>dp.shutdown()</Xref> before your process exits so the event
      buffer flushes cleanly rather than relying on the automatic{' '}
      <code>atexit</code> hook (which doesn't run on a hard kill, and adds a
      delay right at exit either way). In a long-running server, register it
      as a proper exit hook:
    </p>
    <CodeBlock language="python">{`# FastAPI — lifespan event
from contextlib import asynccontextmanager
from fastapi import FastAPI
from dapplepot_sdk import DapplePot

dp = DapplePot(sdk_key=..., agent_id=...)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    dp.shutdown()

app = FastAPI(lifespan=lifespan)`}</CodeBlock>
    <CodeBlock language="python">{`# Flask — atexit
import atexit
from dapplepot_sdk import DapplePot

dp = DapplePot(sdk_key=..., agent_id=...)
atexit.register(dp.shutdown)`}</CodeBlock>

    <h2 id="pii">PII scrubbing</h2>
    <p>
      Pass a scrubber to the constructor so sensitive text never leaves your
      process. The built-in <Xref>RegexScrubber</Xref> covers nine common
      patterns; restrict to just what you need, or write your own by
      subclassing <Xref>BaseScrubber</Xref> — see the{' '}
      <Link to="/sdk/reference/api">API Reference</Link> for both.
    </p>
    <CodeBlock language="python">{`from dapplepot_sdk import DapplePot
from dapplepot_sdk.scrubbers import RegexScrubber

dp = DapplePot(
    sdk_key      = ...,
    agent_id     = ...,
    pii_scrubber = RegexScrubber(patterns=["email", "ssn", "aws_key"]),
    redact_keys  = ["api_key", "password"],
)`}</CodeBlock>
    <Note tone="info" title="Scrubbing runs after security checks, not before">
      Security checks always see the original, unscrubbed payload — scrubbing
      only affects what actually gets sent to the ingest API afterward. This
      is deliberate: redacting first could hide the exact content a check is
      looking for.
    </Note>

    <h2 id="overhead">Overhead &amp; tuning</h2>
    <p>
      Security checks add sub-millisecond overhead per event, evaluated
      synchronously. Network flushes happen on a background thread and never
      block your agent. Two knobs exist if you need to tune ingest volume or
      cadence:
    </p>
    <CodeBlock language="python">{`dp = DapplePot(
    sdk_key           = ...,
    agent_id          = ...,
    sample_rate       = 0.25,   # trace 1 in 4 sessions on high-throughput agents
    flush_interval_ms = 1000,   # batch less frequently
    flush_batch_size  = 250,    # larger batches per flush
)`}</CodeBlock>
    <p>
      Security checks still run on every sampled-in session regardless of
      batch tuning — <code>sample_rate</code> controls how many sessions are
      traced at all, not how the traced ones are delivered.
    </p>
  </>
);

ProductionChecklistPage.headings = [
  { id: 'credentials', label: 'Credentials' },
  { id: 'shutdown',    label: 'Graceful shutdown' },
  { id: 'pii',         label: 'PII scrubbing' },
  { id: 'overhead',    label: 'Overhead & tuning' },
];

export default ProductionChecklistPage;
