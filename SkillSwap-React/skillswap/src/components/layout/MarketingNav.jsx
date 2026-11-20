import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../Logo.jsx';
import Icon from '../Icon.jsx';

export default function MarketingNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route or hash changes.
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  return (
    <header className="site-header">
      <nav aria-label="Main" className="container nav marketing-nav">
        <Logo />
        <button
          type="button"
          className="icon-btn nav-toggle"
          aria-expanded={open}
          aria-controls="marketing-links"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
          style={{ marginLeft: 'auto' }}
        >
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
        <div id="marketing-links" className={`nav-links${open ? ' open' : ''}`}>
          <Link className="nav-link" to="/#how">
            How it works
          </Link>
          <Link className="nav-link" to="/match">
            Find partners
          </Link>
          <Link className="nav-link" to="/#skills">
            Skills
          </Link>
          <Link className="nav-link" to="/community">
            Community
          </Link>
          <Link className="nav-link show-mobile" to="/dashboard">
            Log in
          </Link>
          <Link className="btn btn-primary btn-pill show-mobile" to="/signup" style={{ marginTop: 8 }}>
            Join free
          </Link>
        </div>
        <div className="nav-actions hide-mobile">
          <Link className="nav-link" to="/dashboard" style={{ fontWeight: 600 }}>
            Log in
          </Link>
          <Link className="btn btn-primary btn-pill" to="/signup">
            Join free
          </Link>
        </div>
      </nav>
    </header>
  );
}
