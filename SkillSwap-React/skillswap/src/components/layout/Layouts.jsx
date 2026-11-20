import { Outlet } from 'react-router-dom';
import MarketingNav from './MarketingNav.jsx';
import AppNav from './AppNav.jsx';
import Footer from './Footer.jsx';
import './Layout.css';

export function MarketingLayout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <MarketingNav />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export function AppLayout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AppNav />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
