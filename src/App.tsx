import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { DeleteAccount } from '@/pages/DeleteAccount';
import { AdminLogin } from '@/pages/AdminLogin';
import { AdminPortal } from '@/pages/AdminPortal';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
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
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/admin/*" element={<AdminPortal />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/delete-account/" element={<DeleteAccount />} />
        <Route path="/delete-account/index.html" element={<DeleteAccount />} />
        <Route path="/delete-account.html" element={<DeleteAccount />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
