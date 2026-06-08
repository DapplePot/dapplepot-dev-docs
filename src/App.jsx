import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TopBar     from './components/TopBar.jsx';
import Sidebar    from './components/Sidebar.jsx';
import PrevNext   from './components/PrevNext.jsx';
import OnThisPage from './components/OnThisPage.jsx';
import { findPage, FLAT_PAGES } from './data/pages.js';

const BASE_URL = 'https://docs.dapplepot.com';

const setMeta = (name, content, attr = 'name') => {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setJsonLd = (id, data) => {
  let el = document.querySelector(`script[data-ld="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-ld', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

const DocShell = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const page = findPage(pathname);
  const PageComponent = page.component;
  const headings = PageComponent.headings || [];

  useEffect(() => {
    const { title, description } = page.seo;
    const url = `${BASE_URL}${pathname}`;

    document.title = title;
    setMeta('description', description);
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', url, 'property');

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);

    setJsonLd('tech-article', {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: title,
      description: description,
      url: url,
      publisher: {
        '@type': 'Organization',
        name: 'DapplePot',
        url: 'https://dapplepot.com',
      },
    });
  }, [pathname, page.seo]);

  return (
    <>
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <div className="mx-auto grid max-w-[1440px] grid-cols-[16rem_minmax(0,1fr)] max-md:grid-cols-1">
        <Sidebar
          currentPath={pathname}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="grid grid-cols-[minmax(0,1fr)_14rem] gap-10 px-12 py-12 max-xl:grid-cols-1 max-xl:gap-0 max-md:px-6 max-md:py-8">
          <article className="prose min-w-0 max-w-[760px]">
            <PageComponent />
            <PrevNext pathname={pathname} />
          </article>
          <OnThisPage headings={headings} />
        </div>
      </div>
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/sdk" replace />} />
      {FLAT_PAGES.map((page) => (
        <Route key={page.path} path={page.path} element={<DocShell />} />
      ))}
      <Route path="*" element={<Navigate to="/sdk" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
