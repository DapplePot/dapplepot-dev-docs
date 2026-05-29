import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TopBar     from './components/TopBar.jsx';
import Sidebar    from './components/Sidebar.jsx';
import PrevNext   from './components/PrevNext.jsx';
import OnThisPage from './components/OnThisPage.jsx';
import { findPage, FLAT_PAGES } from './data/pages.js';

const DocShell = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const page = findPage(pathname);
  const PageComponent = page.component;
  const headings = PageComponent.headings || [];

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
