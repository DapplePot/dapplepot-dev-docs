# dapplepot-dev-guide

Documentation site for the [DapplePot Python SDK](https://github.com/DapplePot/dapplepot-sdk). Built with React 19 + Vite 6 + Tailwind v4. Standard docs layout — left sidebar, main content, right "on this page" TOC — light theme, Inter + JetBrains Mono.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually <http://localhost:5173>).

## Build

```bash
npm run build
npm run preview
```

## Adding a page

1. Create a new file in `src/pages/`, for example `MyPage.jsx`.
2. Export a default component **and** attach a `headings` array — this drives the right TOC.

```jsx
import CodeBlock from '../components/CodeBlock.jsx';

const MyPage = () => (
  <>
    <span className="eyebrow">Section eyebrow</span>
    <h1>My page title</h1>
    <p className="lede">One-sentence summary.</p>

    <h2 id="install">Install</h2>
    <CodeBlock language="bash">{`pip install something`}</CodeBlock>
  </>
);

MyPage.headings = [
  { id: 'install', label: 'Install' },
];

export default MyPage;
```

3. Register it in `src/data/pages.js` under the right section of the sidebar.

The `<article className="prose">` wrapper in `App.jsx` automatically styles `<h1>`, `<h2>`, `<h3>`, `<p>`, `<ul>`, `<code>`, `<strong>`, `<a>` — see `.prose` rules in `src/index.css`. You don't need utility classes on individual prose elements.

## Routing

Single-page app with hash-based routing. `#anthropic` shows the Anthropic page, `#openai` shows the OpenAI page, etc. Sidebar clicks update the hash; the browser's back / forward buttons just work via the `hashchange` event.

In-page anchors (`href="#install"`) inside a page still scroll within that page because the routing layer only acts on top-level slugs.

## Components

Located in `src/components/`:

| Component | Purpose |
|---|---|
| `TopBar` | Sticky header with logo, GitHub link, Dashboard link, get-started CTA |
| `Sidebar` | Left navigation grouped into sections (Intro / Agent frameworks / Help) |
| `OnThisPage` | Right rail; reads `page.headings`; auto-tracks the active heading on scroll |
| `PrevNext` | Bottom pagination — prev / next page cards |
| `CodeBlock` | Syntax-highlighted code with language pill, optional filename, copy button |
| `Note` | Inline callouts — `tone="info" \| "warn" \| "success"` |

## Design tokens

Tailwind v4 `@theme` in `src/index.css` defines every color and font as a custom property — utilities like `bg-accent`, `text-ink`, `border-border`, `font-mono` are generated automatically.

| Token | Use |
|---|---|
| `--color-bg` | Page background |
| `--color-bg-soft` | Sidebar background, code-block headers |
| `--color-bg-code` | Dark code block surface |
| `--color-ink` | Primary text |
| `--color-ink-soft` | Body prose |
| `--color-muted` | Sidebar links, table-of-contents items |
| `--color-dim` | Section eyebrows in the sidebar |
| `--color-accent` | DapplePot purple, tuned for a light background |
| `--color-accent-soft` | Active-link background, inline `<code>` background |

## License

Apache 2.0 — same as the SDK.
