import IntroPage               from '../pages/IntroPage.jsx';
import AnthropicPage           from '../pages/AnthropicPage.jsx';
import OpenAIPage              from '../pages/OpenAIPage.jsx';
import LangChainPage           from '../pages/LangChainPage.jsx';
import LangGraphPage           from '../pages/LangGraphPage.jsx';
import FaqsPage                from '../pages/FaqsPage.jsx';
import ApiReferencePage        from '../pages/ApiReferencePage.jsx';
import ProductionChecklistPage from '../pages/ProductionChecklistPage.jsx';

export const SECTIONS = [
  {
    title: null,
    pages: [
      {
        label: 'Getting Started',
        path: '/sdk',
        component: IntroPage,
        seo: {
          title: "Getting Started · DapplePot Python SDK",
          description: 'Runtime security, session replay, and real-time threat detection for AI agents — in a few lines of code. Drop-in integrations for Anthropic, OpenAI, LangChain, and LangGraph.',
        },
      },
    ],
  },
  {
    title: 'Agent frameworks',
    pages: [
      {
        label: 'Anthropic',
        path: '/sdk/agent-frameworks/anthropic',
        component: AnthropicPage,
        seo: {
          title: 'Anthropic Integration · DapplePot Python SDK',
          description: 'Instrument your Anthropic Claude agent with DapplePot. Auto-patches messages.create() to capture every LLM and tool event with real-time security checks.',
        },
      },
      {
        label: 'OpenAI',
        path: '/sdk/agent-frameworks/openai',
        component: OpenAIPage,
        seo: {
          title: 'OpenAI Integration · DapplePot Python SDK',
          description: 'Instrument your OpenAI agent with DapplePot. Auto-patches chat.completions.create() for full LLM and tool event capture with real-time threat detection.',
        },
      },
      {
        label: 'LangChain',
        path: '/sdk/agent-frameworks/langchain',
        component: LangChainPage,
        seo: {
          title: 'LangChain Integration · DapplePot Python SDK',
          description: 'Add DapplePot security monitoring to LangChain agents using the built-in callback handler. Capture every chain event with zero boilerplate.',
        },
      },
      {
        label: 'LangGraph',
        path: '/sdk/agent-frameworks/langgraph',
        component: LangGraphPage,
        seo: {
          title: 'LangGraph Integration · DapplePot Python SDK',
          description: 'Monitor LangGraph agents with DapplePot. Each graph node becomes a named trace pair, giving full visibility and security across every step.',
        },
      },
    ],
  },
  {
    title: 'Guides',
    pages: [
      {
        label: 'Production Checklist',
        path: '/sdk/guides/production-checklist',
        component: ProductionChecklistPage,
        seo: {
          title: 'Production Checklist · DapplePot Python SDK',
          description: 'Credential handling, graceful shutdown, PII scrubbing, and overhead tuning before you ship a DapplePot integration to production.',
        },
      },
    ],
  },
  {
    title: 'Reference',
    pages: [
      {
        label: 'API Reference',
        path: '/sdk/reference/api',
        component: ApiReferencePage,
        seo: {
          title: 'API Reference · DapplePot Python SDK',
          description: 'Auto-generated API reference for the DapplePot Python SDK, sourced directly from the package docstrings — always in sync with the installed version.',
        },
      },
    ],
  },
  {
    title: 'Help',
    pages: [
      {
        label: 'FAQs',
        path: '/sdk/help/faq',
        component: FaqsPage,
        seo: {
          title: 'FAQs · DapplePot Python SDK',
          description: 'Answers to common questions about installing, configuring, and using the DapplePot Python SDK for AI agent security monitoring.',
        },
      },
    ],
  },
];

export const FLAT_PAGES = SECTIONS.flatMap((s) => s.pages);

export const findPage = (pathname) =>
  FLAT_PAGES.find((p) => p.path === pathname) ?? FLAT_PAGES[0];

export const findAdjacent = (pathname) => {
  const idx = FLAT_PAGES.findIndex((p) => p.path === pathname);
  return {
    prev: idx > 0               ? FLAT_PAGES[idx - 1] : null,
    next: idx < FLAT_PAGES.length - 1 ? FLAT_PAGES[idx + 1] : null,
  };
};
