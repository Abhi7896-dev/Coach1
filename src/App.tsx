import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Academies } from '@/pages/Academies';
import { AcademyProfile } from '@/pages/AcademyProfile';
import { CoachProfile } from '@/pages/CoachProfile';
import { DeleteAccount } from '@/pages/DeleteAccount';
import { AdminLogin } from '@/pages/AdminLogin';
import { AdminPortal } from '@/pages/AdminPortal';
import { AdminResetPassword } from '@/pages/AdminResetPassword';
import { AiChatBot } from '@/components/AiChatBot';

function GlobalAiChatBot() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin') || pathname.startsWith('/login/admin') || pathname.startsWith('/reset-password/admin')) {
    return null;
  }
  return <AiChatBot />;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      // A hard reload keeps whatever hash was last in the address bar (e.g.
      // "#join" from an earlier nav click) — the browser/router would then
      // treat this exactly like a same-session anchor click and jump
      // straight there. A fresh page load should always land at the top;
      // only a real in-session anchor click (handled below, on later runs)
      // should scroll to a section.
      window.scrollTo(0, 0);
      if (hash) {
        window.history.replaceState(null, '', pathname + window.location.search);
      }
      return;
    }

    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/academies" element={<Academies />} />
        <Route path="/academy/:id" element={<AcademyProfile />} />
        <Route path="/coach/:id" element={<CoachProfile />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/reset-password/admin" element={<AdminResetPassword />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/admin/*" element={<AdminPortal />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/delete-account/" element={<DeleteAccount />} />
        <Route path="/delete-account/index.html" element={<DeleteAccount />} />
        <Route path="/delete-account.html" element={<DeleteAccount />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <GlobalAiChatBot />
    </BrowserRouter>
  );
}

export default App;
