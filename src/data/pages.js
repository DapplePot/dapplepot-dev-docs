import IntroPage      from '../pages/IntroPage.jsx';
import AnthropicPage  from '../pages/AnthropicPage.jsx';
import OpenAIPage     from '../pages/OpenAIPage.jsx';
import LangChainPage  from '../pages/LangChainPage.jsx';
import LangGraphPage  from '../pages/LangGraphPage.jsx';
import FaqsPage       from '../pages/FaqsPage.jsx';

export const SECTIONS = [
  {
    title: null,
    pages: [
      { label: 'Introduction', path: '/sdk',                              component: IntroPage },
    ],
  },
  {
    title: 'Agent frameworks',
    pages: [
      { label: 'Anthropic',   path: '/sdk/agent-frameworks/anthropic',   component: AnthropicPage },
      { label: 'OpenAI',      path: '/sdk/agent-frameworks/openai',      component: OpenAIPage },
      { label: 'LangChain',   path: '/sdk/agent-frameworks/langchain',   component: LangChainPage },
      { label: 'LangGraph',   path: '/sdk/agent-frameworks/langgraph',   component: LangGraphPage },
    ],
  },
  {
    title: 'Help',
    pages: [
      { label: 'FAQs',        path: '/sdk/help/faq',                     component: FaqsPage },
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
